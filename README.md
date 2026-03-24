# Barby Bot

A Node.js AWS Lambda that monitors [Barby](https://barby.co.il) concert availability and notifies Telegram groups when tracked artists have tickets available.

> **Important:** The Lambda **must** run in `il-central-1` (Israel). The Barby website is geo-blocked and unreachable from other AWS regions.

---

## How It Works

Two Telegram bots share a single Lambda function, each serving a distinct role:

- **Admin bot** — receives webhook commands (`/create`, `/delete`, `/notify`) from the owner via direct message. Creates/deletes Telegram groups for tracked artists.
- **Notifications bot** — runs on an EventBridge schedule (every 8 hours), calls the Barby API, and sends available-ticket alerts to each artist's Telegram group.

**Why two bots instead of one?**
The notifications bot is added as a member to group chats it messages. If a single bot handled both admin commands and group notifications, the admin's private commands would go through the same bot that lives in every group — creating a confusing permission model and making it harder to control who can trigger admin actions. Keeping them separate gives clean security boundaries: the admin bot only ever talks to the owner, and the notifications bot only ever sends to groups.

### Lambda routing

The same Lambda function handles both invocation types:

| Source | Handler | Trigger |
|---|---|---|
| API Gateway POST `/telegram` | `adminHandler` | Telegram webhook |
| EventBridge cron | `notificationsHandler` | Every 8 hours |

---

## Infrastructure

### AWS (via Terraform)

- **Lambda** — Node.js 24.x, handler `dist/index.main`, 10s timeout
- **API Gateway (HTTP)** — `POST /telegram` → Lambda proxy
- **EventBridge** — `cron(0 */8 * * ? *)` triggers the notifications run
- **IAM** — minimal execution role with CloudWatch logging

Terraform state is stored in Terraform Cloud (`TunaBarby/tuna-barby`).

### GitHub Actions (`deploy.yml`)

Triggers on push to `main`:

1. Install deps (private npm registry)
2. Run tests + typecheck
3. Build with Vite → `dist/`
4. Configure AWS credentials via OIDC
5. `terraform init` → `plan` → `apply`

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `TF_API_TOKEN` | Terraform Cloud token |
| `ADMIN_BOT_TOKEN` | Telegram admin bot token |
| `NOTIFICATIONS_BOT_TOKEN` | Telegram notifications bot token |
| `ADMIN_BOT_API_AUTH_TOKEN` | Secret for webhook header verification |
| `OWNER_TG_API_ID` | Telegram app API ID (for gramjs) |
| `OWNER_TG_API_HASH` | Telegram app API hash (for gramjs) |
| `OWNER_TG_STRING_SESSION` | Persistent gramjs session string |
| `DATABASE_PASSWORD` | Supabase DB password |
| `AWS_ACCOUNT_ID` | AWS account ID for OIDC role |

### Required GitHub Variables

`AWS_REGION`, `NOTIFICATIONS_BOT_USERNAME`, `ADMIN_BOT_USERNAME`, `OWNER_TG_USER_ID`, `HEALTH_CHAT_ID`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`

---

## Database (Supabase)

Schema is managed via Supabase migrations in `lambda/supabase/migrations/`.

```sql
CREATE TABLE artists (
    name    TEXT NOT NULL PRIMARY KEY,  -- artist display name (Hebrew supported)
    chat_id TEXT NOT NULL UNIQUE        -- Telegram group ID (e.g. -1003344458982)
);
```

### Running Migrations

```bash
cd lambda

# Create a new migration (auto-generates the timestamped filename)
npx supabase migration new <description>

# Apply all pending migrations to Supabase
npm run migrate
```

`migration new` creates an empty `.sql` file under `supabase/migrations/` with the correct timestamp prefix. Edit that file with your DDL, then push with `npm run migrate`.

---

## Bot Commands

Send these to the admin bot in a private chat:

| Command | Description |
|---|---|
| `/create <artist>` | Creates a Telegram group and adds the artist to the DB |
| `/delete <artist>` | Removes the artist from the DB and deletes the group |
| `/notify` | Manually triggers a notifications run |

Hebrew artist names are fully supported.

---

## Telegram API Reference

### Bot API (HTTP)

**Send a message to a chat:**
```
POST https://api.telegram.org/bot<TOKEN>/sendMessage
Body: { "chat_id": "-100...", "text": "..." }
```

**Set the admin bot webhook:**
```bash
curl 'https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?secret_token=<AUTH_TOKEN>' \
  --data-urlencode 'url=<API_GATEWAY_URL>/telegram'
```
The `secret_token` is sent by Telegram as `x-telegram-bot-api-secret-token` on every update and verified in the handler.

**Get group chat ID** (send a message in the group first, then open in browser):
```
https://api.telegram.org/bot<NOTIFICATIONS_BOT_TOKEN>/getUpdates
```
Look for `message.chat.id` in the response — group IDs are negative numbers.

### Client API (gramjs)

Group management uses gramjs (a full Telegram client, not a bot) running as the owner's user account. This is necessary because bots cannot create groups — only user accounts can.

Key operations used internally:

| Operation | MTProto Method |
|---|---|
| Create group | `messages.CreateChat` |
| List chats | `client.getDialogs()` |
| Delete group | `messages.DeleteChat` |

---

## Local Development

```bash
cd lambda
npm install
cp .env.example .env  # fill in all variables
npm test              # unit tests
npm run typecheck
npm run build
```

### Local Terraform Deploy

```bash
# from repo root
cd lambda && npm install && cd ..
terraform init
terraform apply
```

Terraform will output the API Gateway webhook URL to use when setting the webhook.
