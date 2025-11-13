# API Gateway Service# API Gateway Service



Entry point for the distributed notification system. Validates requests, enriches messages with user and template data, and publishes to RabbitMQ queues.Entry point for all notification requests in the distributed notification system.



## Tech Stack## Status: ✅ Fully Implemented



- NestJS 10.x (TypeScript)## Responsibilities

- RabbitMQ (message queue)

- Redis (idempotency)- ✅ Validate and authenticate incoming requests

- Swagger (API documentation)- ✅ Route messages to appropriate queues (email or push)

- ✅ Track notification status with correlation IDs

## Key Features- ✅ Idempotency checking via Redis

- ✅ API documentation via Swagger

- **Message Enrichment**: Fetches user data and templates before queuing- 🚧 Rate limiting (planned)

- **Idempotency**: Redis-based duplicate request prevention (1-hour TTL)- 🚧 JWT authentication (planned)

- **Dead Letter Queue**: Failed messages routed to `failed.queue`

- **Correlation IDs**: Request tracing across microservices## Tech Stack

- **Snake_case Convention**: All fields follow snake_case

- **Framework**: NestJS 10.x

## API Endpoints- **Language**: TypeScript 5.x

- **Message Queue**: RabbitMQ (amqplib)

### Root- **Cache**: Redis (ioredis)

```- **Validation**: class-validator, class-transformer

GET /- **Documentation**: @nestjs/swagger

```- **Health Checks**: @nestjs/terminus

Returns service information.

## Features Implemented

### Create Notification

```### ✅ Notification Endpoint

POST /api/v1/notifications- POST /api/v1/notifications with full validation

```- Snake_case request/response format

- UUID generation for notification and correlation IDs

**Request:**- Publishes to RabbitMQ exchange with routing keys

```json

{### ✅ Idempotency

  "notification_type": "push",- Redis-based duplicate request detection

  "user_id": "cc19e6a4-2882-415b-bd69-bc9a5ae733f6",- Request IDs tracked for 1 hour (configurable TTL)

  "template_code": "welcome_notification",- Returns 409 Conflict for duplicate requests

  "variables": {

    "name": "John Doe"### ✅ Logging

  },- Correlation ID for request tracing

  "request_id": "req_unique_123",- Structured logging with context

  "priority": 1- All logs include correlation IDs for debugging

}

```### ✅ Health Checks

- GET /health with memory monitoring

**Response:**- Returns JSON status of service health

```json

{### ✅ API Documentation

  "success": true,- Interactive Swagger UI at /api/docs

  "data": {- Auto-generated from decorators

    "notification_id": "11eb326a-ad38-4ff9-aa69-c545f8144287",- Request/response examples included

    "status": "queued",

    "correlation_id": "e5f505a0-390d-4c62-9c73-620da2cd2fe2"## API Endpoints

  },

  "message": "Notification queued successfully"### POST /api/v1/notifications

}Create a new notification request.

```

**Request Body:**

### Health Check```json

```{

GET /health  "notification_type": "email" | "push",

```  "user_id": "uuid",

  "template_code": "string",

### API Documentation  "variables": {

```    "name": "string",

GET /api/docs    "link": "string",

```    "meta": {}

Interactive Swagger UI.  },

  "request_id": "string",

## Environment Variables  "priority": 1,

  "metadata": {}

```env}

PORT=3000```

NODE_ENV=production

RABBITMQ_URL=amqp://localhost:5672### GET /health

REDIS_URL=redis://localhost:6379Health check endpoint.

USER_SERVICE_URL=https://stage4-user-service.up.railway.app

TEMPLATE_SERVICE_URL=http://localhost:3004## Environment Variables

```

Create a `.env` file in the `services/api-gateway` directory:

## Running

```env

**Development:**# Server

```bashPORT=3000

npm installNODE_ENV=development

npm run start:dev

```# RabbitMQ

RABBITMQ_URL=amqp://localhost:5672

**Production:**RABBITMQ_EXCHANGE=notifications.direct

```bashRABBITMQ_QUEUE_EMAIL=email.queue

npm run buildRABBITMQ_QUEUE_PUSH=push.queue

npm run start:prod

```# Redis

REDIS_HOST=localhost

## Architecture FlowREDIS_PORT=6379



1. Receives notification request# Other Services

2. Validates request formatUSER_SERVICE_URL=https://stage4-user-service.up.railway.app

3. Checks idempotency (Redis)TEMPLATE_SERVICE_URL=http://localhost:3004

4. Fetches user data from User Service

5. Fetches template from Template Service# JWT (for future use)

6. Renders template with variablesJWT_SECRET=your-secret-key-change-in-production

