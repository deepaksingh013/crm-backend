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


// CAMPAIGN LEADS
// ├── POST   /api/campaigns/:campaignId/leads
// ├── GET    /api/campaigns/:campaignId/leads
// ├── GET    /api/campaigns/:campaignId/leads/:leadId
// ├── PATCH  /api/campaigns/:campaignId/leads/:leadId
// ├── DELETE /api/campaigns/:campaignId/leads/:leadId
// │
// ├── POST   /api/campaigns/:campaignId/leads/import
// │
// ├── POST   /api/campaigns/:campaignId/leads/assign
// ├── PATCH  /api/campaigns/:campaignId/leads/:leadId/assign
// ├── GET    /api/campaigns/:campaignId/leads/assigned
// ├── GET    /api/campaigns/:campaignId/leads/unassigned
// ├── GET    /api/campaigns/:campaignId/leads/assignment-history
// ├── GET    /api/campaigns/:campaignId/leads/:leadId/assignment-history
// │
// ├── PATCH  /api/campaigns/:campaignId/leads/:leadId/status
// ├── GET    /api/campaigns/:campaignId/leads/:leadId/history
// │
// ├── POST   /api/campaigns/:campaignId/leads/:leadId/notes
// ├── GET    /api/campaigns/:campaignId/leads/:leadId/notes
// │
// ├── POST   /api/campaigns/:campaignId/leads/:leadId/followups
// ├── GET    /api/campaigns/:campaignId/leads/:leadId/followups
// ├── PATCH  /api/campaigns/:campaignId/leads/:leadId/followups/:followupId
// └── POST   /api/campaigns/:campaignId/leads/:leadId/followups/:followupId/complete