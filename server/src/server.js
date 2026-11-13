import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import tasksRouter from "./routes/tasks.js";
import notificationsRouter from "./routes/notifications.js";
import { startAutomation } from "./services/automation.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "FlowTask API" }));
app.use("/api/tasks", tasksRouter);
app.use("/api/notifications", notificationsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const port = process.env.PORT || 5000;
connectDB().then(() => {
  startAutomation();
  app.listen(port, () => console.log(`FlowTask API running at http://localhost:${port}`));
}).catch((error) => {
  console.error("Failed to start:", error.message);
  process.exit(1);
});
