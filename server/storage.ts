import {
  type User,
  type InsertUser,
  type Schedule,
  type InsertSchedule,
  type Medicine,
  type InsertMedicine,
  type HealthReport,
  type InsertHealthReport,
  type Notification,
  type InsertNotification,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Schedules
  getSchedulesByUserId(userId: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, updates: Partial<Schedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  
  // Medicines
  getMedicinesByUserId(userId: number): Promise<Medicine[]>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicine(id: number, updates: Partial<Medicine>): Promise<Medicine | undefined>;
  deleteMedicine(id: number): Promise<boolean>;
  
  // Health Reports
  getHealthReportsByUserId(userId: number): Promise<HealthReport[]>;
  createHealthReport(report: InsertHealthReport): Promise<HealthReport>;
  getHealthReportById(id: number): Promise<HealthReport | undefined>;
  deleteHealthReport(id: number): Promise<boolean>;
  
  // Notifications
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
}

// Database Storage Implementation
import { users, schedules, medicines, healthReports, notifications } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getSchedulesByUserId(userId: number): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.userId, userId));
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async updateSchedule(id: number, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    if (updates.id) {
      delete updates.id;
    }
    if (updates.createdAt) {
      delete updates.createdAt;
    }
    const [schedule] = await db
      .update(schedules)
      .set(updates)
      .where(eq(schedules.id, id))
      .returning();
    return schedule || undefined;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const result = await db.delete(schedules).where(eq(schedules.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getMedicinesByUserId(userId: number): Promise<Medicine[]> {
    return await db.select().from(medicines).where(eq(medicines.userId, userId));
  }

  async createMedicine(insertMedicine: InsertMedicine): Promise<Medicine> {
    const [medicine] = await db
      .insert(medicines)
      .values(insertMedicine)
      .returning();
    return medicine;
  }

  async updateMedicine(id: number, updates: Partial<Medicine>): Promise<Medicine | undefined> {
    if (updates.id) {
      delete updates.id;
    }
    if (updates.createdAt) {
      delete updates.createdAt;
    }
    const [medicine] = await db
      .update(medicines)
      .set(updates)
      .where(eq(medicines.id, id))
      .returning();
    return medicine || undefined;
  }

  async deleteMedicine(id: number): Promise<boolean> {
    const result = await db.delete(medicines).where(eq(medicines.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getHealthReportsByUserId(userId: number): Promise<HealthReport[]> {
    return await db.select().from(healthReports).where(eq(healthReports.userId, userId));
  }

  async createHealthReport(insertReport: InsertHealthReport): Promise<HealthReport> {
    const [report] = await db
      .insert(healthReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getHealthReportById(id: number): Promise<HealthReport | undefined> {
    const [report] = await db.select().from(healthReports).where(eq(healthReports.id, id));
    return report || undefined;
  }

  async deleteHealthReport(id: number): Promise<boolean> {
    const result = await db.delete(healthReports).where(eq(healthReports.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();