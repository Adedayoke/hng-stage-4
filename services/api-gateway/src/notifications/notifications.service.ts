import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly redisService: RedisService,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto) {
    const correlationId = this.generateCorrelationId();

    // Log with correlation ID
    this.logger.log(
      `[${correlationId}] Processing notification request: ${createNotificationDto.request_id}`,
    );

    try {
      // Check idempotency
      const isDuplicate = await this.redisService.checkIdempotency(
        createNotificationDto.request_id,
      );

      if (isDuplicate) {
        this.logger.warn(
          `[${correlationId}] Duplicate request detected: ${createNotificationDto.request_id}`,
        );
        throw new ConflictException(
          'Duplicate request. This notification has already been processed.',
        );
      }

      // Mark as processed
      await this.redisService.setIdempotency(createNotificationDto.request_id);

      // Prepare message for queue
      const message = {
        notification_id: this.generateNotificationId(),
        user_id: createNotificationDto.user_id,
        template_code: createNotificationDto.template_code,
        variables: createNotificationDto.variables,
        request_id: createNotificationDto.request_id,
        priority: createNotificationDto.priority,
        metadata: createNotificationDto.metadata,
        correlation_id: correlationId,
        created_at: new Date().toISOString(),
      };

      // Publish to RabbitMQ
      const published = await this.rabbitmqService.publishNotification(
        createNotificationDto.notification_type,
        message,
      );

      if (!published) {
        throw new Error('Failed to publish notification to queue');
      }

      this.logger.log(
        `[${correlationId}] Notification queued successfully: ${message.notification_id}`,
      );

      return {
        notification_id: message.notification_id,
        status: 'queued',
        message: 'Notification has been queued for processing',
        correlation_id: correlationId,
      };
    } catch (error) {
      this.logger.error(
        `[${correlationId}] Error creating notification`,
        error.stack,
      );
      throw error;
    }
  }

  private generateNotificationId(): string {
    return uuidv4();
  }

  private generateCorrelationId(): string {
    return uuidv4();
  }
}
