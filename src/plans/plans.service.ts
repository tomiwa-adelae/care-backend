import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  async getAllTracks() {
    return this.prisma.track.findMany({
      orderBy: { order: 'asc' },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  // ── Track CRUD ─────────────────────────────────────────────────────────────

  async createTrack(dto: CreateTrackDto) {
    const track = await this.prisma.track.create({ data: dto });
    return { track, message: 'Track created' };
  }

  async updateTrack(trackId: string, dto: Partial<CreateTrackDto>) {
    const track = await this.prisma.track.update({
      where: { id: trackId },
      data: dto,
    });
    return { track, message: 'Track updated' };
  }

  async deleteTrack(trackId: string) {
    const plans = await this.prisma.plan.count({ where: { trackId } });
    if (plans > 0) {
      throw new BadRequestException(
        'Delete or deactivate all plans in this track first',
      );
    }
    await this.prisma.track.delete({ where: { id: trackId } });
    return { message: 'Track deleted' };
  }

  // ── Plan CRUD ──────────────────────────────────────────────────────────────

  async createPlan(trackId: string, dto: CreatePlanDto) {
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track) throw new NotFoundException('Track not found');

    const plan = await this.prisma.plan.create({
      data: { ...dto, trackId },
    });
    return { plan, message: 'Plan created' };
  }

  async updatePlan(planId: string, dto: Partial<CreatePlanDto>) {
    const plan = await this.prisma.plan.update({
      where: { id: planId },
      data: dto,
    });
    return { plan, message: 'Plan updated' };
  }

  async deletePlan(planId: string) {
    // Soft delete — preserve references from company.selectedPlans
    const plan = await this.prisma.plan.update({
      where: { id: planId },
      data: { isActive: false },
    });
    return { plan, message: 'Plan deactivated' };
  }
}
