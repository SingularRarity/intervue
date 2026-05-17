//! Lightweight in-memory security helpers:
//!   - OAuth state store (CSRF protection for /api/v1/oauth/google)
//!   - Rate limiter (per-IP token bucket for auth endpoints)
//!
//! These are in-process; for horizontal scaling they need to move to Redis.

use axum::{
    extract::{ConnectInfo, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Mutex;
use std::time::{Duration, Instant};

// ---------------------------------------------------------------------------
// OAuth state store
// ---------------------------------------------------------------------------

static OAUTH_STATE: Lazy<Mutex<HashMap<String, Instant>>> = Lazy::new(|| Mutex::new(HashMap::new()));
const OAUTH_STATE_TTL: Duration = Duration::from_secs(600); // 10 min

pub fn issue_oauth_state(state: String) {
    let mut s = OAUTH_STATE.lock().unwrap();
    // Opportunistic cleanup
    let now = Instant::now();
    s.retain(|_, t| now.duration_since(*t) < OAUTH_STATE_TTL);
    s.insert(state, now);
}

/// Returns true if the state was issued recently and is now consumed (single-use).
pub fn consume_oauth_state(state: &str) -> bool {
    let mut s = OAUTH_STATE.lock().unwrap();
    if let Some(issued) = s.remove(state) {
        return Instant::now().duration_since(issued) < OAUTH_STATE_TTL;
    }
    false
}

// ---------------------------------------------------------------------------
// Rate limiter (per-IP token bucket)
// ---------------------------------------------------------------------------

#[derive(Clone, Copy)]
struct Bucket {
    tokens: f64,
    last_refill: Instant,
}

struct RateLimitConfig {
    capacity: f64,           // max tokens
    refill_per_sec: f64,     // tokens added per second
}

static RATE_LIMIT_STATE: Lazy<Mutex<HashMap<String, Bucket>>> = Lazy::new(|| Mutex::new(HashMap::new()));

// 10 attempts per minute → 1 token / 6s, capacity 10
const AUTH_RATE: RateLimitConfig = RateLimitConfig {
    capacity: 10.0,
    refill_per_sec: 10.0 / 60.0,
};

fn take_token(key: &str, cfg: &RateLimitConfig) -> bool {
    let now = Instant::now();
    let mut state = RATE_LIMIT_STATE.lock().unwrap();
    let bucket = state.entry(key.to_string()).or_insert(Bucket {
        tokens: cfg.capacity,
        last_refill: now,
    });
    let elapsed = now.duration_since(bucket.last_refill).as_secs_f64();
    bucket.tokens = (bucket.tokens + elapsed * cfg.refill_per_sec).min(cfg.capacity);
    bucket.last_refill = now;
    if bucket.tokens >= 1.0 {
        bucket.tokens -= 1.0;
        true
    } else {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rate_limiter_allows_burst_then_blocks() {
        let cfg = RateLimitConfig { capacity: 5.0, refill_per_sec: 0.0 };
        let key = "test-ip-burst";
        // First `capacity` calls succeed
        for i in 0..5 {
            assert!(take_token(key, &cfg), "call {i} should be allowed");
        }
        // The next is blocked (bucket empty, no refill)
        assert!(!take_token(key, &cfg), "6th call should be rate-limited");
    }

    #[test]
    fn oauth_state_is_single_use() {
        let token = "state-abc-123".to_string();
        issue_oauth_state(token.clone());
        assert!(consume_oauth_state(&token), "freshly issued state should validate");
        assert!(!consume_oauth_state(&token), "state must not be reusable");
    }

    #[test]
    fn oauth_state_rejects_unknown() {
        assert!(!consume_oauth_state("never-issued-state"));
    }
}

/// Middleware: rate-limit by peer IP on the auth endpoints.
/// Applied as a `route_layer` on /api/v1/tenants/login, /api/v1/admin/auth/login,
/// /api/v1/team/accept-invite. ConnectInfo<SocketAddr> requires
/// `into_make_service_with_connect_info::<SocketAddr>` at server bind.
pub async fn auth_rate_limit(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let key = addr.ip().to_string();
    if !take_token(&key, &AUTH_RATE) {
        tracing::warn!("rate limit hit on auth endpoint from {key}");
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }
    Ok(next.run(request).await)
}
