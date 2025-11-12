import {
  ConflictException,
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { RedisService } from '../redis/redis.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from './enums/notification-type.enum';

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

      const notificationId = this.generateNotificationId();

      // Fetch user data from User Service
      const userData = await this.fetchUserData(createNotificationDto.user_id);

      // Fetch template from Template Service
      const templateData = await this.fetchTemplateData(
        createNotificationDto.template_code,
      );

      // Render template with variables
      const renderedContent = this.renderTemplate(
        templateData,
        createNotificationDto.variables,
      );

      // Build enriched message based on notification type
      const message = this.buildEnrichedMessage(
        notificationId,
        correlationId,
        createNotificationDto.notification_type,
        userData,
        templateData,
        renderedContent,
        createNotificationDto.variables,
      );

      // Publish to RabbitMQ
      const published = await this.rabbitmqService.publishNotification(
        createNotificationDto.notification_type,
        message,
      );

      if (!published) {
        throw new InternalServerErrorException(
          'Failed to publish notification to queue',
        );
      }

      // Mark as processed
      await this.redisService.setIdempotency(createNotificationDto.request_id);

      this.logger.log(
        `[${correlationId}] Notification queued successfully: ${notificationId}`,
      );

      return {
        notification_id: notificationId,
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

  private async fetchUserData(userId: string): Promise<any> {
    try {
      const response = await fetch(
        `${process.env.USER_SERVICE_URL}/api/v1/users/${userId}`,
      );
      if (!response.ok) {
        throw new Error(`User service returned ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error(`Failed to fetch user ${userId}`, error.message);
      throw new BadRequestException(
        'User not found or user service unavailable',
      );
    }
  }

  private async fetchTemplateData(templateCode: string): Promise<any> {
    try {
      const response = await fetch(
        `${process.env.TEMPLATE_SERVICE_URL}/api/v1/templates/${templateCode}`,
      );
      if (!response.ok) {
        throw new Error(`Template service returned ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch template ${templateCode}`,
        error.message,
      );
      throw new BadRequestException(
        'Template not found or template service unavailable',
      );
    }
  }

  private renderTemplate(
    template: any,
    variables: Record<string, any>,
  ): any {
    const render = (text: string) => {
      if (!text) return '';
      let rendered = text;
      for (const [key, value] of Object.entries(variables)) {
        rendered = rendered.replace(
          new RegExp(`{{${key}}}`, 'g'),
          String(value),
        );
      }
      return rendered;
    };

    return {
      title: render(
        template.notification_title || template.subject || '',
      ),
      body: render(
        template.notification_body || template.html_body || '',
      ),
      textBody: template.text_body ? render(template.text_body) : undefined,
    };
  }

  private buildEnrichedMessage(
    notificationId: string,
    correlationId: string,
    notificationType: string,
    userData: any,
    templateData: any,
    renderedContent: any,
    variables: Record<string, any>,
  ): any {
    const baseMessage = {
      notification_id: notificationId,
      user_id: userData.user_id,
      correlation_id: correlationId,
      data: {
        template_code: templateData.template_code,
        ...variables,
      },
    };

    if (notificationType === NotificationType.PUSH) {
      return {
        ...baseMessage,
        push_token: userData.push_token,
        notification_title: renderedContent.title,
        notification_body: renderedContent.body,
        image_url: templateData.image_url || null,
        link: templateData.link || null,
      };
    } else {
      return {
        ...baseMessage,
        email: userData.email,
        subject: renderedContent.title,
        html_body: renderedContent.body,
        text_body: renderedContent.textBody || renderedContent.body,
      };
    }
  }

  private generateNotificationId(): string {
    return uuidv4();
  }

  private generateCorrelationId(): string {
    return uuidv4();
  }
}
