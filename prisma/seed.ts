import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const tracksData = [
  {
    label: 'TRACK 1 — WEB & DIGITAL CARE PLANS',
    color: 'bg-rose-100 text-rose-700 border border-rose-200',
    title: 'Website Management & Security',
    subtitle:
      'Three tiers for every stage of business. No lock-in. Cancel or upgrade anytime. All plans include onboarding within 48 hours.',
    order: 1,
    plans: [
      {
        name: 'STARTER',
        price: 55000,
        forLabel: 'For: Micro-businesses and startups (1–10 staff)',
        responseTime: 'Critical issue response: < 8 hours',
        highlight: false,
        order: 1,
        paystackMonthlyId: 'PLN_mrokmpcm14lyzoq',
        features: [
          'Monthly WordPress core, plugin & theme updates',
          'Weekly malware scanning',
          'Basic firewall management',
          'SSL certificate management',
          'Weekly off-site cloud backups (4-week retention)',
          '48-hour site restoration SLA',
          '24/7 uptime monitoring',
          'Quarterly speed audit & optimization',
          '1 content update per month',
          'Monthly performance report',
          'WhatsApp support (business hours)',
        ],
      },
      {
        name: 'GROWTH',
        price: 95000,
        forLabel: 'For: SMEs (10–50 staff)',
        responseTime: 'Critical issue response: < 4 hours',
        highlight: true,
        order: 2,
        paystackMonthlyId: 'PLN_zuinw3nsqv21x6s',
        features: [
          'Everything in Starter, plus:',
          'Weekly plugin & theme updates',
          'Daily malware scanning',
          'Advanced firewall management',
          'Daily off-site backups (8-week retention)',
          '12-hour site restoration SLA',
          'Monthly speed audit & optimization',
          'CDN setup and management',
          'Image compression & performance tuning',
          '3 content updates per month',
          'AI SEO Intelligence available as add-on',
        ],
      },
      {
        name: 'BUSINESS',
        price: 175000,
        forLabel: 'For: Growth-stage SMEs (50–100 staff)',
        responseTime: 'Critical issue response: < 2 hours',
        highlight: false,
        order: 3,
        paystackMonthlyId: 'PLN_x8rrwpb5n5amq8g',
        features: [
          'Everything in Growth, plus:',
          'On-release plugin updates (priority patching)',
          'Priority 24-hour vulnerability patching',
          'Daily backups with 12-week retention',
          '4-hour site restoration SLA',
          '5 content updates per month',
          'Dedicated account manager',
          'Quarterly strategy call with ZDT team',
          'Priority WhatsApp support (extended hours)',
          'AI SEO Intelligence included',
        ],
      },
    ],
  },
  {
    label: 'TRACK 2 — BUSINESS SYSTEMS CARE PLANS',
    color: 'bg-rose-100 text-rose-700 border border-rose-200',
    title: 'IT Infrastructure & Support',
    subtitle:
      'For organisations managing Microsoft 365, Teams, email infrastructure, and internal IT. Scoped by user count. Additional users beyond the tier limit are billed at ₦3,500/user/month.',
    order: 2,
    plans: [
      {
        name: 'ESSENTIALS',
        price: 70000,
        forLabel: 'For: Micro-businesses up to 5 Microsoft 365 users',
        responseTime: 'Critical issue response: < 8 hours',
        highlight: false,
        order: 1,
        paystackMonthlyId: null,
        features: [
          'User account management (add, remove, reset)',
          'Basic Microsoft Teams setup & configuration',
          'Basic email routing & configuration',
          '3 remote helpdesk support incidents per month',
          'WhatsApp & phone support (business hours)',
          'Annual security & access audit',
        ],
      },
      {
        name: 'PROFESSIONAL',
        price: 120000,
        forLabel: 'For: SMEs up to 20 Microsoft 365 users',
        responseTime: 'Critical issue response: < 4 hours',
        highlight: true,
        order: 2,
        paystackMonthlyId: null,
        features: [
          'Everything in Essentials, plus:',
          'Full Microsoft 365 licence management',
          'Full email routing & management',
          'Email security setup (SPF, DKIM, DMARC)',
          'Spam filter & policy management',
          'Advanced Teams configuration',
          'Basic SharePoint & OneDrive admin',
          '8 remote helpdesk incidents per month',
          'Monthly IT health report',
          'Bi-annual security & access audit',
          '1 onsite support visit per quarter (Lagos)',
        ],
      },
      {
        name: 'ENTERPRISE',
        price: 230000,
        forLabel: 'For: Growth-stage SMEs up to 50 Microsoft 365 users',
        responseTime: 'Critical issue response: < 2 hours',
        highlight: false,
        order: 3,
        paystackMonthlyId: null,
        features: [
          'Everything in Professional, plus:',
          'Unlimited remote helpdesk incidents',
          'Full SharePoint & OneDrive management',
          'Advanced Teams custom configuration',
          'Full cloud environment monitoring',
          'Active backup & disaster recovery management',
          'Quarterly DevOps pipeline health check',
          'Quarterly security & access audit',
          'Quarterly IT strategy review',
          'Vendor management support',
          'Dedicated account manager',
          '1 onsite support visit per month (Lagos)',
          'Extended hours support',
        ],
      },
    ],
  },
  {
    label: 'TRACK 3 — DATA INTELLIGENCE PLANS',
    color: 'bg-violet-100 text-violet-700 border border-violet-200',
    title: 'Data Intelligence',
    subtitle:
      'For businesses ready to stop guessing and start deciding with data. Each plan includes a one-time setup fee covering your initial data audit, source connections, tracking review, and dashboard build. Monthly retainer begins once setup is complete (typically 5–10 business days).',
    order: 3,
    plans: [
      {
        name: 'Insight Starter',
        price: 80000,
        setupFee: 40000,
        forLabel:
          'For: Micro businesses and SMEs (1–30 staff) who want to understand their website performance',
        responseTime: '',
        highlight: false,
        order: 1,
        paystackMonthlyId: null,
        features: [
          'Monthly GA4 traffic analysis report',
          'Basic user behaviour analysis (page views, bounce rate, top pages)',
          'Quarterly heatmap and session recording summary',
          'Quarterly data driven website audit with recommendations',
          'Quarterly SEO and technical audit report',
          'Looker Studio dashboard (up to 3 pages, GA4 connected)',
          'Monthly dashboard refresh',
          'Monthly insights report',
          'WhatsApp support (business hours)',
        ],
      },
      {
        name: 'Insight Professional',
        price: 150000,
        setupFee: 80000,
        forLabel: 'For: SMEs (30–100 staff) making marketing and growth decisions',
        responseTime: '',
        highlight: true,
        order: 2,
        paystackMonthlyId: null,
        features: [
          'Monthly full funnel user behaviour analysis',
          'Monthly heatmap and session recording analysis',
          'Bi monthly data driven website audit',
          'Monthly SEO and technical audit report',
          'Quarterly competitor benchmarking report',
          'Social media analytics (up to 2 platforms)',
          'Custom Power BI or Tableau dashboard (up to 8 pages)',
          'Up to 4 connected data sources',
          'Weekly dashboard data refresh',
          'Monthly dashboard maintenance and updates',
          'Custom KPI tracking',
          'Bi annual GA4 and tracking tag health check',
          'One time CRM/database duplicate cleanup per year',
          'Monthly insights report',
          'Quarterly executive presentation (slide deck)',
        ],
      },
      {
        name: 'Insight Enterprise',
        price: 280000,
        setupFee: 150000,
        forLabel:
          'For: Growth stage SMEs (100+ staff) who need data embedded into their operations',
        responseTime: '',
        highlight: false,
        order: 3,
        paystackMonthlyId: null,
        features: [
          'Weekly conversion rate and performance monitoring',
          'Social media analytics (up to 5 platforms)',
          'Multi-source data integration (unlimited sources)',
          'Custom Power BI or Tableau dashboard (unlimited pages)',
          'Daily / real time dashboard refresh',
          'Ongoing dashboard maintenance and feature additions',
          'Custom KPI tracking with executive summary layer',
          'Embedded dashboard (website or intranet)',
          'Quarterly GA4 and tracking tag health check',
          'Quarterly CRM/database duplicate and data quality cleanup',
          'Monthly data pipeline health check',
          'Quarterly data governance advisory',
          'Quarterly data strategy review',
          'Dedicated named data analyst',
          'Monthly executive presentation (slide deck)',
        ],
      },
    ],
  },
];

async function main() {
  console.log('Seeding tracks and plans...');

  for (const trackData of tracksData) {
    const { plans, ...trackFields } = trackData;

    const track = await prisma.track.create({
      data: trackFields,
    });

    for (const planData of plans) {
      await prisma.plan.create({
        data: {
          ...planData,
          trackId: track.id,
        },
      });
    }

    console.log(`✓ Track: ${track.title} (${plans.length} plans)`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
