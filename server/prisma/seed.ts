/**
 * Prisma seed script.
 *
 * Seeds:
 *  - 1 admin, 2 moderators, 3 regular users (all with hashed passwords)
 *  - 3 categories
 *  - A realistic spread of tickets across every status x priority combination,
 *    with a mix of assigned/unassigned tickets
 *  - A couple of comments per ticket
 *
 * Run with: npm run prisma:seed  (or `npx prisma db seed`)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding database...");

  // ---- Users ---------------------------------------------------------
  const admin1 = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { 
      name: "Amina Admin",
      email: "admin@example.com",
      passwordHash: await hash("Admin123!"), 
      role: "admin",
      isActive: true,
    },
  });

    const admin2 = await prisma.user.upsert({
    where: { email: "gokul@example.com" },
    update: {},
    create: {
      name: "Gokul Kumar",
      email: "gokul@example.com",
      passwordHash: await hash("Gokul123!"),
      role: "admin",
      isActive: true,
    },
  });

  const mod1 = await prisma.user.upsert({
    where: { email: "zaid@example.com" },
    update: {},
    create: {
      name: "Zaid Taha",
      email: "zaid@example.com",
      passwordHash: await hash("Zaid123!"),
      role: "moderator",
      isActive: true,
    },
  });

  const mod2 = await prisma.user.upsert({
    where: { email: "priya@example.com" },
    update: {},
    create: {
      name: "Priya Agent",
      email: "priya@example.com",
      passwordHash: await hash("Moderator123!"),
      role: "moderator",
      isActive: true,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "jordan@example.com" },
    update: {},
    create: {
      name: "Jordan Employee",
      email: "jordan@example.com",
      passwordHash: await hash("User123!"),
      role: "user",
      isActive: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "ahmad@example.com" },
    update: {},
    create: {
      name: "Ahmad Awartani",
      email: "ahmad@example.com",
      passwordHash: await hash("Ahmad123!"),
      role: "user",
      isActive: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "omar@example.com" },
    update: {},
    create: {
      name: "Omar Rasheed",
      email: "omar@example.com",
      passwordHash: await hash("User123!"),
      role: "user",
      isActive: true,
    },
  });

  const requesters = [user1, user2, user3];
  const moderators = [mod1, mod2];

  // ---- Categories ------------------------------------------------------
  const categoryNames = ["IT – Hardware", "IT – Access & VPN", "HR – Payroll"];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories.push(category);
  }

  // ---- Tickets + comments -----------------------------------------------
  // Only seed tickets if none exist yet, so re-running the seed is idempotent
  // and doesn't keep duplicating data.
  const existingTicketCount = await prisma.ticket.count();
  if (existingTicketCount === 0) {
    const subjects = [
      "VPN won't connect from home",
      "Laptop battery not charging",
      "Payroll deduction looks incorrect",
      "Need access to shared drive",
      "Monitor flickering intermittently",
      "Password reset not working",
      "Expense reimbursement delayed",
      "New hire laptop setup",
      "Printer offline on 3rd floor",
      "Email sync issue on phone",
      "Benefits enrollment question",
      "Software license request",
      "Keyboard keys unresponsive",
      "Slack access for new project",
      "Overtime hours not reflected",
      "Docking station not detected",
    ];

    let ticketIndex = 0;
    for (const subject of subjects) {
      const status = STATUSES[ticketIndex % STATUSES.length];
      const priority = PRIORITIES[ticketIndex % PRIORITIES.length];
      const category = categories[ticketIndex % categories.length];
      const requester = requesters[ticketIndex % requesters.length];

      // Roughly half the tickets are unassigned; the rest are split between
      // the two moderators. Resolved/closed tickets are always assigned,
      // since something can't be resolved by nobody.
      let assigneeId: string | null = null;
      if (status === "resolved" || status === "closed") {
        assigneeId = moderators[ticketIndex % moderators.length].id;
      } else if (ticketIndex % 2 === 0) {
        assigneeId = moderators[ticketIndex % moderators.length].id;
      }

      const ticket = await prisma.ticket.create({
        data: {
          subject,
          description: `Details for "${subject}". Reported via the helpdesk portal.`,
          status,
          priority,
          categoryId: category.id,
          requesterId: requester.id,
          assigneeId,
        },
      });

      // First comment from the requester, and (if assigned) a reply from the assignee.
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId: requester.id,
          body: "Could someone take a look at this when possible?",
        },
      });

      if (assigneeId) {
        await prisma.ticketComment.create({
          data: {
            ticketId: ticket.id,
            authorId: assigneeId,
            body: "Thanks for the report -- looking into this now.",
          },
        });
      }

      ticketIndex++;
    }
    // Extra tickets to explicitly cover status/priority combinations the
    // main loop above skips (it locks status and priority together by
    // sharing the same index).
    const extraTickets: {
      subject: string;
      status: (typeof STATUSES)[number];
      priority: (typeof PRIORITIES)[number];
    }[] = [
      { subject: "Second monitor not detected", status: "open", priority: "medium" },
      { subject: "Onboarding checklist access", status: "in_progress", priority: "low" },
      { subject: "VPN client crashes on launch", status: "open", priority: "high" },
      { subject: "Payslip PDF won't download", status: "in_progress", priority: "urgent" },
    ];

    for (const extra of extraTickets) {
      const category = categories[ticketIndex % categories.length];
      const requester = requesters[ticketIndex % requesters.length];
      const assigneeId =
        ticketIndex % 2 === 0 ? moderators[ticketIndex % moderators.length].id : null;

      const ticket = await prisma.ticket.create({
        data: {
          subject: extra.subject,
          description: `Details for "${extra.subject}". Reported via the helpdesk portal.`,
          status: extra.status,
          priority: extra.priority,
          categoryId: category.id,
          requesterId: requester.id, 
          assigneeId,
        },
      });

      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId: requester.id,
          body: "Could someone take a look at this when possible?",
        },
      });

      ticketIndex++;
    }
  } else {
    console.log(
      `Skipping ticket/comment seed -- ${existingTicketCount} tickets already exist.`
    );
  }

console.log("Seed complete.");
console.log(""); 
console.log("Dev credentials:");
console.log(`  ${admin1.email}   / Admin123!`);
console.log(`  ${admin2.email}   / Gokul123!    (admin)`);
console.log(`  ${mod1.email}     / Zaid123!     (moderator)`);
console.log(`  ${mod2.email}     / Moderator123! (moderator)`);
console.log(`  ${user1.email}    / User123!`);
console.log(`  ${user2.email}    / Ahmad123!`);
console.log(`  ${user3.email}    / User123!`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  }) 
  .finally(async () => {
    await prisma.$disconnect();  
  });
 