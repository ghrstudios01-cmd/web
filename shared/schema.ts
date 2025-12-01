import { z } from "zod";

// Account schema for authentication
export const accountSchema = z.object({
  id: z.string(),
  username: z.string().min(1, "L'identifiant est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  displayName: z.string().min(1, "Le nom est requis"),
  role: z.enum(["user", "parent", "developer"]),
  createdAt: z.string(),
});

export type Account = z.infer<typeof accountSchema>;

export const insertAccountSchema = accountSchema.omit({ id: true, createdAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;

// Config schema for passwords (legacy - kept for backward compatibility)
export const configSchema = z.object({
  userPassword: z.string(),
  parentPassword: z.string(),
  devPassword: z.string(),
});

export type Config = z.infer<typeof configSchema>;

// Wish list item schema
export const wishListItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  quantity: z.number().min(1).default(1),
  image: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type WishListItem = z.infer<typeof wishListItemSchema>;

export const insertWishListItemSchema = wishListItemSchema.omit({ id: true });
export type InsertWishListItem = z.infer<typeof insertWishListItemSchema>;

// Wish list schema
export const wishListSchema = z.object({
  id: z.string(),
  username: z.string().min(1, "Le nom est requis"),
  createdAt: z.string(),
  items: z.array(wishListItemSchema),
});

export type WishList = z.infer<typeof wishListSchema>;

export const insertWishListSchema = wishListSchema.omit({ id: true, createdAt: true });
export type InsertWishList = z.infer<typeof insertWishListSchema>;

// User schema for developer management
export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  email: z.string().email("Email invalide").optional(),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

// Announcement schema
export const announcementSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().min(1, "Le contenu est requis"),
  createdAt: z.string(),
  isActive: z.boolean().default(true),
});

export type Announcement = z.infer<typeof announcementSchema>;

export const insertAnnouncementSchema = announcementSchema.omit({ id: true, createdAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(1, "L'identifiant est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Role type
export type UserRole = "user" | "parent" | "developer";

// Stats schema
export const statsSchema = z.object({
  totalLists: z.number(),
  totalUsers: z.number(),
  totalItems: z.number(),
  totalAnnouncements: z.number(),
  totalAccounts: z.number(),
});

export type Stats = z.infer<typeof statsSchema>;
