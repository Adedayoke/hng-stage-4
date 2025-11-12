import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT || 3003;

  await app.listen(port);
  logger.log(`Push Service is running on port ${port}`);
}
bootstrap();
