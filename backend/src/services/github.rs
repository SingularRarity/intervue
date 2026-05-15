//! GitHub profile fetcher and scorer.
//!
//! Hits the public GitHub REST API (no auth required for the read endpoints we use).
//! Score is computed from: total stars across repos, repo count, follower count,
//! recent push activity, and account age. Cached on the candidate row for 24h.

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct GithubService {
    client: reqwest::Client,
}

impl GithubService {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .user_agent("intervue-platform/1.0 (+https://intervue.singularraritylabs.com)")
                .build()
                .expect("Failed to build GitHub HTTP client"),
        }
    }

    /// Accepts either a full URL like "https://github.com/octocat" or a bare username.
    pub fn extract_username(input: &str) -> Option<String> {
        let s = input.trim().trim_end_matches('/');
        if s.is_empty() {
            return None;
        }
        // Strip protocol + host if present
        let after_host = s
            .trim_start_matches("https://")
            .trim_start_matches("http://")
            .trim_start_matches("www.")
            .trim_start_matches("github.com/")
            .trim_start_matches("github.com");
        let user = after_host.split('/').next().unwrap_or("").trim();
        if user.is_empty() {
            return None;
        }
        // GitHub usernames are alphanumeric + dash, 1..=39
        if !user.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') || user.len() > 39 {
            return None;
        }
        Some(user.to_string())
    }

    pub async fn fetch_profile(&self, username: &str) -> Result<GithubProfile> {
        let user: GhUser = self.get(&format!("https://api.github.com/users/{username}")).await?;
        let repos: Vec<GhRepo> = self
            .get(&format!(
                "https://api.github.com/users/{username}/repos?per_page=100&sort=updated"
            ))
            .await
            .unwrap_or_default();

        let total_stars: u32 = repos.iter().map(|r| r.stargazers_count).sum();
        let total_forks: u32 = repos.iter().map(|r| r.forks_count).sum();
        let own_repos: u32 = repos.iter().filter(|r| !r.fork).count() as u32;

        let top_repos: Vec<TopRepo> = {
            let mut sorted = repos
                .iter()
                .filter(|r| !r.fork)
                .cloned()
                .collect::<Vec<_>>();
            sorted.sort_by(|a, b| b.stargazers_count.cmp(&a.stargazers_count));
            sorted
                .into_iter()
                .take(5)
                .map(|r| TopRepo {
                    name: r.name,
                    url: r.html_url,
                    stars: r.stargazers_count,
                    language: r.language,
                    description: r.description,
                })
                .collect()
        };

        // ── Score (0..=100) ──────────────────────────────────────────────────
        // Bands chosen to keep mid-career engineers in the 50-80 range, junior in 20-50.
        // Weight: stars 40, repos 25, followers 15, recent activity 20.
        let score_stars = scale(total_stars as f64, &[(0.0, 0), (5.0, 10), (50.0, 25), (500.0, 35), (5000.0, 40)]);
        let score_repos = scale(own_repos as f64, &[(0.0, 0), (3.0, 8), (10.0, 15), (30.0, 22), (80.0, 25)]);
        let score_followers = scale(user.followers as f64, &[(0.0, 0), (10.0, 5), (100.0, 10), (1000.0, 15)]);

        // Recent activity — count repos updated in last 180 days
        let now = chrono::Utc::now();
        let recent_pushes = repos
            .iter()
            .filter_map(|r| r.pushed_at.as_deref())
            .filter_map(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
            .filter(|t| (now - t.with_timezone(&chrono::Utc)).num_days() < 180)
            .count() as f64;
        let score_recency = scale(recent_pushes, &[(0.0, 0), (1.0, 8), (3.0, 14), (10.0, 20)]);

        let score = (score_stars + score_repos + score_followers + score_recency).min(100);

        Ok(GithubProfile {
            username: user.login,
            avatar_url: user.avatar_url,
            name: user.name,
            bio: user.bio,
            company: user.company,
            location: user.location,
            blog: user.blog,
            public_repos: user.public_repos,
            followers: user.followers,
            following: user.following,
            created_at: user.created_at,
            total_stars,
            total_forks,
            own_repos,
            top_repos,
            score,
            fetched_at: now.to_rfc3339(),
        })
    }

    async fn get<T: for<'de> Deserialize<'de>>(&self, url: &str) -> Result<T> {
        let resp = self
            .client
            .get(url)
            .header("Accept", "application/vnd.github+json")
            .send()
            .await
            .map_err(|e| anyhow!("github request failed: {e}"))?;
        let status = resp.status();
        let body = resp.text().await.map_err(|e| anyhow!("read body: {e}"))?;
        if !status.is_success() {
            return Err(anyhow!("github API {status}: {}", body.chars().take(200).collect::<String>()));
        }
        serde_json::from_str(&body).map_err(|e| anyhow!("parse github response: {e}"))
    }
}

fn scale(value: f64, points: &[(f64, u32)]) -> u32 {
    // Piecewise linear interpolation between (input, output) points.
    if value <= points[0].0 {
        return points[0].1;
    }
    for win in points.windows(2) {
        let (x0, y0) = (win[0].0, win[0].1 as f64);
        let (x1, y1) = (win[1].0, win[1].1 as f64);
        if value <= x1 {
            let t = (value - x0) / (x1 - x0).max(0.0001);
            return (y0 + t * (y1 - y0)).round() as u32;
        }
    }
    points.last().unwrap().1
}

// ─────────────────────────────────────────────────────────────────────────────
// Public output struct (cached on candidates.github_profile JSONB)
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GithubProfile {
    pub username: String,
    pub avatar_url: Option<String>,
    pub name: Option<String>,
    pub bio: Option<String>,
    pub company: Option<String>,
    pub location: Option<String>,
    pub blog: Option<String>,
    pub public_repos: u32,
    pub followers: u32,
    pub following: u32,
    pub created_at: Option<String>,
    pub total_stars: u32,
    pub total_forks: u32,
    pub own_repos: u32,
    pub top_repos: Vec<TopRepo>,
    pub score: u32,
    pub fetched_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopRepo {
    pub name: String,
    pub url: String,
    pub stars: u32,
    pub language: Option<String>,
    pub description: Option<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw GitHub API response types
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
struct GhUser {
    login: String,
    avatar_url: Option<String>,
    name: Option<String>,
    bio: Option<String>,
    company: Option<String>,
    location: Option<String>,
    blog: Option<String>,
    public_repos: u32,
    followers: u32,
    following: u32,
    created_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct GhRepo {
    name: String,
    html_url: String,
    stargazers_count: u32,
    forks_count: u32,
    language: Option<String>,
    description: Option<String>,
    fork: bool,
    pushed_at: Option<String>,
}
