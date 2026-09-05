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

  @Get('chapter/:id')
  @ApiOperation({ summary: '按章节 id 返回全文（附图谱图注）' })
  chapter(@Param('id') id: string) {
    return this.knowledgeService.chapter(id);
  }
}
