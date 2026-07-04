import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, rolesTable } from "@workspace/db";
import { CreateRoleBody, DeleteRoleParams } from "@workspace/api-zod";

const router = Router();

// GET /roles
router.get("/roles", async (_req, res) => {
  const roles = await db.select().from(rolesTable).orderBy(rolesTable.name);
  res.json(roles);
});

// POST /roles
router.post("/roles", async (req, res) => {
  const parsed = CreateRoleBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const [existing] = await db.select({ id: rolesTable.id }).from(rolesTable).where(eq(rolesTable.name, parsed.data.name)).limit(1);
  if (existing) return res.status(409).json({ error: "Role name already exists" });

  const [role] = await db.insert(rolesTable).values({ name: parsed.data.name }).returning();
  return res.status(201).json(role);
});

// DELETE /roles/:id
router.delete("/roles/:id", async (req, res) => {
  const parsed = DeleteRoleParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid role ID" });

  const [role] = await db.delete(rolesTable).where(eq(rolesTable.id, parsed.data.id)).returning();
  if (!role) return res.status(404).json({ error: "Role not found" });
  return res.status(204).send();
});

export default router;
