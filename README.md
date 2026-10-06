# CascadeAuth (RouteOTP) 🚀

> High-performance, self-hosted multi-channel OTP verification engine with intelligent delivery fallback and automated SMS cost reduction.

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-ea2849?logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js)](https://nextjs.org/)
[![BullMQ](https://img.shields.io/badge/Queue-BullMQ-orange)](https://bullmq.io/)
[![Redis](https://img.shields.io/badge/Cache-Redis%207-red?logo=redis)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL%2016-blue?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%205-2D3748?logo=prisma)](https://www.prisma.io/)

---

## 💡 The Business Problem

Traditional SMS-only verification is **prohibitively expensive** ($0.03 – $0.08+ per message in Tier-1 countries) and vulnerable to delivery failures.

**CascadeAuth solves this by introducing multi-channel waterfall routing:**
1. First, attempt delivery via low-cost or free channels (**Telegram Bot** — $0.00).
2. If the user doesn't verify within a configurable timeout, seamlessly escalate to **Flash-call** (~$0.005).
3. As a final fallback, route to the expensive **SMS Gateway** (~$0.045).

**Result:** Up to **70–85% reduction in verification costs** while maintaining a high delivery conversion rate.

---

## 🏛 Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client App
    participant API as NestJS Gateway
    participant RL as Redis RateLimiter
    participant Engine as Cascade Engine
    participant Queue as BullMQ (Delayed Queue)
    participant Providers as Channel Providers (Strategy)

    User->>API: POST /api/v1/verify/start { phone }
    API->>RL: Check cooldown & sliding-window limits
    RL-->>API: Allowed
    API->>Engine: Generate OTP & Hash (SHA-256)
    Engine->>Providers: Step 0: Deliver via Telegram Bot ($0.00)
    Engine->>Queue: Schedule delayed check (Timeout: 45s)
    API-->>User: 201 Created (sessionId)

    alt User enters code in time
        User->>API: POST /api/v1/verify/confirm { code }
        API->>Engine: Validate SHA-256 hash
        Engine-->>User: 200 OK (Verified)
    else Timeout reached (45s elapsed)
        Queue->>Engine: Execute Fallback Worker
        Engine->>Providers: Step 1: Deliver via Flash-Call ($0.005)
        Engine->>Queue: Schedule delayed check (Timeout: 30s)
    end

🛠 Key Engineering Features

    Event-Driven Cascade Execution: Delayed queue processing with Redis-backed BullMQ ensuring reliable channel escalations without thread blocking.
    Pluggable Provider Architecture: Clean implementation of the Strategy Pattern allowing trivial integration of real carriers (Twilio, Vonage, SMSC, Telegram Bot API).
    Zero Raw Code Storage: Codes are cryptographically generated and stored as salted SHA-256 hashes; raw OTP never persists in database storage.
    Enterprise-Grade Anti-Fraud & Security:
        Sliding-window Rate Limiting: Configurable cooldowns per phone number and hourly throttles.
        Anti-Bruteforce Lockout: Automatic session termination and IP/Phone temporary ban upon exceeding consecutive failed attempts.
    Real-Time Savings & Analytics Engine: Automated cost tracking and ROI estimation compared to 100% SMS benchmark.
    Interactive Live Sandbox: Built with Next.js (App Router), featuring a live-updating waterfall delivery timeline and verification simulator.

🚀 Quick Start
Prerequisites

    Node.js >= 20.x
    Docker & Docker Compose
    Make

1. Clone & Bootstrap Infrastructure
bash
Editor

git clone https://github.com/your-username/cascade-auth.git
cd cascade-auth

# Start PostgreSQL and Redis, run migrations and seed demo data:
make setup

2. Start Backend & API Docs

In a separate terminal:
bash
Editor

make dev-backend

    API Base: http://localhost:4000/api/v1
    Interactive Swagger Documentation: http://localhost:4000/api/docs

3. Start Frontend Dashboard & Sandbox

In another terminal:
bash
Editor

make dev-frontend

    Open http://localhost:3000 in your browser.

📡 API Overview
Method	Endpoint	Description
POST	/api/v1/verify/start	Initiates an OTP verification session and triggers Step 0
POST	/api/v1/verify/confirm	Validates entered OTP code against stored hash
GET	/api/v1/verify/session/:id	Returns session status and delivery audit trail
GET	/api/v1/verify/analytics/summary	Aggregates total cost savings, conversions, and metrics
📄 License

MIT
text
Editor


---
