import { db, departmentsTable, rolesTable, usersTable, roleUserTable } from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  const departments = await db
    .insert(departmentsTable)
    .values([
      { name: "Human Resources" },
      { name: "Finance" },
      { name: "Engineering" },
      { name: "Operations" },
      { name: "Marketing" },
    ])
    .onConflictDoNothing()
    .returning();

  const existingDepartments = departments.length > 0 ? departments : await db.select().from(departmentsTable);
  const deptByName = new Map(existingDepartments.map((d) => [d.name, d.id]));

  const roles = await db
    .insert(rolesTable)
    .values([{ name: "Super Admin" }, { name: "فەرمانبەر" }])
    .onConflictDoNothing()
    .returning();

  const existingRoles = roles.length > 0 ? roles : await db.select().from(rolesTable);
  const roleByName = new Map(existingRoles.map((r) => [r.name, r.id]));

  const staffSeed = [
    { full_name: "Aram Hassan", username: "aram.hassan", email: "aram.hassan@example.com", department: "Human Resources", role: "Super Admin" },
    { full_name: "Sara Karim", username: "sara.karim", email: "sara.karim@example.com", department: "Finance", role: "فەرمانبەر" },
    { full_name: "Diyar Ahmed", username: "diyar.ahmed", email: "diyar.ahmed@example.com", department: "Engineering", role: "فەرمانبەر" },
    { full_name: "Lana Rasul", username: "lana.rasul", email: "lana.rasul@example.com", department: "Engineering", role: "فەرمانبەر" },
    { full_name: "Hoshyar Salih", username: "hoshyar.salih", email: "hoshyar.salih@example.com", department: "Operations", role: "فەرمانبەر" },
    { full_name: "Nazdar Omar", username: "nazdar.omar", email: "nazdar.omar@example.com", department: "Marketing", role: "فەرمانبەر" },
    { full_name: "Karwan Jamal", username: "karwan.jamal", email: "karwan.jamal@example.com", department: "Finance", role: "Super Admin" },
    { full_name: "Shene Faraj", username: "shene.faraj", email: "shene.faraj@example.com", department: "Human Resources", role: "فەرمانبەر" },
  ];

  for (const staff of staffSeed) {
    const inserted = await db
      .insert(usersTable)
      .values({
        full_name: staff.full_name,
        username: staff.username,
        email: staff.email,
        password: "changeme123",
        department_id: deptByName.get(staff.department) ?? null,
      })
      .onConflictDoNothing()
      .returning();

    const user = inserted[0] ?? (await db.select().from(usersTable).where((await import("drizzle-orm")).eq(usersTable.username, staff.username)))[0];
    const roleId = roleByName.get(staff.role);
    if (user && roleId) {
      await db.insert(roleUserTable).values({ user_id: user.id, role_id: roleId }).onConflictDoNothing();
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
