import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KnowledgeService } from './knowledge.service';

@ApiTags('knowledge')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @Post('search')
  @ApiOperation({ summary: '检索《禽病防治教材》疾病章节（科普/百科）' })
  search(@Body() dto: { query: string; species?: string; topK?: number }) {
    return this.knowledgeService.searchDisease(dto.query, dto.species ?? 'chicken', dto.topK ?? 5);
  }

  @Post('farming/search')
  @ApiOperation({ summary: '检索《养鸡疑难300问》养殖管理问答' })
  searchFarming(@Body() dto: { query: string; topK?: number }) {
    return this.knowledgeService.searchFarming(dto.query, dto.topK ?? 5);
  }

  @Get('figures')
  @ApiOperation({ summary: '按病名返回图谱病变图注' })
  figures(@Query('disease') disease: string) {
    return this.knowledgeService.figures(disease ?? '');
  }

  @Get('atlas')
  @ApiOperation({ summary: '结构化图谱索引（图谱百科）' })
  atlas() {
    return this.knowledgeService.atlas();
  }

  @Get('stats')
  @ApiOperation({ summary: '知识库统计（鸡病数量/图片/养鸡技巧篇数+分类目录）' })
  stats() {
    return this.knowledgeService.stats();
  }

  @Get('farming/index')
  @ApiOperation({ summary: '养鸡技巧分类目录（每类含问答文章列表）' })
  farmingIndex() {
    return this.knowledgeService.farmingIndex();
  }

  @Get('farming/article/:id')
  @ApiOperation({ summary: '按 id 返回单篇养鸡技巧问答全文' })
  farmingArticle(@Param('id') id: string) {
    return this.knowledgeService.farmingArticle(id);
  }

  @Get('chapter/:id')
  @ApiOperation({ summary: '按章节 id 返回全文（附图谱图注）' })
  chapter(@Param('id') id: string) {
    return this.knowledgeService.chapter(id);
  }
}
