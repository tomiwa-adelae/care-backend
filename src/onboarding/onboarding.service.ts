import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { SelectPlansDto } from './dto/select-plans.dto';

const BILLING_MULTIPLIERS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  annually: 12,
};

const BILLING_DISCOUNTS: Record<string, number> = {
  monthly: 0,
  quarterly: 0.05,
  annually: 0.1,
};

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  private generateCompanyId(name: string): string {
    const prefix = name
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
    const suffix = Array.from({ length: 4 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(
        Math.floor(Math.random() * 36),
      ),
    ).join('');
    return `${prefix}-${suffix}`;
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        image: dto.image,
        dob: dto.dob,
        gender: dto.gender,
        phoneNumber: dto.phoneNumber,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        image: true,
        phoneNumber: true,
        createdAt: true,
        city: true,
        address: true,
        state: true,
        country: true,
        gender: true,
        dob: true,
        role: true,
        onboardingCompleted: true,
        companyId: true,
      },
    });

    return { user: updated, message: 'Profile updated successfully' };
  }

  // ── Company ───────────────────────────────────────────────────────────────
  async createCompany(userId: string, dto: CreateCompanyDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const slug = slugify(dto.companyName, { lower: true, strict: true });
    const companyID = this.generateCompanyId(dto.companyName);

    if (user.companyId) {
      const updated = await this.prisma.company.update({
        where: { id: user.companyId },
        data: {
          name: dto.companyName,
          websiteUrl: dto.website,
          industry: dto.industry,
          companySize: dto.companySize,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          companyPhone: dto.companyPhone,
          rcNumber: dto.rcNumber,
          logoUrl: dto.logoUrl,
          slug,
        },
      });
      return { company: updated, message: 'Company updated successfully' };
    }

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        websiteUrl: dto.website,
        industry: dto.industry,
        companySize: dto.companySize,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        companyPhone: dto.companyPhone,
        rcNumber: dto.rcNumber,
        logoUrl: dto.logoUrl,
        slug,
        companyID,
        amount: 0,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
    });

    return { company, message: 'Company created successfully' };
  }

  // ── Plan Selection ────────────────────────────────────────────────────────
  async selectPlans(userId: string, dto: SelectPlansDto) {
    // Fetch plans from DB by IDs
    const plans = await this.prisma.plan.findMany({
      where: { id: { in: dto.selectedPlans }, isActive: true },
    });

    if (plans.length !== dto.selectedPlans.length) {
      const foundIds = new Set(plans.map((p) => p.id));
      const missing = dto.selectedPlans.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Invalid or inactive plan ID(s): ${missing.join(', ')}`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.companyId || !user.company) {
      throw new BadRequestException(
        'Please complete company setup before selecting a plan',
      );
    }

    const cycle = dto.billingCycle ?? 'monthly';
    const multiplier = BILLING_MULTIPLIERS[cycle] ?? 1;
    const discountRate = BILLING_DISCOUNTS[cycle] ?? 0;

    const subtotal = plans.reduce((sum, p) => sum + p.price, 0);
    const periodSubtotal = subtotal * multiplier;
    const discountAmount = Math.round(periodSubtotal * discountRate);
    const finalAmount = periodSubtotal - discountAmount;

    await this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        selectedPlans: dto.selectedPlans,
        bundleDiscount: discountAmount,
        amount: finalAmount,
        subscriptionType: cycle,
        paymentVerified: false,
      },
    });

    return {
      message: 'Plan selection saved. Proceed to payment.',
      selectedPlans: dto.selectedPlans,
      subtotal,
      periodSubtotal,
      discountAmount,
      finalAmount,
      billingCycle: cycle,
    };
  }
}
