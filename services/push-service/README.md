# Push Service# Push Service



Microservice responsible for consuming enriched push notification messages from RabbitMQ and delivering them via Firebase Cloud Messaging (FCM).Microservice responsible for consuming enriched push notification messages from RabbitMQ and delivering them via Firebase Cloud Messaging (FCM).



## Tech Stack## Architecture



- **Framework**: NestJS 10.xThe Push Service is a **pure FCM sender** that:

- **Language**: TypeScript1. Consumes fully-enriched messages from `push.queue` in RabbitMQ

- **Message Queue**: RabbitMQ (CloudAMQP)2. Sends push notifications via Firebase Cloud Messaging

- **Push Provider**: Firebase Cloud Messaging (FCM)3. Implements retry logic with exponential backoff for failed deliveries

- **Deployment**: Railway

All message enrichment (fetching user data, fetching templates, rendering content) is handled by the API Gateway before publishing to the queue. This makes the Push Service focused solely on delivery.

## Architecture

## Message Contract

Pure FCM sender that consumes fully-enriched messages from RabbitMQ's `push.queue` and delivers them via Firebase Cloud Messaging. All message enrichment (user data, template rendering) is handled by the API Gateway before publishing to the queue.

Messages consumed from `push.queue` are enriched by the API Gateway and contain all necessary data:

### Message Flow

1. Consume message from `push.queue````json

2. Send to Firebase Cloud Messaging{

3. Implement retry logic with exponential backoff  "notification_id": "uuid-v4",

4. Move to dead letter queue after 3 failures  "user_id": "uuid-v4",

  "push_token": "user-fcm-device-token",

## Health Check  "notification_title": "Welcome to Our Platform",

  "notification_body": "Hi John Doe, click here to verify your account",

```  "image_url": "https://example.com/welcome.png",

GET /health  "link": "https://example.com/verify?token=abc123",

```  "data": {

    "template_code": "WELCOME_NOTIFICATION",

Returns service health status including memory usage.    "name": "John Doe"

  },

**Response:**  "correlation_id": "uuid-v4"

```json}

{```

  "status": "ok",

  "info": {## Configuration

    "memory_heap": {

      "status": "up"Required environment variables in `.env`:

    },

    "memory_rss": {```env

      "status": "up"PORT=3003

    }

  }# RabbitMQ Configuration

}RABBITMQ_URL=amqp://guest:guest@localhost:5672

```RABBITMQ_QUEUE_PUSH=push.queue



## Message Contract# Firebase Cloud Messaging

FCM_PROJECT_ID=your-firebase-project-id

Messages consumed from `push.queue` (enriched by API Gateway):FCM_PRIVATE_KEY=your-firebase-private-key

FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

```json

{# Retry Configuration

  "notification_id": "550e8400-e29b-41d4-a716-446655440000",RETRY_MAX_ATTEMPTS=3

  "user_id": "660e8400-e29b-41d4-a716-446655440001",RETRY_BACKOFF_SECONDS=5

  "push_token": "dA1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3zA4",```

  "notification_title": "Welcome to Our Platform",FCM_SERVER_KEY=your-fcm-server-key

  "notification_body": "Hi John Doe, click here to verify your account",FCM_PROJECT_ID=your-firebase-project-id

  "image_url": "https://cdn.example.com/notifications/welcome.png",FCM_PRIVATE_KEY=your-firebase-private-key

  "link": "https://app.example.com/verify?token=abc123xyz",FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

  "data": {

    "template_code": "WELCOME_NOTIFICATION",# Retry Configuration

    "name": "John Doe"RETRY_MAX_ATTEMPTS=3

  },RETRY_BACKOFF_SECONDS=5

  "correlation_id": "770e8400-e29b-41d4-a716-446655440002"```

}

```## FCM Setup



## Environment Variables1. Go to Firebase Console: https://console.firebase.google.com

2. Select your project (or create new one)

Create `.env` file in the service root:3. Go to Project Settings > Service Accounts

4. Click "Generate New Private Key"

```env5. Download the JSON file

PORT=30036. Extract these values to `.env`:

   - `project_id` → `FCM_PROJECT_ID`

# RabbitMQ   - `private_key` → `FCM_PRIVATE_KEY`

RABBITMQ_URL=amqp://username:password@host:5672/vhost   - `client_email` → `FCM_CLIENT_EMAIL`

RABBITMQ_QUEUE_PUSH=push.queue

## Dependencies

# Firebase Cloud Messaging

FCM_PROJECT_ID=firebase-project-idExternal services required:

FCM_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n- **RabbitMQ**: Message queue (port 5672)

FCM_CLIENT_EMAIL=firebase-adminsdk@project-id.iam.gserviceaccount.com- **Firebase Cloud Messaging**: Push notification delivery platform



# Retry ConfigurationNo direct dependencies on User Service or Template Service - the API Gateway handles all external service calls.

RETRY_MAX_ATTEMPTS=3

RETRY_BACKOFF_SECONDS=5## Running the Service

```

```bash

See `.env.example` for reference.# Development

npm run start:dev

## Running the Service

# Production

```bashnpm run build

# Install dependenciesnpm run start:prod

npm install```



# Development with hot reload## Health Check

npm run start:dev

GET `http://localhost:3003/health`

# Production build

npm run buildReturns service health status including memory usage.

npm run start:prod

```## Retry Logic



## Retry Logic- **Attempt 1**: Immediate processing

- **Attempt 2**: Wait 5 seconds (5^1)

Failed deliveries are retried with exponential backoff:- **Attempt 3**: Wait 25 seconds (5^2)

- Attempt 1: Immediate- **After 3 failures**: Message moved to dead letter queue

- Attempt 2: 5 seconds

- Attempt 3: 25 seconds (5²)## Logging

- After 3 failures: Message moved to dead letter queue

All operations include correlation_id for request tracing across services.

## Error Responses

Example log output:

All operations include `correlation_id` for request tracing across services.```

[RabbitMQConsumerService] Received message: abc-123-def

| Error Type | Description |[PushProcessorService] Processing push notification: abc-123-def [corr-456]

|-----------|-------------|[FcmService] Push notification sent successfully: projects/your-project/messages/0:1234567890

| Invalid FCM Token | Device token is invalid or expired |[PushProcessorService] Push notification sent successfully: abc-123-def [corr-456]

| FCM Server Error | Firebase Cloud Messaging service error |```

| Retry Exhausted | Message failed after 3 attempts, sent to dead letter queue |

## Project Structure

## Deployment

```

### Railway Configurationsrc/

├── config/               # Configuration management

The service includes `railway.toml` for deployment configuration. Ensure these environment variables are set in Railway:│   └── configuration.ts

├── fcm/                  # Firebase Cloud Messaging integration

- `RABBITMQ_URL` (from CloudAMQP add-on)│   ├── fcm.service.ts

- `FCM_PROJECT_ID`│   └── fcm.module.ts

- `FCM_PRIVATE_KEY`├── health/               # Health check endpoint

- `FCM_CLIENT_EMAIL`│   ├── health.controller.ts

│   └── health.module.ts

### CI/CD├── push/                 # Push notification processing logic

│   ├── push-processor.service.ts

GitHub Actions workflow (`.github/workflows/deploy-push-service.yml`) handles automated deployment on push to main branch.│   └── push.module.ts

├── rabbitmq/             # Message queue consumer
│   ├── rabbitmq-consumer.service.ts
│   └── rabbitmq.module.ts
├── app.module.ts         # Root module
└── main.ts               # Application entry point
```
