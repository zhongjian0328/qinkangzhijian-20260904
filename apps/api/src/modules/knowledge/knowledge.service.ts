import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  private aiUrl() {
    return process.env.AI_SERVICE_URL ?? 'http://localhost:5000';
  }

  private async proxy(path: string, body: unknown) {
    const response = await fetch(`${this.aiUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    if (!response.ok) {
      throw new BadRequestException(`知识服务返回 ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async searchDisease(query: string, species: string, topK = 5) {
    return this.proxy('/knowledge/search', { query, species, top_k: topK });
  }

  async searchFarming(query: string, topK = 5) {
    return this.proxy('/knowledge/farming/search', { query, top_k: topK });
  }

  async figures(disease: string) {
    const url = `${this.aiUrl()}/knowledge/figures?disease=${encodeURIComponent(disease)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new BadRequestException(`知识服务返回 ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async chapter(id: string) {
    const url = `${this.aiUrl()}/knowledge/chapter/${encodeURIComponent(id)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new BadRequestException(`知识服务返回 ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }
}
