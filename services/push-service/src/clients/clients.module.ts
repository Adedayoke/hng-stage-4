import { Module } from '@nestjs/common';
import { UserServiceClient } from './user-service.client';
import { TemplateServiceClient } from './template-service.client';

@Module({
  providers: [UserServiceClient, TemplateServiceClient],
  exports: [UserServiceClient, TemplateServiceClient],
})
export class ClientsModule {}
