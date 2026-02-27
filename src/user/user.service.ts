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

    return {
      company: company
        ? {
            id: company.id,
            name: company.name,
            logoUrl: company.logoUrl,
            selectedPlans: company.selectedPlans,
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
