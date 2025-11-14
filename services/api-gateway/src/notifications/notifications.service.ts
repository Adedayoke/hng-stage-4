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
        `${process.env.USER_SERVICE_URL}/users/${userId}`,
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
        `${process.env.TEMPLATE_SERVICE_URL}/templates/${templateCode}`,
      );
      if (!response.ok) {
        throw new Error(`Template service returned ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch template ${templateCode}, using fallback test template`,
        error.message,
      );
      // Return test template for demonstration purposes
      return this.getTestTemplate(templateCode);
    }
  }

  private getTestTemplate(templateCode: string): any {
    const testTemplates = {
      'WELCOME_EMAIL': {
        template_code: 'WELCOME_EMAIL',
        subject: 'Welcome to {{app_name}}, {{user_name}}!',
        notification_title: 'Welcome to {{app_name}}!',
        notification_body: 'Hi {{user_name}}, thanks for joining us!',
        html_body: '<h1>Welcome {{user_name}}!</h1><p>Thanks for joining {{app_name}}. We are excited to have you on board.</p>',
        text_body: 'Welcome {{user_name}}! Thanks for joining {{app_name}}. We are excited to have you on board.',
        image_url: null,
        link: null,
      },
      'PASSWORD_RESET': {
        template_code: 'PASSWORD_RESET',
        subject: 'Reset Your Password',
        notification_title: 'Password Reset Request',
        notification_body: 'Hi {{user_name}}, click to reset your password',
        html_body: '<h1>Password Reset</h1><p>Hi {{user_name}},</p><p>We received a request to reset your password. Click the link below to proceed:</p><p><a href="{{reset_link}}">Reset Password</a></p>',
        text_body: 'Hi {{user_name}}, we received a request to reset your password. Use this link: {{reset_link}}',
        image_url: null,
        link: '{{reset_link}}',
      },
      'ORDER_CONFIRMATION': {
        template_code: 'ORDER_CONFIRMATION',
        subject: 'Order Confirmation #{{order_id}}',
        notification_title: 'Order Confirmed!',
        notification_body: 'Your order #{{order_id}} has been confirmed',
        html_body: '<h1>Order Confirmation</h1><p>Hi {{user_name}},</p><p>Your order #{{order_id}} totaling {{order_total}} has been confirmed and is being processed.</p>',
        text_body: 'Hi {{user_name}}, your order #{{order_id}} totaling {{order_total}} has been confirmed.',
        image_url: null,
        link: null,
      },
      'TEST_NOTIFICATION': {
        template_code: 'TEST_NOTIFICATION',
        subject: 'Test Notification',
        notification_title: 'Test Message',
        notification_body: 'This is a test notification for {{user_name}}',
        html_body: '<h1>Test Notification</h1><p>Hello {{user_name}},</p><p>This is a test message to verify the notification system is working correctly.</p>',
        text_body: 'Hello {{user_name}}, this is a test message to verify the notification system is working correctly.',
        image_url: null,
        link: null,
      },
    };

    return testTemplates[templateCode] || {
      template_code: templateCode,
      subject: 'Notification for {{user_name}}',
      notification_title: 'New Notification',
      notification_body: 'You have a new notification',
      html_body: '<p>Hello {{user_name}}, you have a new notification.</p>',
      text_body: 'Hello {{user_name}}, you have a new notification.',
      image_url: null,
      link: null,
    };
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
      user_id: userData.id || userData.user_id,
      correlation_id: correlationId,
      data: {
        template_code: templateData.template_code,
        ...variables,
      },
    };

    if (notificationType === NotificationType.PUSH) {
      if (!userData.push_token) {
        throw new BadRequestException(
          `User does not have a push token. Please ensure the user has registered their device.`,
        );
      }
      
      return {
        ...baseMessage,
        push_token: userData.push_token,
        notification_title: renderedContent.title,
        notification_body: renderedContent.body,
        image_url: templateData.image_url || null,
        link: templateData.link || null,
      };
    } else {
      if (!userData.email) {
        throw new BadRequestException(
          `User does not have an email address.`,
        );
      }
      
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
