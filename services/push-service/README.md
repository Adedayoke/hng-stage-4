# Push Service

Processes push notifications from the message queue and sends them to mobile/web clients.

## Responsibilities

- Consume messages from `push.queue`
- Send push notifications via FCM, OneSignal, or Web Push
- Validate device tokens
- Handle rich notifications (title, text, image, link)
- Retry failed sends with exponential backoff
- Move permanently failed messages to dead-letter queue

## Tech Stack

- **Language**: Go
- **Message Queue**: RabbitMQ (amqp091-go)
- **Push Provider**: Firebase Cloud Messaging (FCM) / OneSignal / Web Push
- **Cache**: Redis (for rate limiting)

## Message Format

Messages consumed from `push.queue`:

```json
{
  "notification_id": "uuid",
  "user_id": "uuid",
  "push_token": "device-token",
  "template_code": "order_shipped",
  "variables": {
    "name": "John Doe",
    "link": "https://example.com/order/123",
    "meta": {}
  },
  "priority": 1,
  "request_id": "unique-request-id",
  "retry_count": 0
}
```

## Environment Variables

```env
PORT=3003
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379
TEMPLATE_SERVICE_URL=http://localhost:3004

# FCM Configuration
FCM_SERVER_KEY=your-fcm-server-key
FCM_PROJECT_ID=your-project-id

# Or OneSignal
ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_API_KEY=your-api-key

# Web Push (VAPID)
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:your-email@example.com

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
docker build -t push-service .
docker run -p 3003:3003 push-service
```

## Push Notification Format

```json
{
  "title": "Your Order Has Shipped",
  "body": "Hi John Doe, your order is on the way!",
  "image": "https://example.com/image.png",
  "link": "https://example.com/order/123",
  "data": {
    "order_id": "123",
    "action": "view_order"
  }
}
```

## Retry Logic

1. Initial attempt fails → wait 5 seconds
2. Second attempt fails → wait 25 seconds (5²)
3. Third attempt fails → wait 125 seconds (5³)
4. After max retries → move to dead-letter queue
