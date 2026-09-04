import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { PoultryHouseModule } from './modules/poultry-house/poultry-house.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    AuthModule,
    UserModule,
    DiagnosisModule,
    PoultryHouseModule,
  ],
})
export class AppModule {}
