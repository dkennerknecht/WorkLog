import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const masterDataPath = path.join(process.cwd(), "src", "config", "master-data.json");
const masterData = JSON.parse(fs.readFileSync(masterDataPath, "utf8"));

const tasks = masterData.tasks;
const people = masterData.people;
const locations = masterData.locations;

async function upsertByName(model, values) {
  await Promise.all(
    values.map((name) =>
      model.upsert({
        where: { name },
        update: { isActive: true, deactivatedAt: null },
        create: { name, isActive: true }
      })
    )
  );
}

async function main() {
  await upsertByName(prisma.task, tasks);
  await upsertByName(prisma.person, people);
  await upsertByName(prisma.location, locations);

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash, isActive: true },
    create: { username, passwordHash, isActive: true }
  });

  await prisma.uiSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      kioskPalette: "blue",
      kioskMode: "light",
      adminPalette: "blue",
      adminMode: "light"
    }
  });

  console.log(`Seed done. Admin user: ${username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
