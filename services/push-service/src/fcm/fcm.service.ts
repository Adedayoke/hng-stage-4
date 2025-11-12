import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  image_url?: string;
  link?: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      const projectId = this.configService.get<string>('fcm.projectId');
      const privateKey = this.configService.get<string>('fcm.privateKey');
      const clientEmail = this.configService.get<string>('fcm.clientEmail');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('FCM credentials not configured. Push notifications will not be sent.');
        return;
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
      });

      this.logger.log('FCM initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize FCM', error.stack);
      this.logger.warn('Push service will continue without FCM');
    }
  }

  async sendPush(payload: PushNotificationPayload): Promise<void> {
    if (!this.app) {
      this.logger.warn('FCM not initialized. Skipping push notification.');
      return;
    }

    try {
      const message: admin.messaging.Message = {
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.image_url && { imageUrl: payload.image_url }),
        },
        data: {
          ...(payload.link && { link: payload.link }),
          ...payload.data,
        },
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent successfully: ${response}`);
    } catch (error) {
      this.logger.error('Failed to send push notification', error.stack);
      throw new Error(`FCM error: ${error.message}`);
    }
  }
}
