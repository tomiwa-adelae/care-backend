import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSubscribers(search?: string) {
    const companies = await this.prisma.company.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              {
                selectedPlans: {
                  hasSome: [search],
                },
              },
            ],
          }
        : undefined,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          take: 1,
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { companies };
  }

  async getStats() {
    const [revenueAgg, activeSubscribers, openTickets, recentTransactions] =
      await Promise.all([
        this.prisma.transaction.aggregate({ _sum: { amount: true } }),
        this.prisma.company.count({ where: { status: 'ACTIVE', paymentVerified: true } }),
        this.prisma.ticket.count({ where: { status: 'OPEN' } }),
        this.prisma.transaction.findMany({
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            company: { select: { name: true } },
          },
        }),
      ]);

    return {
      totalRevenue: revenueAgg._sum.amount ?? 0,
      activeSubscribers,
      openTickets,
      recentTransactions,
    };
  }

  async updateSubscriptionStatus(
    companyId: string,
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED',
  ) {
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { status },
    });
    return { company: updated, message: `Subscription ${status.toLowerCase()}` };
  }
}
