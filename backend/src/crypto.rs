//! Field-level encryption for secrets at rest (C3).
//!
//! Tenant third-party API keys (Claude / Groq / Sarvam) are encrypted with
//! AES-256-GCM before they hit Postgres. The 256-bit master key comes from the
//! `ENCRYPTION_KEY` env var (64 hex chars).
//!
//! Ciphertext envelope: `enc:v1:<base64(nonce[12] || ciphertext+tag)>`
//! The `enc:v1:` prefix lets `decrypt` transparently pass through legacy
//! plaintext values during migration — anything without the prefix is returned
//! as-is, so an unencrypted DB still works while keys get re-saved.

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use once_cell::sync::OnceCell;
use rand::RngCore;

const PREFIX: &str = "enc:v1:";

static MASTER_KEY: OnceCell<[u8; 32]> = OnceCell::new();

/// Initialise the master key from the `ENCRYPTION_KEY` env var.
/// Call once at startup. If unset, encryption is disabled (values stored as
/// plaintext) — logged loudly so it's never a silent prod mistake.
pub fn init_from_env() {
    match std::env::var("ENCRYPTION_KEY") {
        Ok(hex) => {
            let trimmed = hex.trim();
            match decode_hex_32(trimmed) {
                Some(key) => {
                    let _ = MASTER_KEY.set(key);
                    tracing::info!("field encryption enabled (AES-256-GCM)");
                }
                None => {
                    tracing::error!(
                        "ENCRYPTION_KEY is set but is not 64 hex chars — field encryption DISABLED"
                    );
                }
            }
        }
        Err(_) => {
            tracing::warn!(
                "ENCRYPTION_KEY not set — tenant API keys will be stored as plaintext. \
                 Set a 64-hex-char key in production."
            );
        }
    }
}

fn decode_hex_32(s: &str) -> Option<[u8; 32]> {
    if s.len() != 64 {
        return None;
    }
    let mut out = [0u8; 32];
    for i in 0..32 {
        out[i] = u8::from_str_radix(&s[i * 2..i * 2 + 2], 16).ok()?;
    }
    Some(out)
}

/// Encrypt a plaintext secret. If no master key is configured, returns the
/// plaintext unchanged (so dev without ENCRYPTION_KEY still works).
pub fn encrypt(plaintext: &str) -> String {
    let key = match MASTER_KEY.get() {
        Some(k) => k,
        None => return plaintext.to_string(),
    };
    let cipher = Aes256Gcm::new(key.into());
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    match cipher.encrypt(nonce, plaintext.as_bytes()) {
        Ok(ciphertext) => {
            let mut blob = Vec::with_capacity(12 + ciphertext.len());
            blob.extend_from_slice(&nonce_bytes);
            blob.extend_from_slice(&ciphertext);
            format!("{PREFIX}{}", B64.encode(blob))
        }
        Err(e) => {
            tracing::error!("encryption failed, storing plaintext: {e}");
            plaintext.to_string()
        }
    }
}

/// Decrypt a value. Values without the `enc:v1:` prefix are returned unchanged
/// (legacy plaintext — supports gradual migration).
pub fn decrypt(value: &str) -> String {
    let Some(b64) = value.strip_prefix(PREFIX) else {
        return value.to_string(); // legacy plaintext
    };
    let key = match MASTER_KEY.get() {
        Some(k) => k,
        None => {
            tracing::error!("encrypted value present but ENCRYPTION_KEY unset — cannot decrypt");
            return String::new();
        }
    };
    let blob = match B64.decode(b64) {
        Ok(b) if b.len() > 12 => b,
        _ => {
            tracing::error!("malformed ciphertext envelope");
            return String::new();
        }
    };
    let (nonce_bytes, ciphertext) = blob.split_at(12);
    let cipher = Aes256Gcm::new(key.into());
    match cipher.decrypt(Nonce::from_slice(nonce_bytes), ciphertext) {
        Ok(plain) => String::from_utf8_lossy(&plain).into_owned(),
        Err(e) => {
            tracing::error!("decryption failed: {e}");
            String::new()
        }
    }
}

/// Encrypt an optional secret (None stays None).
pub fn encrypt_opt(value: &Option<String>) -> Option<String> {
    value.as_deref().filter(|s| !s.is_empty()).map(encrypt)
}

/// Decrypt an optional secret (None stays None).
pub fn decrypt_opt(value: &Option<String>) -> Option<String> {
    value.as_deref().filter(|s| !s.is_empty()).map(decrypt)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_with_key() {
        let _ = MASTER_KEY.set([7u8; 32]);
        let secret = "sk-test-1234567890";
        let enc = encrypt(secret);
        assert!(enc.starts_with(PREFIX), "ciphertext must carry the version prefix");
        assert_ne!(enc, secret);
        assert_eq!(decrypt(&enc), secret);
    }

    #[test]
    fn legacy_plaintext_passes_through() {
        // A value with no prefix is treated as legacy plaintext
        assert_eq!(decrypt("sk-legacy-plain"), "sk-legacy-plain");
    }
}
