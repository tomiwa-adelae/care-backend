import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('subscribers')
  getSubscribers(@Query('search') search?: string) {
    return this.adminService.getSubscribers(search);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Patch('subscribers/:companyId/status')
  updateStatus(
    @Param('companyId') companyId: string,
    @Body('status') status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED',
  ) {
    return this.adminService.updateSubscriptionStatus(companyId, status);
  }
}
