import { Module, forwardRef } from '@nestjs/common';
import { RabbitMQConsumerService } from './rabbitmq-consumer.service';
import { PushModule } from '../push/push.module';

@Module({
  imports: [forwardRef(() => PushModule)],
  providers: [RabbitMQConsumerService],
  exports: [RabbitMQConsumerService],
})
export class RabbitMQModule {}
