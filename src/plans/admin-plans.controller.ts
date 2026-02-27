import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTrackDto } from './dto/create-track.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

@Controller('admin/plans')
@UseGuards(JwtAuthGuard)
export class AdminPlansController {
  constructor(private plans: PlansService) {}

  // ── Tracks ─────────────────────────────────────────────────────────────────
  @Post('tracks')
  createTrack(@Body() dto: CreateTrackDto) {
    return this.plans.createTrack(dto);
  }

  @Patch('tracks/:id')
  updateTrack(@Param('id') id: string, @Body() dto: Partial<CreateTrackDto>) {
    return this.plans.updateTrack(id, dto);
  }

  @Delete('tracks/:id')
  deleteTrack(@Param('id') id: string) {
    return this.plans.deleteTrack(id);
  }

  // ── Plans ──────────────────────────────────────────────────────────────────
  @Post('tracks/:trackId/plans')
  createPlan(@Param('trackId') trackId: string, @Body() dto: CreatePlanDto) {
    return this.plans.createPlan(trackId, dto);
  }

  @Patch(':planId')
  updatePlan(
    @Param('planId') planId: string,
    @Body() dto: Partial<CreatePlanDto>,
  ) {
    return this.plans.updatePlan(planId, dto);
  }

  @Delete(':planId')
  deletePlan(@Param('planId') planId: string) {
    return this.plans.deletePlan(planId);
  }
}
