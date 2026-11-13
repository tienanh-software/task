import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["reminder", "overdue", "system"], default: "system" },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
