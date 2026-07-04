import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { rolesTable } from "./roles";

export const roleUserTable = pgTable("role_user", {
  user_id: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role_id: integer("role_id").notNull().references(() => rolesTable.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.user_id, table.role_id] }),
]);
