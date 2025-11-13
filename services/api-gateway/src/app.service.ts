import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      service: 'API Gateway',
      version: '1.0.0',
      status: 'running',
      message: 'Distributed Notification System - API Gateway',
      endpoints: {
        notifications: 'POST /api/v1/notifications',
        health: 'GET /health',
        docs: 'GET /api/docs'
      }
    };
  }
}
