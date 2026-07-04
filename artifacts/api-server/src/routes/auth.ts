import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    res.status(400).json({ error: "ناوی بەکارهێنەر و ووشەی نهێنی پێویستە" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, String(username)))
    .limit(1);

  const isHashed = !!user?.password?.startsWith("$2");
  const passwordMatches = user
    ? isHashed
      ? await bcrypt.compare(String(password), user.password)
      : user.password === String(password)
    : false;

  if (!user || !passwordMatches) {
    res.status(401).json({ error: "ناوی بەکارهێنەر یان ووشەی نهێنی هەڵەیە" });
    return;
  }

  // Transparently upgrade legacy plaintext passwords to bcrypt hashes on successful login
  if (!isHashed) {
    const newHash = await bcrypt.hash(String(password), 10);
    await db.update(usersTable).set({ password: newHash }).where(eq(usersTable.id, user.id));
  }

  // Rotate session ID to prevent session fixation attacks
  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: "هەڵەی سێشن" });
      return;
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.full_name = user.full_name;
    req.session.email = user.email;

    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({ error: "هەڵەی تۆمارکردنی سێشن" });
        return;
      }

      res.json({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
      });
    });
  });
});

// POST /api/auth/logout
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get("/auth/me", (req, res) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "داخڵ نەبووی" });
    return;
  }
  res.json({
    id: req.session.userId,
    username: req.session.username,
    full_name: req.session.full_name,
    email: req.session.email,
  });
});

export default router;
