import "dotenv/config";
import { db } from "./config/db";
import { rolesTable } from "./config/schema";

async function seedRoles() {
  try {
    await db
      .insert(rolesTable)
      .values([
        {
          title: "customer",
          description: "Motorcycle service customer",
        },
        {
          title: "admin",
          description: "Motorcycle workshop administrator",
        },
      ])
      .onConflictDoNothing({
        target: rolesTable.title,
      });

    console.log("Roles seeded successfully!");
  } catch (error) {
    console.error("Failed to seed roles:", error);
    process.exitCode = 1;
  }
}

seedRoles();
