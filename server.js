import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./db.js";

import authRoutes from "./src/config/route/authRoutes.js";
import userRoutes from "./src/config/route/userRoutes.js";
import campaignRoutes from "./src/config/route/campaignRoutes.js";

dotenv.config();

const app = express();

// Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CRM Backend Running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/campaigns", campaignRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});