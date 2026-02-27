import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSubscribers(search?: string) {
    const companies = await this.prisma.company.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      include: {
        users: {
          select: { id: true, firstName: true, lastName: true, email: true },
          take: 1,
        },
        transactions: { orderBy: { date: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Resolve plan IDs → names
    const allPlanIds = [...new Set(companies.flatMap((c) => c.selectedPlans))];
    const planMap: Record<string, string> = {};
    if (allPlanIds.length > 0) {
      const plans = await this.prisma.plan.findMany({
        where: { id: { in: allPlanIds } },
        select: { id: true, name: true },
      });
      for (const p of plans) planMap[p.id] = p.name;
    }

    const result = companies.map((c) => ({
      ...c,
      selectedPlans: c.selectedPlans.map((id) => planMap[id] ?? id),
    }));

    return { companies: result };
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
          include: { company: { select: { name: true } } },
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
