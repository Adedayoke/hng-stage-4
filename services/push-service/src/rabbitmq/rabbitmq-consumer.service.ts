import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { PushProcessorService } from '../push/push-processor.service';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger(RabbitMQConsumerService.name);

  constructor(
    private configService: ConfigService,
    private pushProcessor: PushProcessorService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.startConsuming();
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

      const queue = this.configService.get<string>('rabbitmq.queue');
      const deadLetterQueue = 'failed.queue';

      // Assert dead letter queue
      await this.channel.assertQueue(deadLetterQueue, { durable: true });

      // Assert main queue with dead letter exchange
      await this.channel.assertQueue(queue, {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: deadLetterQueue,
      });

      this.logger.log('RabbitMQ consumer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error.stack);
      this.logger.warn('Push service will not process messages until RabbitMQ is available');
    }
  }

  private async startConsuming() {
    try {
      const queue = this.configService.get<string>('rabbitmq.queue');
      
      await this.channel.consume(
        queue,
        async (msg) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              this.logger.log(`Received message: ${content.notification_id}`);

              await this.pushProcessor.process(content);

              this.channel.ack(msg);
              this.logger.log(`Message processed successfully: ${content.notification_id}`);
            } catch (error) {
              this.logger.error('Error processing message', error.stack);
              
              const retryCount = (msg.properties.headers?.['x-retry-count'] as number) || 0;
              const maxRetries = this.configService.get<number>('retry.maxAttempts') || 3;

              if (retryCount < maxRetries) {
                const nextRetryCount = retryCount + 1;
                this.logger.warn(`Retrying message (attempt ${nextRetryCount}/${maxRetries})`);
                
                const backoffSeconds = this.configService.get<number>('retry.backoffSeconds') || 5;
                const backoffMs = Math.pow(backoffSeconds, nextRetryCount) * 1000;

                setTimeout(() => {
                  // Republish with incremented retry count
                  this.channel.publish(
                    '',
                    queue,
                    msg.content,
                    {
                      headers: {
                        'x-retry-count': nextRetryCount,
                      },
                    },
                  );
                  this.channel.ack(msg);
                }, backoffMs);
              } else {
                this.logger.error(`Max retries (${maxRetries}) reached, moving to dead letter queue`);
                // Reject without requeue - goes to dead letter queue
                this.channel.nack(msg, false, false);
              }
            }
          }
        },
        { noAck: false },
      );

      this.logger.log(`Started consuming from ${queue}`);
    } catch (error) {
      this.logger.error('Failed to start consuming', error.stack);
    }
  }

  private async disconnect() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ consumer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }
}
