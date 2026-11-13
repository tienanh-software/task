import { Router } from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";

const router = Router();
const allowedStatuses = ["todo", "in-progress", "done", "overdue"];
const allowedPriorities = ["low", "medium", "high"];

router.get("/", async (req, res, next) => {
  try {
    const { search = "", status, priority } = req.query;
    const filter = {};
    if (status && allowedStatuses.includes(status)) filter.status = status;
    if (priority && allowedPriorities.includes(priority)) filter.priority = priority;
    if (search.trim()) filter.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
      { project: { $regex: search.trim(), $options: "i" } },
    ];
    const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: -1 }).lean();
    res.json(tasks);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, description = "", priority = "medium", dueDate = null, project = "Personal" } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Task title is required." });
    if (!allowedPriorities.includes(priority)) return res.status(400).json({ message: "Invalid priority." });
    const task = await Task.create({ title: title.trim(), description, priority, dueDate: dueDate || null, project });
    res.status(201).json(task);
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid task ID." });
    const updates = {};
    for (const key of ["title", "description", "priority", "dueDate", "project", "status"]) {
      if (key in req.body) updates[key] = req.body[key];
    }
    if (updates.title !== undefined && !updates.title.trim()) return res.status(400).json({ message: "Title cannot be empty." });
    if (updates.status && !allowedStatuses.includes(updates.status)) return res.status(400).json({ message: "Invalid status." });
    if (updates.priority && !allowedPriorities.includes(updates.priority)) return res.status(400).json({ message: "Invalid priority." });
    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid task ID." });
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted." });
  } catch (error) { next(error); }
});

export default router;
