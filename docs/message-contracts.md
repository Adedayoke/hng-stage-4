# Message Contracts & Service Integration

This document defines the data structures and contracts for communication between services in the Distributed Notification System.

---

## 📨 RabbitMQ Message Format

### Queue Names
- `email.queue` - Email notifications
- `push.queue` - Push notifications  
- `failed.queue` - Dead letter queue for failed messages

### Architecture Note

**Important**: The API Gateway enriches all messages with user and template data BEFORE publishing to queues. This means:
- Email/Push services do NOT call User Service or Template Service
- Email/Push services receive ready-to-send messages
- This reduces coupling and improves reliability

### Push Queue Message Structure

Messages in `push.queue` are ready for immediate FCM delivery:

```json
{
  "notification_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "push_token": "fcm-device-token-abc123",
  "notification_title": "Welcome to Our Platform",
  "notification_body": "Hi John Doe, click here to verify your account",
  "image_url": "https://example.com/welcome.png",
  "link": "https://example.com/verify?token=abc123",
  "data": {
    "template_code": "WELCOME_NOTIFICATION",
    "user_name": "John Doe"
  },
  "correlation_id": "e5f505a0-390d-4c62-9c73-620da2cd2fe2"
}
```

### Email Queue Message Structure

Messages in `email.queue` are ready for immediate email delivery:

```json
{
  "notification_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "subject": "Welcome to Our Platform",
  "html_body": "<p>Hi John Doe, <a href='https://example.com/verify'>click here</a> to verify</p>",
  "text_body": "Hi John Doe, click here to verify: https://example.com/verify",
  "data": {
    "template_code": "WELCOME_EMAIL",
    "user_name": "John Doe"
  },
  "correlation_id": "e5f505a0-390d-4c62-9c73-620da2cd2fe2"
}
```

### Push Queue Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notification_id` | UUID | Yes | Unique identifier for this notification |
| `user_id` | UUID | Yes | User receiving the notification |
| `push_token` | string | Yes | FCM device token for the user |
| `notification_title` | string | Yes | Rendered notification title |
| `notification_body` | string | Yes | Rendered notification body |
| `image_url` | string (URL) | No | Image to display in notification |
| `link` | string (URL) | No | Deep link when notification is tapped |
| `data` | object | No | Additional metadata for the notification |
| `correlation_id` | UUID | Yes | For tracking across services |

### Email Queue Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notification_id` | UUID | Yes | Unique identifier for this notification |
| `user_id` | UUID | Yes | User receiving the notification |
| `email` | string | Yes | User's email address |
| `subject` | string | Yes | Rendered email subject line |
| `html_body` | string | Yes | Rendered HTML email body |
| `text_body` | string | Yes | Rendered plain text email body |
| `data` | object | No | Additional metadata for the email |
| `correlation_id` | UUID | Yes | For tracking across services |

---

## 🔗 User Service API Contract

**Framework**: Fastify/Node.js  
**Repository**: https://github.com/akhilomeella/hng-stage4/tree/master/user-service  
**Base URL**: `https://stage4-user-service.up.railway.app`

### Endpoints Required

#### Get User by ID
```
GET /users/{user_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "push_token": "device-fcm-token-xyz",
    "preferences": {
      "email": true,
      "push": true
    },
    "created_at": "2025-11-10T10:00:00.000Z",
    "updated_at": "2025-11-11T15:30:00.000Z"
  },
  "message": "User retrieved successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "User not found",
  "message": "No user exists with the provided ID"
}
```

#### Create User
```
POST /users
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "push_token": "device-fcm-token-xyz",
  "preferences": {
    "email": true,
    "push": true
  },
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "User created successfully"
}
```

---

## 📄 Template Service API Contract

**Framework**: Fastify/Node.js  
**Repository**: https://github.com/akhilomeella/hng-stage4/tree/master/template-service  
**Base URL**: `http://localhost:3004/api/v1` (or deployed URL)

### Endpoints Required

#### Get Template by Code
```
GET /templates/{template_code}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template-uuid",
    "code": "welcome_email",
    "type": "email",
    "subject": "Welcome to {{app_name}}!",
    "body": "Hi {{name}},\n\nWelcome aboard! Click here to get started: {{link}}\n\nThanks!",
    "language": "en",
    "version": 1,
    "created_at": "2025-11-10T10:00:00.000Z"
  },
  "message": "Template retrieved successfully"
}
```

**Supported Variables:**
- `{{name}}` - User's name
- `{{link}}` - Action URL
- `{{app_name}}` - Application name
- Custom variables from `meta` object

#### Create Template
```
POST /templates
```

**Request:**
```json
{
  "code": "welcome_email",
  "type": "email",
  "subject": "Welcome to {{app_name}}!",
  "body": "Hi {{name}},\n\nWelcome aboard! Click here: {{link}}",
  "language": "en"
}
```

---

## 📧 Email Service Processing Flow

### What Email Service Should Do:

