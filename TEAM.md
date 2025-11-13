# Team & Service Ownership

## Team Structure

This project is built by a team of 4 developers for HNG Stage 4 Backend Task.

## Service Ownership

### TypeScript Services (NestJS)
- **API Gateway** - Request validation, message enrichment, and routing
- **Push Service** - Firebase Cloud Messaging push notification delivery

### TypeScript Services (Fastify/Node.js)
- **User Service** - User data management and preferences
  - Repository: https://github.com/akhilomeella/hng-stage4/tree/master/user-service
  - Deployed: https://stage4-user-service.up.railway.app
- **Template Service** - Notification template management  
  - Repository: https://github.com/akhilomeella/hng-stage4/tree/master/template-service

### Go Services
- **Email Service** - Email notification delivery via SMTP/SendGrid

## Architecture Decision

The team adopted an **"Enrich at Gateway"** pattern where:
- API Gateway fetches user data from User Service
- API Gateway fetches templates from Template Service
- API Gateway renders templates with variables
- API Gateway publishes enriched messages to RabbitMQ queues
- Push/Email services consume ready-to-send messages

This design ensures:
- Fast failure validation (invalid users rejected immediately)
- Queue reliability (only valid messages queued)
- Service decoupling (consumer services have no external dependencies)
- Simplified consumer logic (pure senders)

## Tech Stack

| Service | Framework | Language | Primary Dependencies |
|---------|-----------|----------|---------------------|
| API Gateway | NestJS | TypeScript | RabbitMQ, Redis |
| Push Service | NestJS | TypeScript | RabbitMQ, FCM |
| User Service | Fastify | JavaScript/TypeScript | PostgreSQL |
| Template Service | Fastify | JavaScript/TypeScript | PostgreSQL |
| Email Service | Native | Go | SMTP/SendGrid |

## Communication Patterns

### Synchronous (REST/HTTP)
- API Gateway → User Service (validate user, get contact info)
- API Gateway → Template Service (fetch templates)

### Asynchronous (RabbitMQ)
- API Gateway → Push Queue → Push Service
- API Gateway → Email Queue → Email Service
- Failed messages → Dead Letter Queue

## Deployment

- **User Service**: Railway (https://stage4-user-service.up.railway.app)
- **Other Services**: To be deployed individually by service owners
- **Shared Infrastructure**: RabbitMQ, Redis (to be hosted)
