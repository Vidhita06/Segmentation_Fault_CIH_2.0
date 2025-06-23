import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertScheduleSchema,
  insertMedicineSchema,
  insertHealthReportSchema,
} from "@shared/schema";
import { analyzeHealthReports, generatePersonalizedInsight, getChatResponse } from "./docbot";
import { z } from "zod";
import path from "path";
import fs from "fs";
import multer from "multer";

const SALT_ROUNDS = 10;

const smsSettingsSchema = z.object({
  phone: z.string().optional(),
  smsOptIn: z.boolean().optional(),
});

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration attempt with body:", JSON.stringify(req.body, null, 2));
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      res.status(201).json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log("Login attempt:", { email, password: "***" });
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      console.log("User found:", user ? { id: user.id, email: user.email, hasPassword: !!user.password } : null);
      
      if (!user) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Login successful for user:", user.id);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;

      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: "User ID, current password, and new password are required." });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid current password." });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await storage.updateUser(userId, { password: hashedNewPassword });

      res.json({ message: "Password updated successfully." });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // SMS Settings routes
  app.get("/api/users/:id/sms-settings", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ phone: user.phone, smsOptIn: user.smsOptIn });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id/sms-settings", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = smsSettingsSchema.parse(req.body);

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ phone: user.phone, smsOptIn: user.smsOptIn });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Schedule routes
  app.get("/api/schedules/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const schedules = await storage.getSchedulesByUserId(userId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  app.patch("/api/schedules/:id", async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const updates = req.body;
      
      const schedule = await storage.updateSchedule(scheduleId, updates);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const deleted = await storage.deleteSchedule(scheduleId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Medicine routes
  app.get("/api/medicines/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const medicines = await storage.getMedicinesByUserId(userId);
      res.json(medicines);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/medicines", async (req, res) => {
    try {
      const medicineData = insertMedicineSchema.parse(req.body);
      const medicine = await storage.createMedicine(medicineData);
      res.status(201).json(medicine);
    } catch (error) {
      res.status(400).json({ message: "Invalid medicine data" });
    }
  });

  app.patch("/api/medicines/:id", async (req, res) => {
    try {
      const medicineId = parseInt(req.params.id);
      const updates = req.body;
      
      const medicine = await storage.updateMedicine(medicineId, updates);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }

      res.json(medicine);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/medicines/:id", async (req, res) => {
    try {
      const medicineId = parseInt(req.params.id);
      const deleted = await storage.deleteMedicine(medicineId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Medicine not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health reports routes - old POST route removed, will be replaced
  app.get("/api/health-reports/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reports = await storage.getHealthReportsByUserId(userId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/health-reports", upload.single('report'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const reportData = {
        userId: parseInt(req.body.userId),
        fileName: req.file.originalname,
        // These are hardcoded for now as per original logic
        bloodPressure: "120/80",
        bloodSugar: "95 mg/dL",
        heartRate: "72 bpm",
      };

      const parsedData = insertHealthReportSchema.parse(reportData);
      const report = await storage.createHealthReport(parsedData);
      
      // Rename the file to keep its original name + extension
      fs.renameSync(req.file.path, path.join(req.file.destination, req.file.originalname));

      res.status(201).json(report);
    } catch (error) {
      // If something goes wrong, delete the uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Upload report error:", error);
      res.status(400).json({ message: "Invalid report data or upload failed." });
    }
  });

  // New Health Report Routes
  app.get("/api/reports/:reportId/view", async (req, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      // TODO: Add proper authorization to ensure user owns this report
      const report = await storage.getHealthReportById(reportId);

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Assuming files are stored in a root "uploads" directory
      const filePath = path.join(process.cwd(), 'uploads', report.fileName);

      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).json({ message: "File not found on server" });
      }
    } catch (error) {
      console.error("View report error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/reports/:reportId", async (req, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      // TODO: Add proper authorization to ensure user owns this report
      const report = await storage.getHealthReportById(reportId);

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // 1. Delete the file from the filesystem
      const filePath = path.join(process.cwd(), 'uploads', report.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 2. Delete the record from the database
      const deleted = await storage.deleteHealthReport(reportId);

      if (!deleted) {
        // This case is unlikely if the above check passed, but good practice
        return res.status(404).json({ message: "Report not found in DB" });
      }

      res.status(200).json({ message: "Report deleted successfully" });
    } catch (error) {
      console.error("Delete report error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:userId/read-all", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const success = await storage.markAllNotificationsAsRead(userId);
      
      if (!success) {
        return res.status(404).json({ message: "Could not update notifications" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DocBot routes
  app.post("/api/docbot/chat", async (req, res) => {
    try {
      const { message, userId } = req.body;
      if (!message || !userId) {
        return res.status(400).json({ message: "Message and userId are required" });
      }
      const response = await getChatResponse(message, userId);
      res.json({ reply: response });
    } catch (error) {
      console.error("DocBot chat route error:", error);
      res.status(500).json({ message: "Failed to get response from DocBot" });
    }
  });

  app.post("/api/docbot/analyze/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reports = await storage.getHealthReportsByUserId(userId);
      const analysis = await analyzeHealthReports(reports);
      res.json(analysis);
    } catch (error) {
      console.error("DocBot analysis error:", error);
      res.status(500).json({ message: "Failed to analyze health data" });
    }
  });

  app.post("/api/docbot/insight", async (req, res) => {
    try {
      const { age, healthConditions } = req.body;
      const insight = await generatePersonalizedInsight(age, healthConditions);
      res.json({ insight });
    } catch (error) {
      console.error("DocBot insight error:", error);
      res.status(500).json({ message: "Failed to generate insight" });
    }
  });

  // Premium upgrade simulation
  app.post("/api/premium/upgrade", async (req, res) => {
    try {
      const { userId, paymentMethod } = req.body;
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user to premium
      await storage.updateUser(userId, { isPremium: true });
      
      res.json({ success: true, message: "Premium upgrade successful" });
    } catch (error) {
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
