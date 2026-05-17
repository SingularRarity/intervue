//! Object storage for uploaded files (C10).
//!
//! Backed by any S3-compatible store: AWS S3 in production, MinIO locally.
//! All config comes from S3_* env vars. If they're unset the service is
//! disabled and upload calls return None (the app degrades gracefully —
//! resume parsing still works, the file just isn't persisted).

use s3::{creds::Credentials, Bucket, Region};

#[derive(Clone)]
pub struct StorageService {
    bucket: Option<Bucket>,
}

impl StorageService {
    pub fn from_config(cfg: &crate::config::Config) -> Self {
        let bucket = Self::build_bucket(cfg);
        match &bucket {
            Some(_) => tracing::info!(
                "object storage enabled (bucket={:?}, endpoint={:?})",
                cfg.s3_bucket, cfg.s3_endpoint
            ),
            None => tracing::warn!("object storage disabled — S3_* env vars not fully set"),
        }
        Self { bucket }
    }

    fn build_bucket(cfg: &crate::config::Config) -> Option<Bucket> {
        let bucket_name = cfg.s3_bucket.as_ref()?;
        let access = cfg.s3_access_key.as_ref()?;
        let secret = cfg.s3_secret_key.as_ref()?;

        let region = match &cfg.s3_endpoint {
            // Custom endpoint => MinIO or non-AWS S3
            Some(endpoint) => Region::Custom {
                region: cfg.s3_region.clone(),
                endpoint: endpoint.clone(),
            },
            // No endpoint => real AWS S3, region parsed from the region string
            None => cfg.s3_region.parse().unwrap_or(Region::UsEast1),
        };

        let creds = Credentials::new(Some(access), Some(secret), None, None, None).ok()?;

        let bucket = Bucket::new(bucket_name, region, creds).ok()?;
        // MinIO and most non-AWS stores need path-style addressing.
        let bucket = if cfg.s3_endpoint.is_some() {
            bucket.with_path_style()
        } else {
            bucket
        };
        Some(bucket)
    }

    pub fn is_enabled(&self) -> bool {
        self.bucket.is_some()
    }

    /// Upload bytes under `key`, return the key on success.
    /// Returns None (logged) when storage is disabled or the upload fails —
    /// callers treat persistence as best-effort.
    pub async fn upload(&self, key: &str, content_type: &str, bytes: &[u8]) -> Option<String> {
        let bucket = self.bucket.as_ref()?;
        match bucket.put_object_with_content_type(key, bytes, content_type).await {
            Ok(resp) if (200..300).contains(&resp.status_code()) => Some(key.to_string()),
            Ok(resp) => {
                tracing::error!("s3 upload non-2xx for {key}: status {}", resp.status_code());
                None
            }
            Err(e) => {
                tracing::error!("s3 upload failed for {key}: {e}");
                None
            }
        }
    }

    /// Fetch an object's bytes (used for retrieval / audit).
    pub async fn download(&self, key: &str) -> Option<Vec<u8>> {
        let bucket = self.bucket.as_ref()?;
        match bucket.get_object(key).await {
            Ok(resp) if (200..300).contains(&resp.status_code()) => Some(resp.bytes().to_vec()),
            Ok(resp) => {
                tracing::error!("s3 download non-2xx for {key}: status {}", resp.status_code());
                None
            }
            Err(e) => {
                tracing::error!("s3 download failed for {key}: {e}");
                None
            }
        }
    }
}
