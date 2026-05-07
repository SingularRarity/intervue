use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    Extension,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    auth::ResolvedClaims,
    models::{InviteUserRequest, TenantRole, TenantUserResponse, UpdateUserRoleRequest},
    AppState,
};

fn require_admin(claims: &ResolvedClaims) -> Result<(), StatusCode> {
    if matches!(claims.role, TenantRole::TenantAdmin | TenantRole::Manager) {
        Ok(())
    } else {
        Err(StatusCode::FORBIDDEN)
    }
}

// ---------------------------------------------------------------------------
// List team members
// ---------------------------------------------------------------------------

pub async fn list_team(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
) -> Result<Json<Vec<TenantUserResponse>>, StatusCode> {
    let rows = sqlx::query_as::<_, crate::models::TenantUser>(
        "SELECT id, tenant_id, email, full_name, role, is_active, invited_by, accepted_at, last_login_at, created_at
         FROM tenant_users WHERE tenant_id = $1 ORDER BY created_at DESC",
    )
    .bind(claims.tenant_id)
    .fetch_all(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows.into_iter().map(TenantUserResponse::from).collect()))
}

// ---------------------------------------------------------------------------
// Invite a user
// ---------------------------------------------------------------------------

#[derive(Serialize)]
pub struct InviteResponse {
    pub id: Uuid,
    pub email: String,
    pub role: TenantRole,
    pub invite_token: String,
}

pub async fn invite_member(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
    Json(body): Json<InviteUserRequest>,
) -> Result<Json<InviteResponse>, StatusCode> {
    require_admin(&claims)?;

    // Managers cannot invite TenantAdmin level users
    if claims.role == TenantRole::Manager && body.role == TenantRole::TenantAdmin {
        return Err(StatusCode::FORBIDDEN);
    }

    let id = Uuid::new_v4();
    let token = Uuid::new_v4().to_string().replace('-', "");

    sqlx::query!(
        r#"INSERT INTO tenant_users (id, tenant_id, email, full_name, role, is_active, invited_by, invite_token)
           VALUES ($1, $2, $3, $4, $5, false, $6, $7)
           ON CONFLICT (tenant_id, email) DO UPDATE
             SET role = EXCLUDED.role,
                 full_name = COALESCE(EXCLUDED.full_name, tenant_users.full_name),
                 invite_token = EXCLUDED.invite_token,
                 invited_by = EXCLUDED.invited_by"#,
        id,
        claims.tenant_id,
        body.email,
        body.full_name,
        body.role as TenantRole,
        claims.user_id,
        &token,
    )
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(InviteResponse {
        id,
        email: body.email,
        role: body.role,
        invite_token: token,
    }))
}

// ---------------------------------------------------------------------------
// Accept an invite (public — token in URL, no JWT required)
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct AcceptInviteRequest {
    pub token: String,
    pub password: String,
    pub full_name: Option<String>,
}

pub async fn accept_invite(
    State(state): State<Arc<AppState>>,
    Json(body): Json<AcceptInviteRequest>,
) -> Result<StatusCode, StatusCode> {
    let row = sqlx::query!(
        "SELECT id, tenant_id, email FROM tenant_users WHERE invite_token = $1 AND is_active = false",
        body.token,
    )
    .fetch_optional(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let hash = crate::auth::hash_password(&body.password)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    sqlx::query!(
        r#"UPDATE tenant_users
           SET is_active = true,
               password_hash = $1,
               full_name = COALESCE($2, full_name),
               accepted_at = NOW(),
               invite_token = NULL
           WHERE id = $3"#,
        hash,
        body.full_name,
        row.id,
    )
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------
// Update role
// ---------------------------------------------------------------------------

pub async fn update_role(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
    Path(user_id): Path<Uuid>,
    Json(body): Json<UpdateUserRoleRequest>,
) -> Result<StatusCode, StatusCode> {
    require_admin(&claims)?;

    // Managers cannot promote to tenant_admin
    if claims.role == TenantRole::Manager && body.role == TenantRole::TenantAdmin {
        return Err(StatusCode::FORBIDDEN);
    }

    let affected = sqlx::query!(
        "UPDATE tenant_users SET role = $1 WHERE id = $2 AND tenant_id = $3",
        body.role as TenantRole,
        user_id,
        claims.tenant_id,
    )
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .rows_affected();

    if affected == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------
// Deactivate / remove a user
// ---------------------------------------------------------------------------

pub async fn remove_member(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
    Path(user_id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    require_admin(&claims)?;

    // Cannot remove yourself
    if claims.user_id == Some(user_id) {
        return Err(StatusCode::CONFLICT);
    }

    let affected = sqlx::query!(
        "UPDATE tenant_users SET is_active = false WHERE id = $1 AND tenant_id = $2",
        user_id,
        claims.tenant_id,
    )
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .rows_affected();

    if affected == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(StatusCode::NO_CONTENT)
}
