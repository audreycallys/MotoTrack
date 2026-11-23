import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "./config/db";
import { usersTable, rolesTable } from "./config/schema";

async function seedAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error("Admin credentials are missing in .env");
  }

  if (password.length < 8) {
    throw new Error("Admin password must be at least 8 characters");
  }

  const adminRole = await db.query.rolesTable.findFirst({
    where: eq(rolesTable.title, "admin"),
  });

  if (!adminRole) {
    throw new Error("Admin role not found. Run seedRoles first.");
  }

  const existingUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });

  if (existingUser) {
    console.log("Account with this email already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.insert(usersTable).values({
    roleId: adminRole.id,
    name,
    email,
    password: hashedPassword,
  });

  console.log("Admin account created successfully.");
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed admin failed:", error);
    process.exit(1);
  });
