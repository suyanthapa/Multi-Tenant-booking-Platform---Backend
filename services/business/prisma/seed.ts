import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }) as any;

const BusinessType = {
  HOTEL: "HOTEL",
  CLINIC: "CLINIC",
  SALON: "SALON",
  CO_WORKING: "CO_WORKING",
  OTHER: "OTHER",
} as const;

const BusinessStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  DELETED: "DELETED",
  REJECTED: "REJECTED",
} as const;

const RejectionReason = {
  INVALID_DOCUMENTS: "INVALID_DOCUMENTS",
  INCOMPLETE_PROFILE: "INCOMPLETE_PROFILE",
  DUPLICATE_ACCOUNT: "DUPLICATE_ACCOUNT",
  PROHIBITED_CONTENT: "PROHIBITED_CONTENT",
  UNRESPONSIVE: "UNRESPONSIVE",
  OTHER: "OTHER",
} as const;

type BusinessTypeValue = (typeof BusinessType)[keyof typeof BusinessType];
type RejectionReasonValue =
  (typeof RejectionReason)[keyof typeof RejectionReason];

const rejectionReasonPool: RejectionReasonValue[] = [
  RejectionReason.INVALID_DOCUMENTS,
  RejectionReason.INCOMPLETE_PROFILE,
  RejectionReason.DUPLICATE_ACCOUNT,
  RejectionReason.PROHIBITED_CONTENT,
  RejectionReason.UNRESPONSIVE,
  RejectionReason.OTHER,
];

const reasonNotes: Record<RejectionReasonValue, string> = {
  INVALID_DOCUMENTS:
    "Submitted business registration documents are unreadable or do not match ownership details.",
  INCOMPLETE_PROFILE:
    "Business profile is missing required address, contact, or operational details.",
  DUPLICATE_ACCOUNT:
    "A similar business listing already exists for this owner and category.",
  PROHIBITED_CONTENT:
    "Business description contains prohibited or policy-violating content.",
  UNRESPONSIVE:
    "Verification team could not reach the owner after multiple attempts.",
  OTHER: "Business application requires manual review before approval.",
};

const businessTypes: BusinessTypeValue[] = [
  BusinessType.HOTEL,
  BusinessType.CLINIC,
  BusinessType.SALON,
  BusinessType.CO_WORKING,
  BusinessType.OTHER,
];

const randomReason = (): RejectionReasonValue =>
  rejectionReasonPool[Math.floor(Math.random() * rejectionReasonPool.length)];

