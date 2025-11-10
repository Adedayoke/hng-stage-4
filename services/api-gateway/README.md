# API Gateway Service

Entry point for all notification requests in the distributed notification system.

## Responsibilities

- Validate and authenticate incoming requests
- Route messages to appropriate queues (email or push)
- Track notification status
- Rate limiting and request throttling
- API documentation via Swagger

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Message Queue**: RabbitMQ (amqplib)
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

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

```env
PORT=3000
RABBITMQ_URL=amqp://localhost:5672
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
npm run test
npm run test:e2e
```

## Docker

```bash
docker build -t api-gateway .
docker run -p 3000:3000 api-gateway
```
