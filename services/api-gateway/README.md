# API Gateway Service

Entry point for all notification requests in the distributed notification system.

## Status: ✅ Fully Implemented & Tested

## Responsibilities

- ✅ Validate and authenticate incoming requests
- ✅ Route messages to appropriate queues (email or push)
- ✅ Track notification status with correlation IDs
- ✅ Idempotency checking via Redis
- ✅ API documentation via Swagger
- 🚧 Rate limiting (planned)
- 🚧 JWT authentication (planned)

## Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Message Queue**: RabbitMQ (amqplib)
- **Cache**: Redis (ioredis)
- **Validation**: class-validator, class-transformer
- **Documentation**: @nestjs/swagger
- **Health Checks**: @nestjs/terminus

## Features Implemented

### ✅ Notification Endpoint
- POST /api/v1/notifications with full validation
- Snake_case request/response format
- UUID generation for notification and correlation IDs
- Publishes to RabbitMQ exchange with routing keys

### ✅ Idempotency
- Redis-based duplicate request detection
- Request IDs tracked for 1 hour (configurable TTL)
- Returns 409 Conflict for duplicate requests

### ✅ Logging
- Correlation ID for request tracing
- Structured logging with context
- All logs include correlation IDs for debugging

### ✅ Health Checks
- GET /health with memory monitoring
- Returns JSON status of service health

### ✅ API Documentation
- Interactive Swagger UI at /api/docs
- Auto-generated from decorators
- Request/response examples included

## API Endpoints

### POST /api/v1/notifications
Create a new notification request.

**Request Body:**
```json
{
  "notification_type": "email" | "push",
  "user_id": "uuid",
  "template_code": "string",
  "variables": {
    "name": "string",
    "link": "string",
    "meta": {}
  },
  "request_id": "string",
  "priority": 1,
  "metadata": {}
}
```

### GET /health
Health check endpoint.

## Environment Variables

Create a `.env` file in the `services/api-gateway` directory:

```env
# Server
PORT=3000
NODE_ENV=development

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=notifications.direct
RABBITMQ_QUEUE_EMAIL=email.queue
RABBITMQ_QUEUE_PUSH=push.queue

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Other Services
USER_SERVICE_URL=http://localhost:3001
TEMPLATE_SERVICE_URL=http://localhost:3004

# JWT (for future use)
JWT_SECRET=your-secret-key-change-in-production
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for RabbitMQ and Redis)

### Installation

```bash
# Install dependencies
npm install

# Start infrastructure (from project root)
cd ../..
docker-compose -f docker/docker-compose.yml up -d

# Go back to api-gateway
cd services/api-gateway
```

### Running the Application

**Development mode with hot reload:**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run build
npm run start:prod
```

### Testing the API

**Health Check:**
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
REDIS_URL=redis://localhost:6379
USER_SERVICE_URL=http://localhost:3001
TEMPLATE_SERVICE_URL=http://localhost:3004
JWT_SECRET=your-secret-key
```

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
