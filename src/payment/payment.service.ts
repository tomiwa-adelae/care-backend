import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    // 1. Verify transaction with Paystack
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(dto.reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const body = (await res.json()) as any;

    if (!res.ok) {
      throw new BadRequestException(
        body?.message ?? 'Paystack verification failed',
      );
    }

    if (!body.status || body.data?.status !== 'success') {
      throw new BadRequestException(
        body?.message ?? 'Payment was not successful',
      );
    }

    const txData = body.data;

    // 2. Find user + company
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (!user.companyId || !user.company) {
      throw new BadRequestException('Company not found');
    }

    // Prevent duplicate processing
    const existing = await this.prisma.transaction.findUnique({
      where: { paystackRef: dto.reference },
    });
    if (existing) {
      return { message: 'Payment already recorded', alreadyProcessed: true };
    }

    // 3. Calculate next billing date based on billing cycle
    const cycle = dto.billingCycle ?? 'monthly';
    const nextBilling = new Date();
    if (cycle === 'quarterly') {
      nextBilling.setDate(nextBilling.getDate() + 90);
    } else if (cycle === 'annually') {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    } else {
      nextBilling.setDate(nextBilling.getDate() + 30);
    }

    // 4. Update company subscription details
    await this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        status: 'ACTIVE',
        paymentVerified: true,
        nextBilling,
        subscriptionType: cycle,
        paystackCustomerCode: txData.customer?.customer_code ?? null,
        paystackSubCode: txData.subscription?.subscription_code ?? null,
        selectedPlans: dto.selectedPlans,
        amount: dto.amount,
        ...(dto.discountAmount !== undefined
          ? { bundleDiscount: dto.discountAmount }
          : {}),
      },
    });

    // 5. Resolve plan IDs to names for the description
    const plans = await this.prisma.plan.findMany({
      where: { id: { in: dto.selectedPlans } },
      select: { name: true },
    });
    const planNames = plans.map((p) => p.name);
    const cycleLabel =
      cycle === 'annually'
        ? 'Annual'
        : cycle === 'quarterly'
          ? 'Quarterly'
          : 'Monthly';
    const description = `${planNames.join(' + ')} — ${cycleLabel} Subscription`;

    await this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        description,
        status: 'Paid',
        paystackRef: dto.reference,
        type: cycle === 'monthly' ? 'subscription' : 'one_time',
        companyId: user.companyId,
      },
    });

    // 6. Mark onboarding complete
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return { message: 'Payment verified and subscription activated' };
  }
}
