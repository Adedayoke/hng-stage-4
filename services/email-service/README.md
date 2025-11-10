# Email Service

Processes email notifications from the message queue and sends emails via SMTP or email service providers.

## Responsibilities

- Consume messages from `email.queue`
- Fill email templates with variables
- Send emails via SMTP (Gmail, SendGrid, Mailgun)
- Handle delivery confirmations and bounces
- Retry failed sends with exponential backoff
- Move permanently failed messages to dead-letter queue

## Tech Stack

- **Language**: Go
- **Message Queue**: RabbitMQ (amqp091-go)
- **Email Provider**: SMTP / SendGrid / Mailgun
- **Cache**: Redis (for rate limiting)

## Message Format

Messages consumed from `email.queue`:

```json
{
  "notification_id": "uuid",
  "user_id": "uuid",
  "email": "user@example.com",
  "template_code": "welcome_email",
  "variables": {
    "name": "John Doe",
    "link": "https://example.com",
    "meta": {}
  },
  "priority": 1,
  "request_id": "unique-request-id",
  "retry_count": 0
}
```

## Environment Variables

```env
PORT=3002
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379
TEMPLATE_SERVICE_URL=http://localhost:3004

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@example.com

# Or SendGrid
SENDGRID_API_KEY=your-api-key

# Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_SECONDS=5
```

## Running Locally

```bash
go mod download
go run cmd/main.go
```

## Running Tests

```bash
go test ./...
go test -v ./... -cover
```

## Docker

```bash
docker build -t email-service .
docker run -p 3002:3002 email-service
```

## Retry Logic

1. Initial attempt fails → wait 5 seconds
2. Second attempt fails → wait 25 seconds (5²)
3. Third attempt fails → wait 125 seconds (5³)
4. After max retries → move to dead-letter queue
