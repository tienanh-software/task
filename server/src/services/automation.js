import cron from "node-cron";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";

// Runs every minute. A production system should use a durable job queue for scale.
export function startAutomation() {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const overdueTasks = await Task.find({
        dueDate: { $lt: now }, status: { $nin: ["done", "overdue"] }
      });
      for (const task of overdueTasks) {
        task.status = "overdue";
        await task.save();
        await Notification.create({
          taskId: task._id, title: "Task is overdue",
          message: `"${task.title}" has passed its deadline.`,
          type: "overdue"
        });
      }

      const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const reminders = await Task.find({
        dueDate: { $gt: now, $lte: soon }, status: { $ne: "done" }, reminderSent: false
      });
      for (const task of reminders) {
        await Notification.create({
          taskId: task._id, title: "Deadline approaching",
          message: `"${task.title}" is due within 24 hours.`,
          type: "reminder"
        });
        task.reminderSent = true;
        await task.save();
      }
    } catch (error) {
      console.error("Automation job failed:", error.message);
    }
  });
  console.log("Task automation scheduled (every minute)");
}
