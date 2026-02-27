import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { SelectPlansDto } from './dto/select-plans.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.onboardingService.updateProfile(req.user.id, dto);
  }

  @Post('company')
  @HttpCode(HttpStatus.OK)
  async createCompany(@Request() req, @Body() dto: CreateCompanyDto) {
    return this.onboardingService.createCompany(req.user.id, dto);
  }

  @Post('plan')
  @HttpCode(HttpStatus.OK)
  async selectPlans(@Request() req, @Body() dto: SelectPlansDto) {
    return this.onboardingService.selectPlans(req.user.id, dto);
  }
}
