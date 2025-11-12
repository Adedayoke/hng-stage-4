import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateRendererService {
  render(template: string, variables: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return rendered;
  }

  renderMultiple(templates: Record<string, string>, variables: Record<string, any>): Record<string, string> {
    const rendered: Record<string, string> = {};

    for (const [key, template] of Object.entries(templates)) {
      rendered[key] = this.render(template, variables);
    }

    return rendered;
  }
}
