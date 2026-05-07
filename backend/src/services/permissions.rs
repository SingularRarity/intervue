use arc_swap::ArcSwap;
use std::collections::HashMap;
use std::sync::Arc;
use sqlx::PgPool;

use crate::models::TenantRole;

type PermKey = (String, String, String); // (module, action, role)

/// In-memory permission cache, reloaded from DB when god admin makes changes.
/// Falls back to hardcoded defaults when a key is absent from the cache.
pub struct PermissionService {
    pool: PgPool,
    cache: ArcSwap<HashMap<PermKey, bool>>,
}

impl PermissionService {
    pub async fn new(pool: PgPool) -> anyhow::Result<Self> {
        let svc = Self {
            pool,
            cache: ArcSwap::from_pointee(HashMap::new()),
        };
        svc.reload().await?;
        Ok(svc)
    }

    pub async fn reload(&self) -> anyhow::Result<()> {
        let rows = sqlx::query!(
            "SELECT module, action, role::TEXT as role, allowed FROM role_permissions"
        )
        .fetch_all(&self.pool)
        .await?;

        let mut map = HashMap::with_capacity(rows.len());
        for row in rows {
            if let (Some(module), Some(action), Some(role), Some(allowed)) =
                (Some(row.module), Some(row.action), row.role, Some(row.allowed))
            {
                map.insert((module, action, role), allowed);
            }
        }

        self.cache.store(Arc::new(map));
        tracing::info!("Permission cache reloaded ({} rules)", self.cache.load().len());
        Ok(())
    }

    pub async fn is_allowed(&self, role: TenantRole, module: &str, action: &str) -> bool {
        let role_str = role.to_string();
        let key = (module.to_string(), action.to_string(), role_str.clone());

        // DB-driven value wins if present
        if let Some(&allowed) = self.cache.load().get(&key) {
            return allowed;
        }

        // Hardcoded fallback matrix
        default_allow(role, module, action)
    }
}

/// Hardcoded default permission matrix.
/// DB entries override these; this is the fallback when the DB has no row.
fn default_allow(role: TenantRole, module: &str, action: &str) -> bool {
    match role {
        TenantRole::TenantAdmin => true, // admin can do everything by default
        TenantRole::Manager => matches!(
            (module, action),
            ("interviews", "read")
            | ("interviews", "create")
            | ("interviews", "update")
            | ("candidates", "read")
            | ("candidates", "create")
            | ("candidates", "update")
            | ("candidates", "delete")
            | ("sessions", "read")
            | ("sessions", "create")
            | ("sessions", "feedback")
            | ("analytics", "read")
            | ("analytics", "advanced")
            | ("team", "read")
            | ("billing", "contact")
            | ("branding", "read")
        ),
        TenantRole::Interviewer => matches!(
            (module, action),
            ("interviews", "read")
            | ("candidates", "read")
            | ("candidates", "create")
            | ("sessions", "read")
            | ("sessions", "create")
            | ("sessions", "feedback")
            | ("branding", "read")
        ),
        TenantRole::Viewer => matches!(
            (module, action),
            ("interviews", "read")
            | ("candidates", "read")
            | ("sessions", "read")
            | ("analytics", "read")
            | ("branding", "read")
        ),
    }
}
