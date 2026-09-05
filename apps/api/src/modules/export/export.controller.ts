import { Controller, Get, Param, Res, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ExportService } from './export.service';

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get(':entity')
  @ApiOperation({ summary: '导出 CSV（diagnoses/immunizations/epidemic-records/orders/daily-records）' })
  async export(@Request() req, @Param('entity') entity: string, @Res() res: any) {
    const { filename, csv } = await this.exportService.exportEntity(req.user, entity);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
