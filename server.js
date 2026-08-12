import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./db.js";
import authRoutes from "../backend/src/config/route/authRoutes.js";
import userRoutes from "../backend/src/config/route/userRoutes.js";
import campaignRoutes
 from "../backend/src/config/route/campaignRoutes.js";


dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CRM Backend Running",
  });
});

// Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/campaigns", campaignRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});