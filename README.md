<div align="center">
  <img width="120" height="120" alt="Atlas Mailer Logo" src="https://github.com/user-attachments/assets/577a5de6-ab3b-4a74-8eaf-70dc23471eda" />

  # Atlas Mailer

  [![Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare_Workers-F38020?logo=cloudflare-workers&logoColor=white)](https://workers.cloudflare.com/)
  [![Hono](https://img.shields.io/badge/Framework-Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
  [![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

  **A lightweight, edge-native microservice for dispatching transactional emails.**
</div>

A lightweight microservice for dispatching transactional emails via Gmail SMTP, built with Hono and deployed on Cloudflare Workers. This service features built-in authentication and daily rate limiting.

## Features

- **Decoupled Architecture**: Separate email logic from your main application.
- **Secure Authentication**: Bearer token-based API protection.
- **Rate Limiting**: Enforced 500 emails/day quota via Cloudflare KV with auto-expiration (24h TTL).
- **Health Monitoring**: Dedicated `/health` endpoint for uptime tracking.
- **Asynchronous Execution**: Leverages `waitUntil` for optimized response times.
- **Zod Validation**: Strict schema validation for all incoming payloads.

## Tech Stack & Versions

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (workerd)
- **Framework**: [Hono](https://hono.dev/) v4.x
- **Language**: TypeScript v5.x
- **Package Manager**: pnpm v9+
- **Tooling**: Wrangler v3.x (Cloudflare CLI)

## Project Structure

```text
atlas-mailer/
├── src/
│   ├── index.ts        # Main application logic & route handlers
│   └── types.ts        # TypeScript definitions for Bindings & Environment
├── .dev.vars           # Local secrets (ignored by git)
├── .dev.vars.example   # Template for local environment setup
├── .gitignore          # Git exclusion rules
├── package.json        # Project dependencies & scripts
├── tsconfig.json       # TypeScript configuration
└── wrangler.jsonc      # Cloudflare Workers configuration (KV bindings, etc.)
```

## API Specification

### POST `/send`

Send an email dispatch request.

#### Headers
```json
{
  "Authorization": "Bearer <API_KEY_SECRET>",
  "Content-Type": "application/json"
}
```

#### Request Body
```json
{
  "to": "recipient@example.com",
  "subject": "System Notification",
  "text": "Plain text content (optional if html provided)",
  "html": "<h1>HTML Content</h1> (optional if text provided)"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "<smtp-id>"
}
```

#### Error Responses
- `400 Bad Request`: Validation failure (missing fields, invalid email).
- `401 Unauthorized`: Missing or invalid API Key.
- `429 Too Many Requests`: Daily limit (500) exceeded.
- `500 Internal Server Error`: SMTP transport failure.

## Setup & Deployment

### Prerequisites
- Node.js (v18 or higher)
- pnpm installed globally
- A Gmail account with 2FA enabled and an [App Password](https://support.google.com/accounts/answer/185833)
- Cloudflare Account with Wrangler CLI authenticated

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Configure environment variables:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   Update `.dev.vars` with your Gmail credentials and preferred API key.

### Local Development
Local development uses a local simulator for KV storage unless explicitly configured otherwise.
```bash
pnpm run dev
```

### Deployment
1. Create a KV namespace:
   ```bash
   pnpm wrangler kv namespace create MAILER_KV
   ```
2. Update the `id` in `wrangler.jsonc` with the generated namespace ID.
3. Deploy to Cloudflare:
   ```bash
   pnpm run deploy
   ```
4. Set production secrets:
   ```bash
   pnpm wrangler secret put GMAIL_APP_PASSWORD
   pnpm wrangler secret put API_KEY_SECRET
   pnpm wrangler secret put GMAIL_USER
   ```

## Documentation
- [Hono Documentation](https://hono.dev/docs)
- [Cloudflare Workers KV](https://developers.cloudflare.com/kv/)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)

## License
MIT
