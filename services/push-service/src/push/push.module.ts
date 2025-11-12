import { Module } from '@nestjs/common';
import { PushProcessorService } from './push-processor.service';
import { FcmModule } from '../fcm/fcm.module';

@Module({
  imports: [FcmModule],
  providers: [PushProcessorService],
  exports: [PushProcessorService],
})
export class PushModule {}
