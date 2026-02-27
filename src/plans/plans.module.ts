import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { AdminPlansController } from './admin-plans.controller';
import { PlansService } from './plans.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PlansController, AdminPlansController],
  providers: [PlansService, PrismaService],
  exports: [PlansService],
})
export class PlansModule {}
