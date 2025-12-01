import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertAnnouncementSchema,
  insertWishListItemSchema,
  configSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { role, password, username } = req.body;

      if (!role || !password) {
        return res.status(400).json({ success: false, message: "Role et mot de passe requis" });
      }

      const config = await storage.getConfig();
      let isValid = false;

      switch (role) {
        case "user":
          isValid = password === config.userPassword;
          break;
        case "parent":
          isValid = password === config.parentPassword;
          break;
        case "developer":
          isValid = password === config.devPassword;
          break;
        default:
          return res.status(400).json({ success: false, message: "Role invalide" });
      }

      if (!isValid) {
        return res.status(401).json({ success: false, message: "Mot de passe incorrect" });
      }

      res.json({ success: true, role, username });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  });

  // Config routes
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config);
    } catch (error) {
      console.error("Get config error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.put("/api/config/passwords", async (req, res) => {
    try {
      const result = configSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Donnees invalides" });
      }
      const config = await storage.updatePasswords(result.data);
      res.json(config);
    } catch (error) {
      console.error("Update passwords error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Users routes
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Donnees invalides", details: result.error });
      }
      const user = await storage.createUser(result.data);
      res.status(201).json(user);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = insertUserSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Donnees invalides" });
      }
      const user = await storage.updateUser(id, result.data);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouve" });
      }
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "Utilisateur non trouve" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Lists routes
  app.get("/api/lists", async (_req, res) => {
    try {
      const lists = await storage.getLists();
      res.json(lists);
    } catch (error) {
      console.error("Get lists error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/lists/current", async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) {
        return res.status(400).json({ error: "Username requis" });
      }
      const items = await (storage as any).getWorkingList(username);
      res.json({ 
        id: "current",
        username,
        createdAt: new Date().toISOString(),
        items 
      });
    } catch (error) {
      console.error("Get current list error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/lists/items", async (req, res) => {
    try {
      const { username, ...itemData } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username requis" });
      }
      const result = insertWishListItemSchema.safeParse(itemData);
      if (!result.success) {
        return res.status(400).json({ error: "Donnees invalides", details: result.error });
      }
      const item = await storage.addItemToList(username, result.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Add item error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.put("/api/lists/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { username, ...itemData } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username requis" });
      }
      const item = await storage.updateItem(id, username, itemData);
      if (!item) {
        return res.status(404).json({ error: "Article non trouve" });
      }
      res.json(item);
    } catch (error) {
      console.error("Update item error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.delete("/api/lists/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username requis" });
      }
      const deleted = await storage.deleteItem(id, username);
      if (!deleted) {
        return res.status(404).json({ error: "Article non trouve" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete item error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/lists/send", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username requis" });
      }
      const list = await (storage as any).sendList(username);
      if (!list) {
        return res.status(400).json({ error: "Liste vide" });
      }
      res.status(201).json(list);
    } catch (error) {
      console.error("Send list error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.delete("/api/lists/reset", async (_req, res) => {
    try {
      await storage.deleteAllLists();
      res.json({ success: true });
    } catch (error) {
      console.error("Reset lists error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Announcements routes
  app.get("/api/announcements", async (_req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Get announcements error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const result = insertAnnouncementSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Donnees invalides", details: result.error });
      }
      const announcement = await storage.createAnnouncement(result.data);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Create announcement error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.put("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = insertAnnouncementSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Donnees invalides" });
      }
      const announcement = await storage.updateAnnouncement(id, result.data);
      if (!announcement) {
        return res.status(404).json({ error: "Annonce non trouvee" });
      }
      res.json(announcement);
    } catch (error) {
      console.error("Update announcement error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAnnouncement(id);
      if (!deleted) {
        return res.status(404).json({ error: "Annonce non trouvee" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete announcement error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Stats route
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  return httpServer;
}
