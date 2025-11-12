import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TemplateData {
  template_code: string;
  notification_title: string;
  notification_body: string;
  image_url?: string;
  link?: string;
}

@Injectable()
export class TemplateServiceClient {
  private readonly logger = new Logger(TemplateServiceClient.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('services.templateService') || 'http://localhost:3004';
  }

  async getTemplate(templateCode: string): Promise<TemplateData> {
    try {
      this.logger.log(`Fetching template: ${templateCode}`);
      
      const response = await axios.get(`${this.baseUrl}/api/v1/templates/${templateCode}`);
      
      if (!response.data.success) {
        throw new Error('Template service returned unsuccessful response');
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to fetch template ${templateCode}`, error.message);
      throw new Error(`Template service error: ${error.message}`);
    }
  }
}
