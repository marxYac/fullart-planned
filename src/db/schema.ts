import { pgTable, text, timestamp, uuid, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("user_role", ["super_user", "admin", "operator", "client"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  role: roleEnum("role").default("client").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments, { relationName: "user" }),
  appointmentsAsOperator: many(appointments, { relationName: "operator" }),
}));

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minuti
  price: integer("price").notNull(), // in centesimi
  category: text("category"), // es. 'hair', 'beard', 'wellness'
  icon: text("icon"), // lucide-react icon name
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments),
}));


export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  serviceId: uuid("service_id").references(() => services.id),
  operatorId: uuid("operator_id").references(() => users.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: text("status").default("pending").notNull(), // pending, confirmed, cancelled, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
    relationName: "user"
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  operator: one(users, {
    fields: [appointments.operatorId],
    references: [users.id],
    relationName: "operator"
  }),
}));

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in centesimi
  image: text("image"),
  category: text("category"), // es., 'hair', 'beard', 'wellness'
  inStock: boolean("in_stock").default(true).notNull(),
});


