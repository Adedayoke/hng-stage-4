# Push Service

Microservice responsible for consuming enriched push notification messages from RabbitMQ and delivering them via Firebase Cloud Messaging (FCM).

## Architecture

The Push Service is a **pure FCM sender** that:
1. Consumes fully-enriched messages from `push.queue` in RabbitMQ
2. Sends push notifications via Firebase Cloud Messaging
3. Implements retry logic with exponential backoff for failed deliveries

All message enrichment (fetching user data, fetching templates, rendering content) is handled by the API Gateway before publishing to the queue. This makes the Push Service focused solely on delivery.

## Message Contract

Messages consumed from `push.queue` are enriched by the API Gateway and contain all necessary data:

```json
{
  "notification_id": "uuid-v4",
  "user_id": "uuid-v4",
  "push_token": "user-fcm-device-token",
  "notification_title": "Welcome to Our Platform",
  "notification_body": "Hi John Doe, click here to verify your account",
  "image_url": "https://example.com/welcome.png",
  "link": "https://example.com/verify?token=abc123",
  "data": {
    "template_code": "WELCOME_NOTIFICATION",
    "name": "John Doe"
  },
  "correlation_id": "uuid-v4"
}
```

## Configuration

Required environment variables in `.env`:

```env
PORT=3003

# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE_PUSH=push.queue

# Firebase Cloud Messaging
FCM_PROJECT_ID=your-firebase-project-id
FCM_PRIVATE_KEY=your-firebase-private-key
FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_BACKOFF_SECONDS=5
```
FCM_SERVER_KEY=your-fcm-server-key
FCM_PROJECT_ID=your-firebase-project-id
FCM_PRIVATE_KEY=your-firebase-private-key
FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_BACKOFF_SECONDS=5
```

## FCM Setup

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project (or create new one)
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Extract these values to `.env`:
   - `project_id` → `FCM_PROJECT_ID`
   - `private_key` → `FCM_PRIVATE_KEY`
   - `client_email` → `FCM_CLIENT_EMAIL`

## Dependencies

External services required:
- **RabbitMQ**: Message queue (port 5672)
- **Firebase Cloud Messaging**: Push notification delivery platform

No direct dependencies on User Service or Template Service - the API Gateway handles all external service calls.

## Running the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Health Check

GET `http://localhost:3003/health`

Returns service health status including memory usage.

## Retry Logic

- **Attempt 1**: Immediate processing
- **Attempt 2**: Wait 5 seconds (5^1)
- **Attempt 3**: Wait 25 seconds (5^2)
- **After 3 failures**: Message moved to dead letter queue

## Logging

All operations include correlation_id for request tracing across services.

Example log output:
```
[RabbitMQConsumerService] Received message: abc-123-def
[PushProcessorService] Processing push notification: abc-123-def [corr-456]
[FcmService] Push notification sent successfully: projects/your-project/messages/0:1234567890
[PushProcessorService] Push notification sent successfully: abc-123-def [corr-456]
```

## Project Structure

```
src/
├── config/               # Configuration management
│   └── configuration.ts
├── fcm/                  # Firebase Cloud Messaging integration
│   ├── fcm.service.ts
│   └── fcm.module.ts
├── health/               # Health check endpoint
│   ├── health.controller.ts
│   └── health.module.ts
├── push/                 # Push notification processing logic
│   ├── push-processor.service.ts
│   └── push.module.ts
├── rabbitmq/             # Message queue consumer
│   ├── rabbitmq-consumer.service.ts
│   └── rabbitmq.module.ts
├── app.module.ts         # Root module
└── main.ts               # Application entry point
```
