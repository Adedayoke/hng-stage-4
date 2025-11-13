import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { NotificationType } from '../notifications/enums/notification-type.enum';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');
      this.logger.log(`Connecting to RabbitMQ at ${rabbitmqUrl}`);

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      const exchange = this.configService.get<string>('rabbitmq.exchange');
      const emailQueue = this.configService.get<string>('rabbitmq.queues.email');
      const pushQueue = this.configService.get<string>('rabbitmq.queues.push');
      const failedQueue = 'failed.queue';

      // Declare exchange (direct type for routing)
      await this.channel.assertExchange(exchange, 'direct', { durable: true });

      // Declare dead letter queue
      await this.channel.assertQueue(failedQueue, { durable: true });

      // Declare queues with dead letter configuration
      await this.channel.assertQueue(emailQueue, {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: failedQueue,
      });
      await this.channel.assertQueue(pushQueue, {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: failedQueue,
      });

      // Bind queues to exchange with routing keys
      await this.channel.bindQueue(emailQueue, exchange, 'email');
      await this.channel.bindQueue(pushQueue, exchange, 'push');

      this.logger.log('RabbitMQ connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error.stack);
      this.logger.warn('RabbitMQ unavailable - message queuing disabled');
    }
  }

  private async disconnect() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error.stack);
    }
  }

  async publishNotification(notificationType: NotificationType, message: any): Promise<boolean> {
    try {
      const exchange = this.configService.get<string>('rabbitmq.exchange');
      const routingKey = notificationType === NotificationType.EMAIL ? 'email' : 'push';

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true, // Message survives broker restart
          contentType: 'application/json',
          timestamp: Date.now(),
        },
      );

      if (published) {
        this.logger.log(`Published message to ${routingKey} queue`);
      }

      return published;
    } catch (error) {
      this.logger.error('Failed to publish message', error.stack);
      return false;
    }
  }
}