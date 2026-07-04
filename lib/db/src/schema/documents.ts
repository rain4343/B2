import { pgTable, serial, varchar, date, integer, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  document_number: varchar("document_number", { length: 100 }).notNull().unique(),
  document_date: date("document_date").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  creator_id: integer("creator_id").notNull().references(() => usersTable.id),
  current_status: varchar("current_status", { length: 50 }).notNull().default("نوێ"),
  file_path: varchar("file_path", { length: 500 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;

export const documentLogsTable = pgTable("document_logs", {
  id: serial("id").primaryKey(),
  document_id: integer("document_id").notNull().references(() => documentsTable.id, { onDelete: "cascade" }),
  user_id: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  notes: text("notes"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export const insertDocumentLogSchema = createInsertSchema(documentLogsTable).omit({ id: true, timestamp: true });
export type InsertDocumentLog = z.infer<typeof insertDocumentLogSchema>;
export type DocumentLog = typeof documentLogsTable.$inferSelect;
