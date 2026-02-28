import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        phoneNumber: true,
        image: true,
        dob: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        country: true,
        role: true,
        onboardingCompleted: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
            industry: true,
            companySize: true,
            companyPhone: true,
            logoUrl: true,
            address: true,
            city: true,
            state: true,
            country: true,
            rcNumber: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.password) {
      throw new BadRequestException(
        'This account uses social login — password cannot be changed here',
      );
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { message: 'Password changed successfully' };
  }

  async getDashboardData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 5,
            },
            tickets: {
              where: { status: { not: 'CLOSED' } },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const company = user.company;

    // Resolve plan IDs to full plan objects
    let plans: any[] = [];
    if (company && company.selectedPlans.length > 0) {
      plans = await this.prisma.plan.findMany({
        where: { id: { in: company.selectedPlans } },
        select: {
          id: true,
          name: true,
          price: true,
          setupFee: true,
          features: true,
          highlight: true,
          responseTime: true,
          forLabel: true,
        },
      });
    }

    return {
      company: company
        ? {
            id: company.id,
            name: company.name,
            logoUrl: company.logoUrl,
            plans,
            amount: company.amount,
            bundleDiscount: company.bundleDiscount,
            status: company.status,
            nextBilling: company.nextBilling,
            paymentVerified: company.paymentVerified,
            subscriptionType: company.subscriptionType,
          }
        : null,
      transactions: company?.transactions ?? [],
      openTicketsCount: company?.tickets?.length ?? 0,
    };
  }
}
