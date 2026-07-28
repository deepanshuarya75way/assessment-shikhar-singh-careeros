
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import userRoutes from "./routes/users.js";
import psychometricRoutes from "./routes/psychometric.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import generateRoadmapRoute from "./routes/generateRoadmap.js";
import assistantSmart from "./routes/assistant-intent-smart.js";
import paymentRoutes from "./routes/payments.js";
import appointmentRoutes from "./routes/appointments.js";
import resumeRoutes from "./routes/resume.routes.js";
import collegeRoutes from "./routes/collegeRoutes.js";
import collegeExplore from "./routes/collegeExplore.js";
import messageRoutes from "./routes/messages.js";
import initSocket from "./socket/socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* -------------------- CORS CONFIG -------------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "https://careeros-ten.vercel.app",
  "https://careeros-6epcb92rc-shikharsingh011111-gmailcoms-projects.vercel.app",
];

/* -------------------- Socket.io-------------------- */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initSocket(io);
/* -------------------- MIDDLEWARE -------------------- */

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      // e.g. Postman, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-session-id",
    ],
  })
);

app.use(express.json());

app.options("*", cors());

/* -------------------- ROUTES -------------------- */

app.use("/api/users", userRoutes);

app.use("/api/psychometric", psychometricRoutes);

app.use("/api", recommendationRoutes);

app.use("/api", generateRoadmapRoute);

app.use("/api/payments", paymentRoutes);

app.use("/api/appointments", appointmentRoutes);

app.use(
  "/api/assistant-intent-smart",
  assistantSmart
);
app.use("/api/messages", messageRoutes);
app.use("/api/resume", resumeRoutes);

app.use("/api/colleges", collegeRoutes);

app.use(
  "/api/collegesexplore",
  collegeExplore
);

/* -------------------- DATABASE -------------------- */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
  });

/* -------------------- START SERVER -------------------- */

const PORT = process.env.PORT || 5002;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});