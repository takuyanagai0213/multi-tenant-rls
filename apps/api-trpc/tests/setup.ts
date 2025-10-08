import { beforeAll, afterAll } from "vitest";
import { prisma } from "@repo/kysely-prisma-database";

// Setup test database before all tests
beforeAll(async () => {
  // Clean up test data
  await prisma.project.deleteMany({});
  await prisma.organization.deleteMany({});
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
