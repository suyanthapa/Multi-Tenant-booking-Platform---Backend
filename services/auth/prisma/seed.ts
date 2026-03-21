import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const plainPassword = process.env.SEED_PASSWORD || "Password@123";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const users = [
    {
      id: "auth_user_seed_001",
      email: "admin1@seed.local",
      username: "admin1",
      firstName: "System",
      lastName: "Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      id: "auth_user_seed_002",
      email: "vendor1@seed.local",
      username: "vendor1",
      firstName: "Vendor",
      lastName: "One",
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      id: "auth_user_seed_003",
      email: "vendor2@seed.local",
      username: "vendor2",
      firstName: "Vendor",
      lastName: "Two",
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      id: "auth_user_seed_004",
      email: "customer1@seed.local",
      username: "customer1",
      firstName: "Customer",
      lastName: "One",
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      id: "auth_user_seed_005",
      email: "customer2@seed.local",
      username: "customer2",
      firstName: "Customer",
      lastName: "Two",
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      id: "auth_user_seed_006",
      email: "customer3@seed.local",
      username: "customer3",
      firstName: "Customer",
      lastName: "Three",
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      id: "auth_user_seed_007",
      email: "customer4@seed.local",
      username: "customer4",
      firstName: "Customer",
      lastName: "Four",
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      id: "auth_user_seed_008",
      email: "customer5@seed.local",
      username: "customer5",
      firstName: "Customer",
      lastName: "Five",
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      id: "auth_user_seed_009",
      email: "pending1@seed.local",
      username: "pending1",
      firstName: "Pending",
      lastName: "UserOne",
      role: UserRole.CUSTOMER,
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: false,
    },
    {
      id: "auth_user_seed_010",
      email: "pending2@seed.local",
      username: "pending2",
      firstName: "Pending",
      lastName: "UserTwo",
      role: UserRole.VENDOR,
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: false,
    },
  ];

  // Recreate deterministic seed users so IDs remain human-readable across runs.
  await prisma.user.deleteMany({
    where: {
      email: { in: users.map((user) => user.email) },
    },
  });

  await prisma.user.createMany({
    data: users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      passwordHash,
    })),
  });

  console.log(
    "Seed complete: 10 users created/updated (8 verified, 2 unverified).",
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
