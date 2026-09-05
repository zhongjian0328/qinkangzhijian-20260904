import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { PoultryHouseModule } from './modules/poultry-house/poultry-house.module';
import { UploadModule } from './modules/upload/upload.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ProductionModule } from './modules/production/production.module';
import { PreventionModule } from './modules/prevention/prevention.module';
import { EnvironmentModule } from './modules/environment/environment.module';
import { EpidemicModule } from './modules/epidemic/epidemic.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { BulkPurchaseModule } from './modules/bulk-purchase/bulk-purchase.module';
import { LearningModule } from './modules/learning/learning.module';
import { CertificationModule } from './modules/certification/certification.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ConsultModule } from './modules/consult/consult.module';
import { PolicyModule } from './modules/policy/policy.module';
import { AnnotationModule } from './modules/annotation/annotation.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ImmunizationModule } from './modules/immunization/immunization.module';
import { EpidemicAlertModule } from './modules/epidemic-alert/epidemic-alert.module';
import { EpidemiologyModule } from './modules/epidemiology/epidemiology.module';
import { CourseModule } from './modules/course/course.module';
import { ExamPaperModule } from './modules/exam-paper/exam-paper.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    DiagnosisModule,
    PoultryHouseModule,
    UploadModule,
    KnowledgeModule,
    ProductionModule,
    PreventionModule,
    EnvironmentModule,
    EpidemicModule,
    CommerceModule,
    MerchantModule,
    BulkPurchaseModule,
    LearningModule,
    CertificationModule,
    NotificationModule,
    ConsultModule,
    PolicyModule,
    AnnotationModule,
    CollaborationModule,
    CustomerModule,
    ImmunizationModule,
    EpidemicAlertModule,
    EpidemiologyModule,
    CourseModule,
    ExamPaperModule,
    ExportModule,
  ],
})
export class AppModule {}
