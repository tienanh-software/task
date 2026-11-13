import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 2000 },
  status: { type: String, enum: ["todo", "in-progress", "done", "overdue"], default: "todo" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  dueDate: { type: Date, default: null },
  project: { type: String, default: "Personal", trim: true },
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true });

taskSchema.index({ dueDate: 1, status: 1 });
export default mongoose.model("Task", taskSchema);
