import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Prisma 7 requires a driver adapter -- schema.prisma can no longer carry a
// `url` field directly. libsql is used here (rather than better-sqlite3)
// specifically because it ships prebuilt native binaries per platform
// (including Windows) as regular npm optionalDependencies, so `npm install`
// never needs a C++ compiler toolchain (no node-gyp / Visual Studio / Python
// required) -- unlike better-sqlite3, which falls back to compiling from
// source when no prebuilt binary matches.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
