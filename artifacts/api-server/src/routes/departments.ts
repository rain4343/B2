import { Router } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, departmentsTable, usersTable, rolesTable, roleUserTable } from "@workspace/db";
import {
  CreateDepartmentBody,
  UpdateDepartmentBody,
  GetDepartmentParams,
  UpdateDepartmentParams,
  DeleteDepartmentParams,
  GetDepartmentStaffParams,
} from "@workspace/api-zod";

const router = Router();

// GET /departments
router.get("/departments", async (_req, res) => {
  const departments = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  res.json(departments);
});

// POST /departments
router.post("/departments", async (req, res) => {
  const parsed = CreateDepartmentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const [existing] = await db.select({ id: departmentsTable.id }).from(departmentsTable).where(eq(departmentsTable.name, parsed.data.name)).limit(1);
  if (existing) return res.status(409).json({ error: "Department name already exists" });

  const [dept] = await db.insert(departmentsTable).values({ name: parsed.data.name }).returning();
  return res.status(201).json(dept);
});

// GET /departments/:id
router.get("/departments/:id", async (req, res) => {
  const parsed = GetDepartmentParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid department ID" });

  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, parsed.data.id)).limit(1);
  if (!dept) return res.status(404).json({ error: "Department not found" });
  return res.json(dept);
});

// PATCH /departments/:id
router.patch("/departments/:id", async (req, res) => {
  const paramParsed = UpdateDepartmentParams.safeParse(req.params);
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid department ID" });

  const parsed = UpdateDepartmentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const [dept] = await db
    .update(departmentsTable)
    .set({ ...parsed.data, updated_at: new Date() })
    .where(eq(departmentsTable.id, paramParsed.data.id))
    .returning();
  if (!dept) return res.status(404).json({ error: "Department not found" });
  return res.json(dept);
});

// DELETE /departments/:id
router.delete("/departments/:id", async (req, res) => {
  const parsed = DeleteDepartmentParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid department ID" });

  const [dept] = await db.delete(departmentsTable).where(eq(departmentsTable.id, parsed.data.id)).returning();
  if (!dept) return res.status(404).json({ error: "Department not found" });
  return res.status(204).send();
});

// GET /departments/:id/staff
router.get("/departments/:id/staff", async (req, res) => {
  const parsed = GetDepartmentStaffParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid department ID" });

  const [dept] = await db.select({ id: departmentsTable.id }).from(departmentsTable).where(eq(departmentsTable.id, parsed.data.id)).limit(1);
  if (!dept) return res.status(404).json({ error: "Department not found" });

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
    .where(eq(usersTable.department_id, parsed.data.id))
    .orderBy(usersTable.full_name);

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
