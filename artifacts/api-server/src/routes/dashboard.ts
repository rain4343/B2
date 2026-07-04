import { Router } from "express";
import { sql, eq, desc, inArray } from "drizzle-orm";
import { db, usersTable, departmentsTable, rolesTable, roleUserTable } from "@workspace/db";

const router = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", async (_req, res) => {
  const [[staffCount], [deptCount], [roleCount], [superAdminCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(departmentsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(rolesTable),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(roleUserTable)
      .innerJoin(rolesTable, eq(roleUserTable.role_id, rolesTable.id))
      .where(eq(rolesTable.name, "Super Admin")),
  ]);

  return res.json({
    total_staff: staffCount?.count ?? 0,
    total_departments: deptCount?.count ?? 0,
    total_roles: roleCount?.count ?? 0,
    super_admin_count: superAdminCount?.count ?? 0,
  });
});

// GET /dashboard/department-breakdown
router.get("/dashboard/department-breakdown", async (_req, res) => {
  const rows = await db
    .select({
      department_id: departmentsTable.id,
      department_name: departmentsTable.name,
      staff_count: sql<number>`count(${usersTable.id})::int`,
    })
    .from(departmentsTable)
    .leftJoin(usersTable, eq(usersTable.department_id, departmentsTable.id))
    .groupBy(departmentsTable.id, departmentsTable.name)
    .orderBy(desc(sql`count(${usersTable.id})`));

  return res.json(rows);
});

// GET /dashboard/role-breakdown
router.get("/dashboard/role-breakdown", async (_req, res) => {
  const rows = await db
    .select({
      role_id: rolesTable.id,
      role_name: rolesTable.name,
      staff_count: sql<number>`count(${roleUserTable.user_id})::int`,
    })
    .from(rolesTable)
    .leftJoin(roleUserTable, eq(roleUserTable.role_id, rolesTable.id))
    .groupBy(rolesTable.id, rolesTable.name)
    .orderBy(desc(sql`count(${roleUserTable.user_id})`));

  return res.json(rows);
});

// GET /dashboard/recent-staff
router.get("/dashboard/recent-staff", async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      full_name: usersTable.full_name,
      username: usersTable.username,
      email: usersTable.email,
      department_id: usersTable.department_id,
      department_name: departmentsTable.name,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at,
    })
    .from(usersTable)
    .leftJoin(departmentsTable, eq(usersTable.department_id, departmentsTable.id))
    .orderBy(desc(usersTable.created_at))
    .limit(10);

  const userIds = users.map((u) => u.id);
  let roleMap: Record<number, { id: number; name: string }[]> = {};

  if (userIds.length > 0) {
    const roleRows = await db
      .select({ user_id: roleUserTable.user_id, role_id: rolesTable.id, role_name: rolesTable.name })
      .from(roleUserTable)
      .innerJoin(rolesTable, eq(roleUserTable.role_id, rolesTable.id))
      .where(inArray(roleUserTable.user_id, userIds));

    for (const r of roleRows) {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push({ id: r.role_id, name: r.role_name });
    }
  }

  return res.json(users.map((u) => ({ ...u, roles: roleMap[u.id] ?? [] })));
});

export default router;
