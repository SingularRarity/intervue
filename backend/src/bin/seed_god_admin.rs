/// Bootstrap the first god admin account.
/// Usage: GOD_EMAIL=admin@company.com GOD_PASSWORD=... cargo run --bin seed_god_admin
use anyhow::Context;
use argon2::{password_hash::SaltString, Argon2, PasswordHash};
use sqlx::PgPool;
use uuid::Uuid;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").context("DATABASE_URL must be set")?;
    let email = std::env::var("GOD_EMAIL").context("GOD_EMAIL must be set")?;
    let password = std::env::var("GOD_PASSWORD").context("GOD_PASSWORD must be set")?;
    let full_name = std::env::var("GOD_NAME").unwrap_or_else(|_| "Platform Admin".into());

    if password.len() < 12 {
        anyhow::bail!("GOD_PASSWORD must be at least 12 characters");
    }

    let pool = PgPool::connect(&database_url).await?;

    let salt = SaltString::generate(&mut rand::thread_rng());
    let argon2 = Argon2::default();
    let hash = PasswordHash::generate(argon2, &password, &salt)
        .map_err(|e| anyhow::anyhow!("hash error: {e}"))?
        .to_string();

    sqlx::query!(
        r#"INSERT INTO god_admins (id, email, password_hash, full_name, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash,
                 full_name = EXCLUDED.full_name,
                 is_active = true"#,
        Uuid::new_v4(),
        email,
        hash,
        full_name,
    )
    .execute(&pool)
    .await?;

    println!("God admin seeded: {email}");
    Ok(())
}
