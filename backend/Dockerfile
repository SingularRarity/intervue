FROM rust:1.88-slim-bookworm AS builder

WORKDIR /app
COPY Cargo.toml ./
COPY migrations ./migrations
COPY src ./src
COPY .sqlx ./.sqlx

RUN apt-get update && apt-get install -y pkg-config libssl-dev && \
    SQLX_OFFLINE=true cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/ai-interview-platform /app/ai-interview-platform
COPY --from=builder /app/target/release/seed_god_admin /app/seed_god_admin
COPY migrations ./migrations

EXPOSE 8080

CMD ["./ai-interview-platform"]
