import {
  pgTable,
  pgEnum,
  integer,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
  check,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ========================================
// ENUMS
// ========================================
// Status persetujuan estimasi
export const estimateStatusEnum = pgEnum("estimate_status", [
  "draft",
  "pending",
  "approved",
  "rejected",
]);

// Status pengerjaan servis
export const serviceStatusEnum = pgEnum("service_status", [
  "submitted",
  "received",
  "inspected",
  "awaiting_approval",
  "in_progress",
  "final_inspection",
  "completed",
  "handed_over",
  "cancelled",
]);

// Jenis item estimasi
export const itemTypeEnum = pgEnum("item_type", ["service", "part"]);

// Metode pembayaran
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "xendit"]);

// Status pembayaran
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "expired",
  "cancelled",
]);

// ========================================
// 1. ROLES
// ========================================
export const rolesTable = pgTable("roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// ========================================
// 2. USERS
// ========================================
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  roleId: integer("role_id")
    .notNull()
    .references(() => rolesTable.id),
  name: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 100 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 20 }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// ========================================
// 3. VEHICLES
// ========================================
export const vehiclesTable = pgTable("vehicles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  brand: varchar({ length: 50 }).notNull(),
  model: varchar({ length: 100 }).notNull(),
  plateNumber: varchar("plate_number", {
    length: 20,
  })
    .notNull()
    .unique(),
  year: integer().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// ========================================
// 4. SERVICES
// ========================================
export const servicesTable = pgTable(
  "services",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    code: varchar({ length: 50 }).notNull().unique(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    basePrice: numeric("base_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    reminderIntervalDays: integer("reminder_interval_days"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("services_base_price_check", sql`${table.basePrice} >= 0`),
    check(
      "services_reminder_interval_check",
      sql`${table.reminderIntervalDays} IS NULL
          OR ${table.reminderIntervalDays} > 0`,
    ),
  ],
);

// ========================================
// 5. SERVICE ORDERS
// ========================================
export const serviceOrdersTable = pgTable(
  "service_orders",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id),
    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehiclesTable.id),
    complaint: text().notNull(),
    mileage: integer(),
    inspectionNotes: text("inspection_notes"),
    inspectionImageUrl: text("inspection_image_url"),
    estimatedTotal: numeric("estimated_total", {
      precision: 12,
      scale: 2,
    }),
    finalTotal: numeric("final_total", {
      precision: 12,
      scale: 2,
    }),
    estimateStatus: estimateStatusEnum("estimate_status")
      .default("draft")
      .notNull(),
    status: serviceStatusEnum("status").default("submitted").notNull(),
    finalNotes: text("final_notes"),
    invoiceNumber: varchar("invoice_number", {
      length: 50,
    }).unique(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    receivedAt: timestamp("received_at", {
      withTimezone: true,
    }),
    estimatedCompletionAt: timestamp("estimated_completion_at", {
      withTimezone: true,
    }),
    estimateApprovedAt: timestamp("estimate_approved_at", {
      withTimezone: true,
    }),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
    invoiceIssuedAt: timestamp("invoice_issued_at", { withTimezone: true }),
    handedOverAt: timestamp("handed_over_at", {
      withTimezone: true,
    }),
    returnedAt: timestamp("returned_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    check(
      "service_orders_mileage_check",
      sql`${table.mileage} IS NULL
          OR ${table.mileage} >= 0`,
    ),
    check(
      "service_orders_estimated_total_check",
      sql`${table.estimatedTotal} IS NULL
          OR ${table.estimatedTotal} >= 0`,
    ),
    check(
      "service_orders_final_total_check",
      sql`${table.finalTotal} IS NULL
          OR ${table.finalTotal} >= 0`,
    ),
  ],
);

// ========================================
// 6. SERVICE ORDER ITEMS
// ========================================
export const serviceOrderItemsTable = pgTable(
  "service_order_items",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    serviceOrderId: integer("service_order_id")
      .notNull()
      .references(() => serviceOrdersTable.id),
    serviceId: integer("service_id").references(() => servicesTable.id),
    itemType: itemTypeEnum("item_type").notNull(),
    name: varchar({ length: 100 }).notNull(),
    quantity: integer().notNull(),
    unitPrice: numeric("unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    subtotal: numeric("subtotal", {
      precision: 12,
      scale: 2,
    }).notNull(),
  },
  (table) => [
    check("service_order_items_quantity_check", sql`${table.quantity} > 0`),
    check("service_order_items_unit_price_check", sql`${table.unitPrice} >= 0`),
    check("service_order_items_subtotal_check", sql`${table.subtotal} >= 0`),
  ],
);

// ========================================
// 7. SERVICE UPDATES
// ========================================
export const serviceUpdatesTable = pgTable("service_updates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  serviceOrderId: integer("service_order_id")
    .notNull()
    .references(() => serviceOrdersTable.id),
  updatedBy: integer("updated_by")
    .notNull()
    .references(() => usersTable.id),
  status: serviceStatusEnum("status").notNull(),
  notes: text(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// ========================================
// 8. PAYMENTS
// ========================================
export const paymentsTable = pgTable(
  "payments",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    serviceOrderId: integer("service_order_id")
      .notNull()
      .references(() => serviceOrdersTable.id),
    method: paymentMethodEnum("method").notNull(),
    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    externalId: varchar("external_id", {
      length: 255,
    }).unique(),
    paymentSessionId: varchar("payment_session_id", {
      length: 255,
    }).unique(),
    paymentUrl: text("payment_url"),
    paidAt: timestamp("paid_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("payments_amount_check", sql`${table.amount} >= 0`),
    uniqueIndex("payments_one_paid_per_order")
      .on(table.serviceOrderId)
      .where(sql`${table.status} = 'paid'`),
  ],
);
