import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, ilike, and, inArray } from "drizzle-orm";
import { db, usersTable, rolesTable, roleUserTable, departmentsTable } from "@workspace/db";
import {
  CreateUserBody,
  UpdateUserBody,
  GetUserParams,
  UpdateUserParams,
  DeleteUserParams,
  GetUserRolesParams,
  AssignRoleParams,
  AssignRoleBody,
  RemoveRoleParams,
  ListUsersQueryParams,
} from "@workspace/api-zod";

const router = Router();

async function getUserWithRoles(id: number) {
  const [user] = await db
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
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user) return null;

  const roles = await db
    .select({ id: rolesTable.id, name: rolesTable.name })
    .from(roleUserTable)
    .innerJoin(rolesTable, eq(roleUserTable.role_id, rolesTable.id))
    .where(eq(roleUserTable.user_id, id));

  return { ...user, roles };
}

// GET /users
router.get("/users", async (req, res) => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  const conditions = [];
  if (params.department_id) conditions.push(eq(usersTable.department_id, params.department_id));
  if (params.search) conditions.push(ilike(usersTable.full_name, `%${params.search}%`));

  const baseQuery = db
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
    .leftJoin(departmentsTable, eq(usersTable.department_id, departmentsTable.id));

  const users = conditions.length > 0
    ? await baseQuery.where(and(...conditions)).orderBy(usersTable.full_name)
    : await baseQuery.orderBy(usersTable.full_name);

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

  let result = users.map((u) => ({ ...u, roles: roleMap[u.id] ?? [] }));
  if (params.role_id) {
    result = result.filter((u) => u.roles.some((r: { id: number }) => r.id === params.role_id));
  }

  return res.json(result);
});

// POST /users
router.post("/users", async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { role_ids, ...userData } = parsed.data;

  // Validate role_ids exist before writing
  if (role_ids && role_ids.length > 0) {
    const foundRoles = await db.select({ id: rolesTable.id }).from(rolesTable).where(inArray(rolesTable.id, role_ids));
    if (foundRoles.length !== role_ids.length) {
      return res.status(400).json({ error: "One or more role IDs are invalid" });
    }
  }

  // Check uniqueness
  const [existingUsername] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, userData.username)).limit(1);
  if (existingUsername) return res.status(409).json({ error: "Username already exists" });

  const [existingEmail] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, userData.email)).limit(1);
  if (existingEmail) return res.status(409).json({ error: "Email already exists" });

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Transactional insert
  const result = await db.transaction(async (tx) => {
    const [user] = await tx.insert(usersTable).values({ ...userData, password: hashedPassword }).returning();
    if (role_ids && role_ids.length > 0) {
      await tx.insert(roleUserTable).values(role_ids.map((role_id) => ({ user_id: user.id, role_id }))).onConflictDoNothing();
    }
    return user;
  });

  const userWithRoles = await getUserWithRoles(result.id);
  return res.status(201).json(userWithRoles);
});

// GET /users/:id
router.get("/users/:id", async (req, res) => {
  const parsed = GetUserParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid user ID" });
  const user = await getUserWithRoles(parsed.data.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(user);
});

// PATCH /users/:id
router.patch("/users/:id", async (req, res) => {
  const paramParsed = UpdateUserParams.safeParse(req.params);
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid user ID" });
  const { id } = paramParsed.data;

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { role_ids, ...userData } = parsed.data;

  // Validate role_ids exist before writes
  if (role_ids !== undefined && role_ids.length > 0) {
    const foundRoles = await db.select({ id: rolesTable.id }).from(rolesTable).where(inArray(rolesTable.id, role_ids));
    if (foundRoles.length !== role_ids.length) {
      return res.status(400).json({ error: "One or more role IDs are invalid" });
    }
  }

  const [exists] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!exists) return res.status(404).json({ error: "User not found" });

  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }

  // Transactional update
  await db.transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.update(usersTable).set({ ...userData, updated_at: new Date() }).where(eq(usersTable.id, id));
    }
    if (role_ids !== undefined) {
      await tx.delete(roleUserTable).where(eq(roleUserTable.user_id, id));
      if (role_ids.length > 0) {
        await tx.insert(roleUserTable).values(role_ids.map((role_id) => ({ user_id: id, role_id }))).onConflictDoNothing();
      }
    }
  });

  const result = await getUserWithRoles(id);
  return res.json(result);
});

// DELETE /users/:id
router.delete("/users/:id", async (req, res) => {
  const parsed = DeleteUserParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid user ID" });

  if (req.session?.userId === parsed.data.id) {
    return res.status(400).json({ error: "ناتوانیت هەژماری خۆت بسڕیتەوە" });
  }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, parsed.data.id)).returning();
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.status(204).send();
});

// GET /users/:id/roles
router.get("/users/:id/roles", async (req, res) => {
  const parsed = GetUserRolesParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid user ID" });

  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, parsed.data.id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const roles = await db
    .select({ id: rolesTable.id, name: rolesTable.name })
    .from(roleUserTable)
    .innerJoin(rolesTable, eq(roleUserTable.role_id, rolesTable.id))
    .where(eq(roleUserTable.user_id, parsed.data.id));

  return res.json(roles);
});

// POST /users/:id/roles
router.post("/users/:id/roles", async (req, res) => {
  const paramParsed = AssignRoleParams.safeParse(req.params);
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid user ID" });
  const { id } = paramParsed.data;

  const parsed = AssignRoleBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [role] = await db.select({ id: rolesTable.id }).from(rolesTable).where(eq(rolesTable.id, parsed.data.role_id)).limit(1);
  if (!role) return res.status(404).json({ error: "Role not found" });

  await db.insert(roleUserTable).values({ user_id: id, role_id: parsed.data.role_id }).onConflictDoNothing();

  const result = await getUserWithRoles(id);
  return res.json(result);
});

// DELETE /users/:id/roles/:roleId
router.delete("/users/:id/roles/:roleId", async (req, res) => {
  const parsed = RemoveRoleParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid ID" });
  const { id, roleId } = parsed.data;

  await db.delete(roleUserTable).where(and(eq(roleUserTable.user_id, id), eq(roleUserTable.role_id, roleId)));

  const result = await getUserWithRoles(id);
  if (!result) return res.status(404).json({ error: "User not found" });
  return res.json(result);
});

export default router;
