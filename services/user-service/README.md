# User Service

Manages user contact information, preferences, and authentication.

## Responsibilities

- Store and manage user data (email, push tokens)
- Handle user authentication and authorization
- Manage notification preferences
- Expose REST APIs for user operations
- Password hashing and security

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma or TypeORM
- **Authentication**: JWT
- **Cache**: Redis

## API Endpoints

### POST /api/v1/users
Create a new user.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "push_token": "string (optional)",
  "preferences": {
    "email": true,
    "push": true
  },
  "password": "string"
}
```

### GET /api/v1/users/:id
Get user by ID.

### PUT /api/v1/users/:id
Update user information.

### GET /api/v1/users/:id/preferences
Get user notification preferences.

### POST /api/v1/auth/login
Authenticate user and return JWT token.

### GET /health
Health check endpoint.

## Environment Variables

```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/users
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=10
```

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  push_token TEXT,
  password_hash VARCHAR(255) NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Running Locally

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

## Running Tests

```bash
npm run test
npm run test:e2e
```
