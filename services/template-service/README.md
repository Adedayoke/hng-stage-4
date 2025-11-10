# Template Service

Manages notification templates with variable substitution and versioning.

## Responsibilities

- Store and manage email and push notification templates
- Handle variable substitution (e.g., {{name}}, {{link}})
- Support multiple languages
- Maintain template version history
- Expose REST APIs for template operations

## Tech Stack

- **Framework**: NestJS or Go (team decision)
- **Database**: PostgreSQL
- **Template Engine**: Handlebars (if NestJS) or text/template (if Go)
- **Cache**: Redis (for frequently accessed templates)

## API Endpoints

### GET /api/v1/templates/:code
Get template by code.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "welcome_email",
    "type": "email",
    "subject": "Welcome to {{app_name}}",
    "body": "Hi {{name}}, welcome aboard!",
    "language": "en",
    "version": 1
  },
  "message": "Template retrieved successfully",
  "meta": null
}
```

### POST /api/v1/templates
Create a new template.

### PUT /api/v1/templates/:id
Update template (creates new version).

### GET /api/v1/templates/:code/render
Render template with variables.

**Request Body:**
```json
{
  "variables": {
    "name": "John Doe",
    "link": "https://example.com"
  }
}
```

### GET /health
Health check endpoint.

## Environment Variables

```env
PORT=3004
DATABASE_URL=postgresql://user:password@localhost:5432/templates
REDIS_URL=redis://localhost:6379
DEFAULT_LANGUAGE=en
```

## Database Schema

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
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
```

## Template Variables

Supported variable syntax: `{{variable_name}}`

Common variables:
- `{{name}}` - User's name
- `{{email}}` - User's email
- `{{link}}` - Action link
- `{{app_name}}` - Application name

## Running Locally

**If NestJS:**
```bash
npm install
npx prisma migrate dev
npm run start:dev
```

**If Go:**
```bash
go mod download
go run cmd/main.go
```

## Running Tests

**NestJS:**
```bash
npm run test
```

**Go:**
```bash
go test ./...
```
