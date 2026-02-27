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

// All plan prices in Naira — kept in sync with frontend/constants/plans.ts
const PLAN_PRICES: Record<string, number> = {
  STARTER: 55000,
  GROWTH: 95000,
  BUSINESS: 175000,
  ESSENTIALS: 70000,
  PROFESSIONAL: 120000,
  ENTERPRISE: 230000,
  'Insight Starter': 80000,
  'Insight Professional': 150000,
  'Insight Enterprise': 280000,
};

const VALID_PLAN_NAMES = new Set(Object.keys(PLAN_PRICES));

const BUNDLE_DISCOUNT_RATE = 0.075; // 7.5% off when selecting 2+ plans

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

    // If the user already has a company, update it instead of creating a new one
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

    // Link company to user
    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
    });

    return { company, message: 'Company created successfully' };
  }

  // ── Plan Selection ────────────────────────────────────────────────────────
  async selectPlans(userId: string, dto: SelectPlansDto) {
    // Validate all submitted plan names
    const invalid = dto.selectedPlans.filter((p) => !VALID_PLAN_NAMES.has(p));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid plan name(s): ${invalid.join(', ')}`,
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

    // Calculate pricing
    const subtotal = dto.selectedPlans.reduce(
      (sum, name) => sum + (PLAN_PRICES[name] ?? 0),
      0,
    );

    const applyDiscount = dto.selectedPlans.length >= 2;
    const discountAmount = applyDiscount
      ? Math.round(subtotal * BUNDLE_DISCOUNT_RATE)
      : 0;
    const finalAmount = subtotal - discountAmount;

    await this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        selectedPlans: dto.selectedPlans,
        bundleDiscount: discountAmount,
        amount: finalAmount,
        // Reset payment verification when plans change
        paymentVerified: false,
      },
    });

    return {
      message: 'Plan selection saved. Proceed to payment.',
      selectedPlans: dto.selectedPlans,
      subtotal,
      discountAmount,
      finalAmount,
      discountApplied: applyDiscount,
    };
  }
}
