use axum::{
    extract::{State, Path, WebSocketUpgrade},
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use uuid::Uuid;

use crate::AppState;

pub async fn interview_websocket(
    State(state): State<Arc<AppState>>,
    Path(session_id): Path<Uuid>,
    ws: WebSocketUpgrade,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state, session_id))
}

async fn handle_socket(
    mut socket: axum::extract::ws::WebSocket,
    state: Arc<AppState>,
    session_id: Uuid,
) {
    // Update session status to InProgress
    let _ = sqlx::query(
        "UPDATE interview_sessions SET status = 'InProgress', started_at = NOW() WHERE id = $1"
    )
    .bind(session_id)
    .execute(state.db.pool())
    .await;

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
                                // Handle audio chunk from candidate
                                // In production: stream to Sarvam STT, get text, send to Claude, get response, TTS via Sarvam
                                let response = serde_json::json!({
                                    "type": "processing",
                                    "message": "Processing your response...",
                                });
                                let _ = socket.send(axum::extract::ws::Message::Text(response.to_string())).await;

                                // Process through interview engine
                                match state.interview_engine.process_audio_chunk(session_id, &data).await {
                                    Ok(result) => {
                                        let _ = socket.send(axum::extract::ws::Message::Text(
                                            serde_json::to_string(&result).unwrap_or_default()
                                        )).await;
                                    }
                                    Err(e) => {
                                        let error = serde_json::json!({
                                            "type": "error",
                                            "message": format!("Processing error: {}", e),
                                        });
                                        let _ = socket.send(axum::extract::ws::Message::Text(error.to_string())).await;
                                    }
                                }
                            }
                            "text_message" => {
                                // Handle text message from candidate (fallback)
                                if let Some(content) = data.get("content").and_then(|v| v.as_str()) {
                                    match state.interview_engine.process_text_message(session_id, content).await {
                                        Ok(result) => {
                                            let _ = socket.send(axum::extract::ws::Message::Text(
                                                serde_json::to_string(&result).unwrap_or_default()
                                            )).await;
                                        }
                                        Err(e) => {
                                            let error = serde_json::json!({
                                                "type": "error",
                                                "message": format!("Processing error: {}", e),
                                            });
                                            let _ = socket.send(axum::extract::ws::Message::Text(error.to_string())).await;
                                        }
                                    }
                                }
                            }
                            "end_interview" => {
                                // End interview and generate results
                                match state.interview_engine.finalize_interview(session_id).await {
                                    Ok(result) => {
                                        let _ = socket.send(axum::extract::ws::Message::Text(
                                            serde_json::to_string(&result).unwrap_or_default()
                                        )).await;
                                    }
                                    Err(e) => {
                                        let error = serde_json::json!({
                                            "type": "error",
                                            "message": format!("Finalization error: {}", e),
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
                    Err(e) => {
                        let error = serde_json::json!({
                            "type": "error",
                            "message": format!("Invalid JSON: {}", e),
                        });
                        let _ = socket.send(axum::extract::ws::Message::Text(error.to_string())).await;
                    }
                }
            }
            axum::extract::ws::Message::Close(_) => {
                // Mark session as completed if not already
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
