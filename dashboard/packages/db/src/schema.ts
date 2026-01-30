import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const camera = pgTable("camera", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ip: text("ip").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  path: text("path").notNull(),
  ...timestamps,
});

export const roi = pgTable("roi", {
  id: serial("id").primaryKey(),
  camId: integer("cam_id")
    .notNull()
    .references(() => camera.id, { onDelete: "cascade" }),
  motion: jsonb("motion"),
  food: jsonb("food"),
  ocr: jsonb("ocr"),
  ...timestamps,
});

export const tray = pgTable("tray", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ...timestamps,
});

export const trayDetail = pgTable("tray_detail", {
  id: serial("id").primaryKey(),
  trayId: integer("tray_id")
    .notNull()
    .references(() => tray.id, { onDelete: "cascade" }),
  shape: text("shape"),
  weightG: numeric("weight_g", { precision: 12, scale: 3 }),
  imagePath: text("image_path"),
  ...timestamps,
});

export const menu = pgTable("menu", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
});

export const menuPrice = pgTable("menu_price", {
  id: serial("id").primaryKey(),
  menuId: integer("menu_id")
    .notNull()
    .references(() => menu.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  ...timestamps,
});

export const detectionDetails = pgTable("detection_details", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id")
    .notNull()
    .references(() => camera.id, { onDelete: "restrict" }),
  trayId: integer("tray_id")
    .notNull()
    .references(() => tray.id, { onDelete: "restrict" }),
  menuId: integer("menu_id")
    .notNull()
    .references(() => menu.id, { onDelete: "restrict" }),
  weight: numeric("weight", { precision: 12, scale: 3 }),
  netFoodWeight: numeric("net_food_weight", { precision: 12, scale: 3 }),
  price: numeric("price", { precision: 12, scale: 2 }),
  review: text("review"),
  ...timestamps,
});

export const dashStat = pgTable("dash_stat", {
  id: serial("id").primaryKey(),
  netWeightAgg: numeric("net_weight_agg", { precision: 14, scale: 3 }),
  priceAgg: numeric("price_agg", { precision: 14, scale: 2 }),
  ...timestamps,
});
