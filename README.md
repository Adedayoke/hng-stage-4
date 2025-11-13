# Distributed Notification System

A scalable microservices-based notification system that handles email and push notifications asynchronously through message queues.

## Architecture Overview

This system consists of 5 independent microservices communicating via RabbitMQ:

- **API Gateway** (NestJS) - Entry point, request validation, and message enrichment
- **User Service** (Fastify/Node.js) - User data management and notification preferences  
- **Email Service** (Go) - Email notification delivery
- **Push Service** (NestJS) - Push notification delivery via Firebase Cloud Messaging
- **Template Service** (Fastify/Node.js) - Notification template management

### Service Repositories

- **API Gateway & Push Service**: This repository (services/api-gateway, services/push-service)
- **User Service**: https://github.com/akhilomeella/hng-stage4/tree/master/user-service
- **Template Service**: https://github.com/akhilomeella/hng-stage4/tree/master/template-service
- **Email Service**: Built by team member (Go)

## Tech Stack

- **Backend Frameworks**: 
  - NestJS (API Gateway, Push Service)
  - Fastify/Node.js (User Service, Template Service)
  - Go (Email Service)
- **Message Queue**: RabbitMQ with dead letter queue support
- **Databases**: PostgreSQL (User & Template services)
- **Cache**: Redis (idempotency and caching)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 18+ and npm/yarn (for TypeScript services)
- Go 1.21+ (for Go services)
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3.12+

## Project Structure

```
stage-4/
├── services/
│   ├── api-gateway/       # NestJS - Request validation and message enrichment
│   ├── push-service/      # NestJS - FCM push notification delivery
│   └── (user-service, email-service, template-service built by teammates)
├── docker/
│   └── docker-compose.yml # Infrastructure orchestration
└── docs/
    └── message-contracts.md  # Message queue contracts
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Adedayoke/hng-stage-4.git
cd stage-4
```

### 2. Start Infrastructure Services

Start PostgreSQL, RabbitMQ, and Redis using Docker Compose:

```bash
docker-compose -f docker/docker-compose.yml up -d
```

This will start:
- **RabbitMQ** on port 5672 (Management UI: http://localhost:15672 - guest/guest)
- **Redis** on port 6379
- **PostgreSQL (users)** on port 5432
- **PostgreSQL (templates)** on port 5433

Verify containers are running:
```bash
docker ps
```

### 3. Run Services

**API Gateway:**
```bash
cd services/api-gateway
npm install
npm run start:dev
```

**Push Service:**
```bash
cd services/push-service
npm install
npm run start:dev
```

Both services include:
- Health check endpoints (`/health`)
- Structured logging with correlation IDs
- Environment-based configuration
- Docker support

### 4. Test the API

**Using curl:**
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
    "request_id": "req_test_123",
    "priority": 1
  }'
```

**Using Swagger UI:**
Visit http://localhost:3000/api/docs and try the endpoints interactively.

### 5. Monitor RabbitMQ

Check queued messages in RabbitMQ Management UI:
- URL: http://localhost:15672
- Username: `guest`
- Password: `guest`

Navigate to "Queues" tab to see messages in `email.queue` and `push.queue`.

## Services Overview

| Service | Status | Framework | Port | Responsibilities | Repository |
|---------|--------|----------|------|------------------|------------|
| API Gateway | ✅ Complete | NestJS | 3000 | Request validation, message enrichment, routing | This repo |
| Push Service | ✅ Complete | NestJS | 3003 | FCM push notification delivery | This repo |
| User Service | ✅ Complete | Fastify/Node.js | - | User data management | [akhilomeella/hng-stage4](https://github.com/akhilomeella/hng-stage4/tree/master/user-service) |
| Template Service | ✅ Complete | Fastify/Node.js | 3004 | Template management | [akhilomeella/hng-stage4](https://github.com/akhilomeella/hng-stage4/tree/master/template-service) |
| Email Service | 🚧 In Progress | Go | 3002 | Email notification delivery | Team member |

## Development Workflow

### Running Individual Services

Each service can be run independently for development:

**NestJS services:**
```bash
cd services/<service-name>
npm install
npm run start:dev
```

**Go services:**
```bash
cd services/<service-name>
go mod download
go run cmd/main.go
```

### Testing

**NestJS:**
```bash
npm run test
npm run test:e2e
```

**Go:**
```bash
go test ./...
go test -v -cover ./...
```

### Stopping Docker Services

```bash
docker-compose -f docker/docker-compose.yml down
```

To remove volumes as well:
```bash
docker-compose -f docker/docker-compose.yml down -v
```

## API Documentation

API documentation is available via Swagger at:
- http://localhost:3000/api/docs (API Gateway)

## Message Queue Structure

```
Exchange: notifications.direct
├── email.queue    → Email Service
├── push.queue     → Push Service  
└── failed.queue   → Dead Letter Queue
```

## Key Features

- **Message Enrichment**: API Gateway enriches messages before queueing
- **Retry Logic**: Exponential backoff (5s, 25s) with max 3 attempts
- **Dead Letter Queue**: Failed messages routed to `failed.queue`
- **Idempotency**: Redis-based duplicate request prevention (1-hour TTL)
- **Health Checks**: All services expose `/health` endpoints
- **Correlation IDs**: Request tracing across services
- **Horizontal Scaling**: Stateless services support scaling

## Performance Targets

- Handle 1,000+ notifications per minute
- API Gateway response time < 100ms
- 99.5% delivery success rate

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:**
```
type(scope): subject

[optional body]

[optional footer]
```

**Common types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `refactor`: Code refactoring
- `test`: Adding tests
- `ci`: CI/CD changes

**Examples:**
```bash
git commit -m "feat(api-gateway): add notification endpoint with validation"
git commit -m "fix(rabbitmq): resolve connection timeout issue"
git commit -m "docs(readme): update setup instructions"
```

### Branching Strategy

- `main` - Production-ready code
- `feat/<feature-name>` - New features (e.g., `feat/api-gateway-setup`)
- `fix/<bug-name>` - Bug fixes
- `docs/<doc-update>` - Documentation updates

### Deployment

To request a server for deployment, use the command `/request-server` in your HNG team channel.

### Submission

When ready to submit your work, use the `/submit` command in the HNG channel as instructed in the task guidelines.

## Team

This project is developed by a team of 4 developers:
- **Oke Habeeb** - TypeScript Developer (API Gateway)
- [Team Member 2] - [Role]
- [Team Member 3] - [Role]
- [Team Member 4] - [Role]

## Useful Links

- **HNG Internship**: https://hng.tech/internship
- **Hire Talented Developers**: https://hng.tech/hire
- **RabbitMQ Documentation**: https://www.rabbitmq.com/documentation.html
- **NestJS Documentation**: https://docs.nestjs.com/
- **Docker Documentation**: https://docs.docker.com/
