# Distributed Notification System

A microservices-based notification system that handles email and push notifications asynchronously through message queues.

## Architecture Overview

This system consists of 5 independent microservices communicating via RabbitMQ:

- **API Gateway** (NestJS) - Entry point for all notification requests
- **User Service** (NestJS) - Manages user data and preferences  
- **Email Service** (Go) - Processes email notifications from queue
- **Push Service** (Go) - Processes push notifications from queue
- **Template Service** (NestJS/Go) - Manages notification templates

## Tech Stack

- **Languages**: TypeScript (NestJS), Go
- **Message Queue**: RabbitMQ
- **Databases**: PostgreSQL (User & Template services)
- **Cache**: Redis (rate limiting, preferences cache)
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
│   ├── api-gateway/       # NestJS - Entry point and routing
│   ├── user-service/      # NestJS - User management
│   ├── email-service/     # Go - Email processing
│   ├── push-service/      # Go - Push notification processing
│   └── template-service/  # Go/NestJS - Template management
├── docker/
│   └── docker-compose.yml # Orchestration for all services
├── docs/
│   └── architecture.md    # System design diagram
└── .github/
    └── workflows/         # CI/CD pipelines
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

### 3. Run API Gateway (Currently Implemented)

The API Gateway is fully functional and ready to use:

```bash
cd services/api-gateway
npm install
npm run start:dev
```

**API Gateway Features:**
- ✅ POST /api/v1/notifications - Queue notifications
- ✅ GET /health - Health check
- ✅ Swagger documentation at http://localhost:3000/api/docs
- ✅ RabbitMQ message publishing
- ✅ Redis idempotency checks
- ✅ Correlation ID logging

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

## Services Status

| Service | Status | Language | Port |
|---------|--------|----------|------|
| API Gateway | ✅ Complete | NestJS (TypeScript) | 3000 |
| User Service | 🚧 In Progress | NestJS (TypeScript) | 3001 |
| Email Service | 🚧 In Progress | Go | 3002 |
| Push Service | 🚧 In Progress | Go | 3003 |
| Template Service | 🚧 In Progress | NestJS/Go | 3004 |

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

- **Circuit Breaker**: Prevents cascading failures
- **Retry Logic**: Exponential backoff for failed messages
- **Idempotency**: Request IDs prevent duplicate notifications
- **Health Checks**: All services expose `/health` endpoints
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
