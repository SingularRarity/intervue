use axum::{
    extract::{Query, State, Path, WebSocketUpgrade},
    http::StatusCode,
    response::Response,
};
use futures::stream::StreamExt;
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    auth::{verify_tenant_user_token, verify_token},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct WsAuthQuery {
    /// JWT bearer token — required for interviewer/tenant connections.
    /// Browsers can't set Authorization headers on WS upgrades, so we accept via query param.
    pub token: Option<String>,
    /// Opaque candidate_token from candidate_portal.generate_candidate_token —
    /// used when a candidate (no JWT) joins their own interview.
    pub candidate_token: Option<String>,
}

pub async fn interview_websocket(
    State(state): State<Arc<AppState>>,
    Path(session_id): Path<Uuid>,
    Query(q): Query<WsAuthQuery>,
    ws: WebSocketUpgrade,
) -> Result<Response, StatusCode> {
    // Resolve who's connecting + which tenant the session must belong to.
    let session_tenant: Uuid = sqlx::query_scalar(
        "SELECT tenant_id FROM interview_sessions WHERE id = $1"
    )
    .bind(session_id)
    .fetch_optional(state.db.pool())
    .await
    .map_err(|e| {
        tracing::error!("ws auth: session lookup failed: {e}");
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Path A: JWT token (interviewer / HR)
    if let Some(token) = q.token.as_deref() {
        let secret = &state.config.jwt_secret;
        // v2 tenant user token
        if let Ok(tu) = verify_tenant_user_token(token, secret) {
            if tu.tenant_id != session_tenant {
                tracing::warn!("ws auth: tenant mismatch (token={}, session={})", tu.tenant_id, session_tenant);
                return Err(StatusCode::FORBIDDEN);
            }
            return Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, session_id)));
        }
        // v1 legacy token (tenant_id as sub)
        if let Ok(legacy) = verify_token(token, secret) {
            if legacy.sub != session_tenant {
                tracing::warn!("ws auth: tenant mismatch (legacy token sub={}, session={})", legacy.sub, session_tenant);
                return Err(StatusCode::FORBIDDEN);
            }
            return Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, session_id)));
        }
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Path B: candidate_token (no JWT, candidate-side)
    if let Some(ct) = q.candidate_token.as_deref() {
        let valid: Option<Uuid> = sqlx::query_scalar(
            "SELECT id FROM interview_sessions WHERE id = $1 AND candidate_token = $2"
        )
        .bind(session_id)
        .bind(ct)
        .fetch_optional(state.db.pool())
        .await
        .map_err(|e| {
            tracing::error!("ws auth: candidate_token lookup failed: {e}");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

        if valid.is_some() {
            return Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, session_id)));
        }
        return Err(StatusCode::UNAUTHORIZED);
    }

    Err(StatusCode::UNAUTHORIZED)
}

async fn handle_socket(
    mut socket: axum::extract::ws::WebSocket,
    state: Arc<AppState>,
    session_id: Uuid,
) {
    // Update session status to InProgress
    if let Err(e) = sqlx::query(
        "UPDATE interview_sessions SET status = 'InProgress', started_at = NOW() WHERE id = $1"
    )
    .bind(session_id)
    .execute(state.db.pool())
    .await {
        tracing::error!("ws: failed to mark session {session_id} InProgress: {e}");
    }

    // Send welcome message
    let welcome = serde_json::json!({
        "type": "system",
        "message": "Interview session started. Please ensure your microphone is enabled.",
        "session_id": session_id.to_string(),
    });

    if socket.send(axum::extract::ws::Message::Text(welcome.to_string())).await.is_err() {
        return;
    }

    // Main WebSocket loop
    while let Some(Ok(msg)) = socket.next().await {
        match msg {
            axum::extract::ws::Message::Text(text) => {
                match serde_json::from_str::<serde_json::Value>(&text) {
                    Ok(data) => {
                        let msg_type = data.get("type").and_then(|v| v.as_str()).unwrap_or("unknown");

                        match msg_type {
                            "audio_chunk" => {
                                let response = serde_json::json!({
                                    "type": "processing",
                                    "message": "Processing your response...",
                                });
                                let _ = socket.send(axum::extract::ws::Message::Text(response.to_string())).await;

                                match state.interview_engine.process_audio_chunk(session_id, &data).await {
                                    Ok(result) => {
                                        let _ = socket.send(axum::extract::ws::Message::Text(
                                            serde_json::to_string(&result).unwrap_or_default()
                                        )).await;
                                    }
                                    Err(e) => {
                                        tracing::error!("ws: audio processing failed for session {session_id}: {e}");
                                        let error = serde_json::json!({
                                            "type": "error",
                                            "message": "Audio processing failed. Please retry.",
                                        });
                                        let _ = socket.send(axum::extract::ws::Message::Text(error.to_string())).await;
                                    }
                                }
                            }
                            "text_message" => {
                                if let Some(content) = data.get("content").and_then(|v| v.as_str()) {
                                    match state.interview_engine.process_text_message(session_id, content).await {
                                        Ok(result) => {
                                            let _ = socket.send(axum::extract::ws::Message::Text(
                                                serde_json::to_string(&result).unwrap_or_default()
                                            )).await;
                                        }
                                        Err(e) => {
                                            tracing::error!("ws: text processing failed for session {session_id}: {e}");
                                            let error = serde_json::json!({
                                                "type": "error",
                                                "message": "Message processing failed. Please retry.",
                                            });
                                            let _ = socket.send(axum::extract::ws::Message::Text(error.to_string())).await;
                                        }
                                    }
                                }
                            }
                            "end_interview" => {
                                match state.interview_engine.finalize_interview(session_id).await {
                                    Ok(result) => {
                                        let _ = socket.send(axum::extract::ws::Message::Text(
                                            serde_json::to_string(&result).unwrap_or_default()
                                        )).await;
                                    }
                                    Err(e) => {
                                        tracing::error!("ws: finalization failed for session {session_id}: {e}");
                                        let error = serde_json::json!({
                                            "type": "error",
                                            "message": "Finalization failed. Please retry.",
                                        });
                                        let _ = socket.send(axum::extract::ws::Message::Text(error.to_string())).await;
                                    }
                                }
                                break;
                            }
                            _ => {
                                let error = serde_json::json!({
                                    "type": "error",
                                    "message": "Unknown message type",
                                });
                                let _ = socket.send(axum::extract::ws::Message::Text(error.to_string())).await;
                            }
                        }
                    }
                    Err(_) => {
                        // Don't echo the parse error — could leak structure
                        let error = serde_json::json!({
                            "type": "error",
                            "message": "Invalid JSON payload",
                        });
                        let _ = socket.send(axum::extract::ws::Message::Text(error.to_string())).await;
                    }
                }
            }
            axum::extract::ws::Message::Close(_) => {
                let _ = sqlx::query(
                    "UPDATE interview_sessions SET status = 'Completed', completed_at = NOW() WHERE id = $1 AND status = 'InProgress'"
                )
                .bind(session_id)
                .execute(state.db.pool())
                .await;
                break;
            }
            _ => {}
        }
    }
}
