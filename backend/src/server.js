import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import roleRoutes from "./routes/roleRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import hrRoutes from "./routes/hrRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import { ensureDefaultRoles } from "./utils/ensureRoles.js";
import { ensureEmployeeIds } from "./utils/ensureEmployeeIds.js";

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultRoles();
    await ensureEmployeeIds();

    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/tickets", ticketRoutes);
    app.use("/api", roleRoutes);
    app.use("/api", attendanceRoutes);
    app.use("/api", hrRoutes);
    app.use("/api", financeRoutes);
    app.use("/api", portfolioRoutes);
    app.use("/api", dashboardRoutes);
    app.use("/api", leaveRoutes);
    app.get("/", (req, res) => {
      res.json({ message: "API running 🚀" });
    });

    const PORT = Number(process.env.PORT) || 4000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
