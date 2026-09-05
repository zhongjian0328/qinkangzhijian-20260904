import { Module } from '@nestjs/common';
import { ExamPaperController } from './exam-paper.controller';
import { ExamPaperService } from './exam-paper.service';

@Module({
  controllers: [ExamPaperController],
  providers: [ExamPaperService],
})
export class ExamPaperModule {}
