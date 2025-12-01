import {
  type User,
  type InsertUser,
  type WishList,
  type InsertWishList,
  type WishListItem,
  type InsertWishListItem,
  type Announcement,
  type InsertAnnouncement,
  type Config,
  type Stats,
} from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const LISTS_FILE = path.join(DATA_DIR, "lists.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, "annonces.json");
const CONFIG_FILE = path.join(process.cwd(), "config.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    console.error(`Error reading ${filePath}`);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

export interface IStorage {
  // Config
  getConfig(): Promise<Config>;
  updatePasswords(passwords: Partial<Config>): Promise<Config>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Wish Lists
  getLists(): Promise<WishList[]>;
  getList(id: string): Promise<WishList | undefined>;
  getListByUsername(username: string): Promise<WishList | undefined>;
  createList(list: InsertWishList): Promise<WishList>;
  deleteList(id: string): Promise<boolean>;
  deleteAllLists(): Promise<void>;

  // Wish List Items
  addItemToList(username: string, item: InsertWishListItem): Promise<WishListItem>;
  updateItem(itemId: string, username: string, item: Partial<InsertWishListItem>): Promise<WishListItem | undefined>;
  deleteItem(itemId: string, username: string): Promise<boolean>;

  // Announcements
  getAnnouncements(): Promise<Announcement[]>;
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;

  // Stats
  getStats(): Promise<Stats>;
}

export class FileStorage implements IStorage {
  private lists: WishList[];
  private users: User[];
  private announcements: Announcement[];
  private config: Config;

  constructor() {
    ensureDataDir();
    this.lists = readJsonFile<WishList[]>(LISTS_FILE, []);
    this.users = readJsonFile<User[]>(USERS_FILE, []);
    this.announcements = readJsonFile<Announcement[]>(ANNOUNCEMENTS_FILE, []);
    this.config = readJsonFile<Config>(CONFIG_FILE, {
      userPassword: "user123",
      parentPassword: "parent123",
      devPassword: "dev123",
    });

    // Ensure config file exists
    if (!fs.existsSync(CONFIG_FILE)) {
      writeJsonFile(CONFIG_FILE, this.config);
    }
  }

  private saveLists(): void {
    writeJsonFile(LISTS_FILE, this.lists);
  }

  private saveUsers(): void {
    writeJsonFile(USERS_FILE, this.users);
  }

  private saveAnnouncements(): void {
    writeJsonFile(ANNOUNCEMENTS_FILE, this.announcements);
  }

  private saveConfig(): void {
    writeJsonFile(CONFIG_FILE, this.config);
  }

  // Config methods
  async getConfig(): Promise<Config> {
    return this.config;
  }

  async updatePasswords(passwords: Partial<Config>): Promise<Config> {
    this.config = { ...this.config, ...passwords };
    this.saveConfig();
    return this.config;
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return this.users;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.saveUsers();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;

    this.users[index] = { ...this.users[index], ...userData };
    this.saveUsers();
    return this.users[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    this.saveUsers();
    return true;
  }

  // List methods
  async getLists(): Promise<WishList[]> {
    return this.lists;
  }

  async getList(id: string): Promise<WishList | undefined> {
    return this.lists.find((l) => l.id === id);
  }

  async getListByUsername(username: string): Promise<WishList | undefined> {
    return this.lists.find((l) => l.username.toLowerCase() === username.toLowerCase());
  }

  async createList(insertList: InsertWishList): Promise<WishList> {
    const list: WishList = {
      ...insertList,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.lists.push(list);
    this.saveLists();
    return list;
  }

  async deleteList(id: string): Promise<boolean> {
    const index = this.lists.findIndex((l) => l.id === id);
    if (index === -1) return false;

    this.lists.splice(index, 1);
    this.saveLists();
    return true;
  }

  async deleteAllLists(): Promise<void> {
    this.lists = [];
    this.saveLists();
  }

  // List items methods (working lists - stored in memory for current session, then sent)
  private workingLists: Map<string, WishListItem[]> = new Map();

  async addItemToList(username: string, item: InsertWishListItem): Promise<WishListItem> {
    const newItem: WishListItem = {
      ...item,
      id: randomUUID(),
    };

    if (!this.workingLists.has(username)) {
      this.workingLists.set(username, []);
    }

    this.workingLists.get(username)!.push(newItem);
    return newItem;
  }

  async updateItem(itemId: string, username: string, itemData: Partial<InsertWishListItem>): Promise<WishListItem | undefined> {
    const items = this.workingLists.get(username);
    if (!items) return undefined;

    const index = items.findIndex((i) => i.id === itemId);
    if (index === -1) return undefined;

    items[index] = { ...items[index], ...itemData };
    return items[index];
  }

  async deleteItem(itemId: string, username: string): Promise<boolean> {
    const items = this.workingLists.get(username);
    if (!items) return false;

    const index = items.findIndex((i) => i.id === itemId);
    if (index === -1) return false;

    items.splice(index, 1);
    return true;
  }

  async getWorkingList(username: string): Promise<WishListItem[]> {
    return this.workingLists.get(username) || [];
  }

  async sendList(username: string): Promise<WishList | null> {
    const items = this.workingLists.get(username);
    if (!items || items.length === 0) return null;

    // Remove existing list for this user if any
    const existingIndex = this.lists.findIndex(
      (l) => l.username.toLowerCase() === username.toLowerCase()
    );
    if (existingIndex !== -1) {
      this.lists.splice(existingIndex, 1);
    }

    const list: WishList = {
      id: randomUUID(),
      username,
      createdAt: new Date().toISOString(),
      items: [...items],
    };

    this.lists.push(list);
    this.saveLists();
    this.workingLists.delete(username);

    return list;
  }

  // Announcement methods
  async getAnnouncements(): Promise<Announcement[]> {
    return this.announcements;
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    return this.announcements.find((a) => a.id === id);
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const announcement: Announcement = {
      ...insertAnnouncement,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.announcements.push(announcement);
    this.saveAnnouncements();
    return announcement;
  }

  async updateAnnouncement(id: string, announcementData: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) return undefined;

    this.announcements[index] = { ...this.announcements[index], ...announcementData };
    this.saveAnnouncements();
    return this.announcements[index];
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) return false;

    this.announcements.splice(index, 1);
    this.saveAnnouncements();
    return true;
  }

  // Stats
  async getStats(): Promise<Stats> {
    const totalItems = this.lists.reduce((sum, list) => sum + list.items.length, 0);
    return {
      totalLists: this.lists.length,
      totalUsers: this.users.length,
      totalItems,
      totalAnnouncements: this.announcements.length,
    };
  }
}

export const storage = new FileStorage();
