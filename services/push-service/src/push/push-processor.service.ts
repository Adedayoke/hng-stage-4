import { Injectable, Logger } from '@nestjs/common';
import { FcmService } from '../fcm/fcm.service';

export interface PushMessage {
  notification_id: string;
  user_id: string;
  push_token: string;
  notification_title: string;
  notification_body: string;
  image_url?: string;
  link?: string;
  data: Record<string, any>;
  correlation_id: string;
}

@Injectable()
export class PushProcessorService {
  private readonly logger = new Logger(PushProcessorService.name);

  constructor(private fcmService: FcmService) {}

  async process(message: PushMessage): Promise<void> {
    const { notification_id, push_token, notification_title, notification_body, image_url, link, data, correlation_id } =
      message;

    this.logger.log(
      `Processing push notification: ${notification_id} [${correlation_id}]`,
    );

    if (!push_token) {
      throw new Error('Push token is required but was not provided');
    }

    await this.fcmService.sendPush({
      token: push_token,
      title: notification_title,
      body: notification_body,
      image_url,
      link,
      data: {
        notification_id,
        correlation_id,
        ...data,
      },
    });

    this.logger.log(
      `Push notification sent successfully: ${notification_id} [${correlation_id}]`,
    );
  }
}