7. Builds enriched message```

8. Publishes to RabbitMQ queue

9. Returns notification ID## Getting Started



## Message Format### Prerequisites



Messages published to queues contain all data needed for delivery.- Node.js 18+ and npm

- Docker Desktop (for RabbitMQ and Redis)

**Push Queue:**

```json### Installation

{

  "notification_id": "uuid",```bash

  "user_id": "uuid",# Install dependencies

  "push_token": "fcm-token",npm install

  "notification_title": "Rendered title",

  "notification_body": "Rendered body",# Start infrastructure (from project root)

  "correlation_id": "uuid"cd ../..

}docker-compose -f docker/docker-compose.yml up -d

```

# Go back to api-gateway

**Email Queue:**cd services/api-gateway

```json```

{

  "notification_id": "uuid",### Running the Application

  "user_id": "uuid",

  "email": "user@example.com",**Development mode with hot reload:**

  "subject": "Rendered subject",```bash

  "html_body": "Rendered HTML",npm run start:dev

  "text_body": "Rendered text",```

  "correlation_id": "uuid"

}**Production mode:**

``````bash

npm run build

## Error Responsesnpm run start:prod

```

- **400**: Invalid request format

- **404**: User or template not found### Testing the API

- **409**: Duplicate request

- **500**: Internal server error**Health Check:**

```bash
curl http://localhost:3000/health
```

**Create Notification:**
```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "email",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "template_code": "welcome_email",
    "variables": {
      "name": "John Doe",
      "link": "https://example.com"
    },
    "request_id": "req_unique_123",
    "priority": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "notification_id": "11eb326a-ad38-4ff9-aa69-c545f8144287",
    "status": "queued",
    "message": "Notification has been queued for processing",
    "correlation_id": "e5f505a0-390d-4c62-9c73-620da2cd2fe2"
  },
  "message": "Notification queued successfully"
}
```

**Test Idempotency (send same request_id twice):**
```bash
# Second request with same request_id returns 409
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "email",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "template_code": "welcome_email",
    "variables": {
      "name": "John Doe",
      "link": "https://example.com"
    },
    "request_id": "req_unique_123",
    "priority": 1
  }'
```

### Swagger Documentation

Open http://localhost:3000/api/docs in your browser to see:
- Interactive API documentation
- Try out endpoints
- View request/response schemas

## Running Locally

```bash
npm install
npm run start:dev
```

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
src/
├── config/
│   └── configuration.ts          # Environment configuration
├── health/
│   ├── health.controller.ts      # Health check endpoint
│   └── health.module.ts
├── notifications/
│   ├── dto/
│   │   ├── create-notification.dto.ts
│   │   ├── user-data.dto.ts
│   │   └── notification-response.dto.ts
│   ├── enums/
│   │   └── notification-type.enum.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── notifications.module.ts
├── rabbitmq/
│   ├── rabbitmq.service.ts      # RabbitMQ publisher
│   └── rabbitmq.module.ts
├── redis/
│   ├── redis.service.ts         # Redis client & idempotency
│   └── redis.module.ts
├── app.module.ts                # Root module
└── main.ts                      # Entry point
```

## How It Works

1. **Request arrives** at POST /api/v1/notifications
2. **Validation** - DTOs validate request format and types
3. **Idempotency check** - Redis checks if request_id was seen before
4. **Generate IDs** - Creates notification_id and correlation_id (UUIDs)
5. **Publish to RabbitMQ** - Routes message to email.queue or push.queue based on notification_type
6. **Mark as processed** - Stores request_id in Redis (expires after 1 hour)
7. **Return response** - Returns notification_id and correlation_id

## Monitoring

### RabbitMQ Management UI
- URL: http://localhost:15672
- Credentials: guest/guest
- View queues, messages, and throughput

### Logs
All logs include correlation IDs for tracing:
```
[NotificationsService] [corr_uuid] Processing notification request: req_test_123
[RabbitMQService] Published message to email queue
[NotificationsService] [corr_uuid] Notification queued successfully: notif_uuid
```

## Troubleshooting

**RabbitMQ connection failed:**
- Ensure Docker containers are running: `docker ps`
- Check RabbitMQ is accessible: `docker logs rabbitmq`

**Redis connection failed:**
- Verify Redis container: `docker ps | grep redis`
- Test Redis: `docker exec -it redis redis-cli ping`

**Port already in use:**
- Change PORT in .env file
- Or kill process using port 3000: `npx kill-port 3000`

## Next Steps

- [ ] Add JWT authentication middleware
- [ ] Implement rate limiting
- [ ] Add request logging middleware
- [ ] Create integration tests with actual RabbitMQ
- [ ] Add OpenTelemetry tracing
- [ ] Implement circuit breaker pattern

## Related Services

- **User Service** - Validates user_id and retrieves user preferences
- **Template Service** - Provides email/push templates
- **Email Service** - Consumes from email.queue
- **Push Service** - Consumes from push.queue
