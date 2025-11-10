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
git clone <repository-url>
cd stage-4
```

### 2. Environment Setup

Copy `.env.example` to `.env` in each service directory and configure required variables.

### 3. Install Dependencies

**For TypeScript services:**
```bash
cd services/api-gateway
npm install
```

**For Go services:**
```bash
cd services/email-service
go mod download
```

### 4. Run with Docker Compose

```bash
docker-compose -f docker/docker-compose.yml up -d
```

This starts all services, databases, RabbitMQ, and Redis.

### 5. Verify Services

Check health endpoints:
- API Gateway: http://localhost:3000/health
- User Service: http://localhost:3001/health
- Email Service: http://localhost:3002/health
- Push Service: http://localhost:3003/health
- Template Service: http://localhost:3004/health

## Development Workflow

### Running Individual Services

Each service can be run independently for development:

**NestJS services:**
```bash
cd services/<service-name>
npm run start:dev
```

**Go services:**
```bash
cd services/<service-name>
go run cmd/main.go
```

### Testing

**NestJS:**
```bash
npm run test
```

**Go:**
```bash
go test ./...
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

## Team

This project is developed by a team of 4 developers:
- Oke Habeeb (Native Dev) - Typescript
- Isaac Ubani (nǝɔᴉ) - Go/Gin
- 
- 

## License

This project is part of the HNG Internship Stage 4 Backend Task.
