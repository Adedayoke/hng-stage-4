import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('redis.url');
    const redisHost = this.configService.get<string>('redis.host');
    const redisPort = this.configService.get<number>('redis.port');

    try {
      // Use REDIS_URL if provided (Railway/production), otherwise use host/port (local)
      if (redisUrl) {
        this.client = new Redis(redisUrl, {
          retryStrategy: (times) => {
            if (times > 3) {
              this.logger.error('Redis connection failed after 3 retries');
              return null;
            }
            return Math.min(times * 200, 1000);
          },
        });
      } else {
        this.client = new Redis({
          host: redisHost,
          port: redisPort,
          retryStrategy: (times) => {
            if (times > 3) {
              this.logger.error('Redis connection failed after 3 retries');
              return null;
            }
            return Math.min(times * 200, 1000);
          },
        });
      }

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis connection error', err);
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis', error.stack);
    }
  }

  async checkIdempotency(requestId: string): Promise<boolean> {
    try {
      const key = `idempotency:${requestId}`;
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error('Error checking idempotency', error);
      return false; // If Redis fails, allow request (fail open)
    }
  }

  async setIdempotency(requestId: string, ttl: number = 3600): Promise<void> {
    try {
      const key = `idempotency:${requestId}`;
      await this.client.setex(key, ttl, '1');
    } catch (error) {
      this.logger.error('Error setting idempotency', error);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}`, error);
    }
  }
}