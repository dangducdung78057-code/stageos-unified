import { boolean, date, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false), image: text("image"),
  membershipTier: text("membershipTier").notNull().default("free"),
  createdAt: timestamp("createdAt").notNull().defaultNow(), updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
export const session = pgTable("session", {
  id: text("id").primaryKey(), expiresAt: timestamp("expiresAt").notNull(), token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(), updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"), userAgent: text("userAgent"), userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
})
export const account = pgTable("account", {
  id: text("id").primaryKey(), accountId: text("accountId").notNull(), providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }), accessToken: text("accessToken"),
  refreshToken: text("refreshToken"), idToken: text("idToken"), accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"), scope: text("scope"), password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(), updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
export const verification = pgTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(), createdAt: timestamp("createdAt").defaultNow(), updatedAt: timestamp("updatedAt").defaultNow(),
})
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(), userId: text("userId").notNull(), title: text("title").notNull(),
  status: text("status").notNull().default("draft"), performanceDate: date("performanceDate"), performerCount: integer("performerCount"),
  programType: text("programType"), theme: text("theme"), createdAt: timestamp("createdAt").notNull().defaultNow(), updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
export const stageInputs = pgTable("stageInputs", {
  id: uuid("id").primaryKey().defaultRandom(), userId: text("userId").notNull(), projectId: uuid("projectId").notNull(),
  data: jsonb("data").notNull().default({}), createdAt: timestamp("createdAt").notNull().defaultNow(), updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
export const planSnapshots = pgTable("planSnapshots", {
  id: uuid("id").primaryKey().defaultRandom(), userId: text("userId").notNull(), projectId: uuid("projectId").notNull(),
  version: integer("version").notNull().default(1), mode: text("mode").notNull().default("local_rules"),
  costumePlan: jsonb("costumePlan").notNull().default({}), risks: jsonb("risks").notNull().default([]),
  reverseSchedule: jsonb("reverseSchedule").notNull().default([]), platformSearch: jsonb("platformSearch").notNull().default([]),
  providerStatus: text("providerStatus").notNull().default("local_rules_ready"), createdAt: timestamp("createdAt").notNull().defaultNow(),
})
export const confirmationRecords = pgTable("confirmationRecords", {
  id: uuid("id").primaryKey().defaultRandom(), userId: text("userId").notNull(), projectId: uuid("projectId").notNull(),
  status: text("status").notNull().default("draft"), note: text("note"),
  createdAt: timestamp("createdAt").notNull().defaultNow(), updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})
export const formationScenes = pgTable(
  "formationScenes",
  {
    id: uuid("id").primaryKey().defaultRandom(), userId: text("userId").notNull(), projectId: uuid("projectId"),
    name: text("name").notNull().default("default"), data: jsonb("data").notNull().default({}),
    currentVersion: integer("currentVersion").notNull().default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(), updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("formationScenes_user_project_name_uq").on(t.userId, t.projectId, t.name)],
)
export const formationSceneVersions = pgTable(
  "formationSceneVersions",
  {
    id: uuid("id").primaryKey().defaultRandom(), sceneId: uuid("sceneId").notNull(), userId: text("userId").notNull(),
    version: integer("version").notNull(), data: jsonb("data").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("formationSceneVersions_scene_version_uq").on(t.sceneId, t.version)],
)
