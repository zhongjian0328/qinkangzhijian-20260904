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

  async atlas() {
    const url = `${this.aiUrl()}/knowledge/atlas`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new BadRequestException(`知识服务返回 ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    // 把 AI 返回的图号文件名映射为可对外访问的静态路径 /atlas/xxx.jpg
    const atlases = (data?.atlases ?? []).map((a: any) => ({
      ...a,
      diseases: (a.diseases ?? []).map((d: any) => ({
        ...d,
        figures: (d.figures ?? []).map((f: any) => ({
          text: f.text,
          image: f.file ? `/atlas/${f.file}` : null,
        })),
      })),
    }));
    return { atlases, total: data?.total ?? 0 };
  }
}
