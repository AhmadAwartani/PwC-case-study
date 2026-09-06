import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true, isActive: true },
  });
//   console.table(users);
console.log(JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect()); 