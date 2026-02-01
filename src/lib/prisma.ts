import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const normalizeDatabaseUrl = (value?: string) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (trimmed.startsWith("psql ")) {
    return trimmed.replace(/^psql\s+['"]?/, "").replace(/['"]$/, "");
  }
  return trimmed;
};

const getClient = () => {
  if (!globalForPrisma.prisma) {
    const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
    const pool =
      globalForPrisma.pool ??
      new Pool({
        connectionString,
      });
    globalForPrisma.pool = pool;
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({
      log: ["error", "warn"],
      adapter,
    });
  }

  return globalForPrisma.prisma;
};

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