async function main() {
  const rejectedOneReason = randomReason();
  const rejectedTwoReason = randomReason();

  const businesses = [
    {
      id: "biz_seed_001",
      ownerId: "auth_user_seed_002",
      name: "Seed Business 01",
      description: "Hotel business seeded for integration testing.",
      type: businessTypes[0],
      address: {
        street: "101 Seed Street",
        city: "Kathmandu",
        country: "Nepal",
      },
      phone: "+977-9800000001",
      email: "biz01@seed.local",
      status: BusinessStatus.PENDING,
      isVerified: false,
      rejectionReasons: [] as RejectionReasonValue[],
      adminNotes: null as string | null,
      rejectedAt: null as Date | null,
      resubmitted: false,
      approvedAt: null as Date | null,
    },
    {
      id: "biz_seed_002",
      ownerId: "auth_user_seed_003",
      name: "Seed Business 02",
      description: "Clinic business seeded for integration testing.",
      type: businessTypes[1],
      address: {
        street: "102 Seed Street",
        city: "Pokhara",
        country: "Nepal",
      },
      phone: "+977-9800000002",
      email: "biz02@seed.local",
      status: BusinessStatus.PENDING,
      isVerified: false,
      rejectionReasons: [] as RejectionReasonValue[],
      adminNotes: null as string | null,
      rejectedAt: null as Date | null,
      resubmitted: false,
      approvedAt: null as Date | null,
    },
    {
      id: "biz_seed_003",
      ownerId: "auth_user_seed_004",
      name: "Seed Business 03",
      description: "Salon business seeded for integration testing.",
      type: businessTypes[2],
      address: {
        street: "103 Seed Street",
        city: "Lalitpur",
        country: "Nepal",
      },
      phone: "+977-9800000003",
      email: "biz03@seed.local",
      status: BusinessStatus.PENDING,
      isVerified: false,
      rejectionReasons: [] as RejectionReasonValue[],
      adminNotes: null as string | null,
      rejectedAt: null as Date | null,
      resubmitted: false,
      approvedAt: null as Date | null,
    },
    {
      id: "biz_seed_004",
      ownerId: "auth_user_seed_005",
      name: "Seed Business 04",
      description: "Co-working business seeded for integration testing.",
      type: businessTypes[3],
      address: {
        street: "104 Seed Street",
        city: "Bhaktapur",
        country: "Nepal",
      },
      phone: "+977-9800000004",
      email: "biz04@seed.local",
      status: BusinessStatus.PENDING,
      isVerified: false,
      rejectionReasons: [] as RejectionReasonValue[],
      adminNotes: null as string | null,
      rejectedAt: null as Date | null,
      resubmitted: false,
      approvedAt: null as Date | null,
    },
    {
      id: "biz_seed_005",
      ownerId: "auth_user_seed_006",
      name: "Seed Business 05",
      description: "General service business seeded for integration testing.",
      type: businessTypes[4],
      address: {
        street: "105 Seed Street",
        city: "Biratnagar",
        country: "Nepal",
      },
      phone: "+977-9800000005",
      email: "biz05@seed.local",
      status: BusinessStatus.PENDING,
      isVerified: false,
      rejectionReasons: [] as RejectionReasonValue[],
      adminNotes: null as string | null,
      rejectedAt: null as Date | null,
      resubmitted: false,
      approvedAt: null as Date | null,
    },
    {
      id: "biz_seed_006",
      ownerId: "auth_user_seed_007",
      name: "Seed Business 06",
      description: "Pending review business seeded for moderation tests.",
      type: businessTypes[0],
      address: {
        street: "106 Seed Street",
        city: "Butwal",
        country: "Nepal",
      },
      phone: "+977-9800000006",
      email: "biz06@seed.local",
      status: BusinessStatus.PENDING,
      isVerified: false,
      rejectionReasons: [] as RejectionReasonValue[],
      adminNotes: null as string | null,
      rejectedAt: null as Date | null,
      resubmitted: false,
      approvedAt: null as Date | null,
    },
    {
      id: "biz_seed_007",
      ownerId: "auth_user_seed_008",
      name: "Seed Business 07",
      description: "Approved and active business for booking flow tests.",
      type: businessTypes[1],
      address: {
        street: "107 Seed Street",
        city: "Hetauda",
        country: "Nepal",
      },
      phone: "+977-9800000007",
      email: "biz07@seed.local",
      status: BusinessStatus.ACTIVE,
      isVerified: true,
      rejectionReasons: [] as RejectionReasonValue[],
      adminNotes: "Approved after successful profile and document review.",
      rejectedAt: null as Date | null,
      resubmitted: false,
      approvedAt: new Date(),
    },
    {
      id: "biz_seed_008",
      ownerId: "auth_user_seed_009",
      name: "Seed Business 08",
      description:
        "Second active business for discovery and availability tests.",
      type: businessTypes[2],
      address: {
        street: "108 Seed Street",
        city: "Dharan",
        country: "Nepal",
      },
      phone: "+977-9800000008",
      email: "biz08@seed.local",
      status: BusinessStatus.ACTIVE,
      isVerified: true,
      rejectionReasons: [] as RejectionReasonValue[],
      adminNotes: "Approved for production-like test scenarios.",
      rejectedAt: null as Date | null,
      resubmitted: false,
      approvedAt: new Date(),
    },
    {
      id: "biz_seed_009",
      ownerId: "auth_user_seed_010",
      name: "Seed Business 09",
      description: "Rejected business to test admin moderation edge cases.",
      type: businessTypes[3],
      address: {
        street: "109 Seed Street",
        city: "Janakpur",
        country: "Nepal",
      },
      phone: "+977-9800000009",
      email: "biz09@seed.local",
      status: BusinessStatus.REJECTED,
      isVerified: false,
      rejectionReasons: [rejectedOneReason],
      adminNotes: reasonNotes[rejectedOneReason],
      rejectedAt: new Date(),
      resubmitted: false,
      approvedAt: null as Date | null,
    },
    {
      id: "biz_seed_010",
      ownerId: "auth_user_seed_001",
      name: "Seed Business 10",
      description: "Second rejected business to validate rejection workflows.",
      type: businessTypes[4],
      address: {
        street: "110 Seed Street",
        city: "Nepalgunj",
        country: "Nepal",
      },
      phone: "+977-9800000010",
      email: "biz10@seed.local",
      status: BusinessStatus.REJECTED,
      isVerified: false,
      rejectionReasons: [rejectedTwoReason],
      adminNotes: reasonNotes[rejectedTwoReason],
      rejectedAt: new Date(),
      resubmitted: false,
      approvedAt: null as Date | null,
    },
  ];

  await prisma.business.deleteMany({
    where: {
      id: { in: businesses.map((business) => business.id) },
    },
  });

  await prisma.business.createMany({
    data: businesses,
  });

  console.log(
    "Business seed complete: 10 rows (6 PENDING, 2 ACTIVE, 2 REJECTED).",
  );
}

main()
  .catch((e) => {
    console.error("Business seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
