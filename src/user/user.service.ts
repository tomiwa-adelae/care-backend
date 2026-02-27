import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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
