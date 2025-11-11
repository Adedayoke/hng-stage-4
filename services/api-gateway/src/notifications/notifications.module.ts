import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RabbitMQModule, RedisModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}