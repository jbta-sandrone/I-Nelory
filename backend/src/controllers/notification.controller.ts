import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  clearNotifications,
  deleteNotification,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationAsRead,
} from "../services/notification.service.js";

export const listNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const filter = typeof req.query.filter === "string" ? req.query.filter : "All";
    const result = await getUserNotifications(req.userId!, filter);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to load notifications",
    });
  }
};

export const readNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.id;
    const result = await markNotificationAsRead(notificationId, req.userId!);

    if (!result) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to mark notification as read",
    });
  }
};

export const readAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    await markAllNotificationsRead(req.userId!);

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to mark notifications as read",
    });
  }
};

export const removeNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.id;
    const result = await deleteNotification(notificationId, req.userId!);

    if (!result) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to delete notification",
    });
  }
};

export const clearAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    await clearNotifications(req.userId!);

    return res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to clear notifications",
    });
  }
};
