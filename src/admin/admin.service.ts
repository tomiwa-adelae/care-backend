import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getSubscriberDetail(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
            onboardingCompleted: true,
          },
        },
        transactions: { orderBy: { date: 'desc' } },
        tickets: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!company) throw new NotFoundException('Subscriber not found');

    // Resolve plan IDs → full plan objects
    let plans: any[] = [];
    if (company.selectedPlans.length > 0) {
      plans = await this.prisma.plan.findMany({
        where: { id: { in: company.selectedPlans } },
        select: {
          id: true,
          name: true,
          price: true,
          forLabel: true,
          features: true,
          responseTime: true,
          track: { select: { title: true, label: true, color: true } },
        },
      });
    }

    return {
      company: {
        id: company.id,
        name: company.name,
        companyID: company.companyID,
        slug: company.slug,
        websiteUrl: company.websiteUrl,
        industry: company.industry,
        companySize: company.companySize,
        companyPhone: company.companyPhone,
        logoUrl: company.logoUrl,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        rcNumber: company.rcNumber,
        status: company.status,
        amount: company.amount,
        bundleDiscount: company.bundleDiscount,
        subscriptionType: company.subscriptionType,
        nextBilling: company.nextBilling,
        paymentVerified: company.paymentVerified,
        paystackCustomerCode: company.paystackCustomerCode,
        paystackSubCode: company.paystackSubCode,
        createdAt: company.createdAt,
      },
      users: company.users,
      plans,
      transactions: company.transactions,
      tickets: company.tickets,
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