1. **Consume message** from `email.queue`
2. **Get user data**: Call `GET /users/{user_id}` → get email address
3. **Get template**: Call `GET /templates/{template_code}`
4. **Render template**: Replace `{{name}}`, `{{link}}`, etc. with actual values
5. **Send email**: Via SMTP/SendGrid/Mailgun
6. **Handle retry**: If send fails, retry with exponential backoff (3 attempts max)
7. **Dead letter**: After max retries, move to `failed.queue`
8. **Log correlation_id**: For tracing

### Expected Environment Variables
```env
RABBITMQ_URL=amqp://localhost:5672
USER_SERVICE_URL=http://localhost:3001
TEMPLATE_SERVICE_URL=http://localhost:3004
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_SECONDS=5
```

---

## 📱 Push Service Processing Flow

### What Push Service Should Do:

1. **Consume message** from `push.queue`
2. **Get user data**: Call `GET /users/{user_id}` → get push_token
3. **Get template**: Call `GET /templates/{template_code}`
4. **Render template**: Create push notification payload
5. **Send push**: Via FCM/OneSignal
6. **Handle retry**: Same as email service
7. **Dead letter**: After max retries, move to `failed.queue`
8. **Log correlation_id**: For tracing

### Push Notification Format
```json
{
  "title": "Welcome to App!",
  "body": "Hi John Doe, click to get started",
  "image": "https://example.com/image.png",
  "link": "https://example.com/verify",
  "data": {
    "notification_id": "550e8400-...",
    "action": "verify_account"
  }
}
```

### Expected Environment Variables
```env
RABBITMQ_URL=amqp://localhost:5672
USER_SERVICE_URL=http://localhost:3001
TEMPLATE_SERVICE_URL=http://localhost:3004
FCM_SERVER_KEY=your-fcm-server-key
FCM_PROJECT_ID=your-project-id
MAX_RETRY_ATTEMPTS=3
RETRY_BACKOFF_SECONDS=5
```

---

## 🔄 Retry Logic (Email & Push Services)

### Exponential Backoff Strategy

```
Attempt 1: Immediate
Attempt 2: Wait 5 seconds
Attempt 3: Wait 25 seconds (5²)
Attempt 4: Wait 125 seconds (5³)
After max retries: Move to failed.queue
```

### Implementation Example (Pseudocode)
```
for attempt in 1..MAX_RETRY_ATTEMPTS:
    try:
        send_notification()
        ack_message()
        break
    except:
        if attempt < MAX_RETRY_ATTEMPTS:
            wait(RETRY_BACKOFF_SECONDS ^ attempt)
        else:
            move_to_failed_queue()
            ack_message()
```

---

## 🗄️ Database Schemas

### User Service - PostgreSQL Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  push_token TEXT,
  password_hash VARCHAR(255) NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_push_token ON users(push_token);
```

### Template Service - PostgreSQL Schema

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'email' or 'push'
  subject TEXT,
  body TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(code, language, version)
);

CREATE INDEX idx_templates_code ON templates(code);
CREATE INDEX idx_templates_type ON templates(type);
```

---

## 📊 Standard Response Format (All Services)

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": {
    "total": 100,
    "limit": 10,
    "page": 1,
    "total_pages": 10,
    "has_next": true,
    "has_previous": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Email format is invalid",
  "meta": null
}
```

---

## 🔐 Shared Environment Variables

### Docker Compose Setup
All services should use these same connection strings:

```env
# PostgreSQL
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost

# User Service DB
USER_DB_NAME=users
USER_DB_PORT=5432

# Template Service DB
TEMPLATE_DB_NAME=templates
TEMPLATE_DB_PORT=5433

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
```

---

## ✅ Testing Checklist

### For Each Service:

- [ ] Can connect to RabbitMQ
- [ ] Can connect to Redis (if needed)
- [ ] Can connect to PostgreSQL (if needed)
- [ ] `/health` endpoint responds
- [ ] Handles missing environment variables gracefully
- [ ] Logs include `correlation_id`
- [ ] Follows snake_case naming convention
- [ ] Returns standard response format
- [ ] Has proper error handling
- [ ] Swagger/OpenAPI docs available

---

## 📞 Service Communication Ports

| Service | Port | Protocol | Notes |
|---------|------|----------|-------|
| API Gateway | 3000 | HTTP | Entry point |
| User Service | 3001 | HTTP | REST API |
| Email Service | 3002 | HTTP | Health check only |
| Push Service | 3003 | HTTP | Health check only |
| Template Service | 3004 | HTTP | REST API |
| RabbitMQ | 5672 | AMQP | Message queue |
| RabbitMQ UI | 15672 | HTTP | Management interface |
| Redis | 6379 | Redis | Cache |
| PostgreSQL (Users) | 5432 | PostgreSQL | Database |
| PostgreSQL (Templates) | 5433 | PostgreSQL | Database |

---

## 🎯 Questions?

If anything is unclear or you need additional contracts, coordinate in the team channel!
