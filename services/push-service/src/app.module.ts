import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { PushModule } from './push/push.module';
import { FcmModule } from './fcm/fcm.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    RabbitMQModule,
    PushModule,
    FcmModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
