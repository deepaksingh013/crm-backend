import express from "express";
import multer from "multer";

import {importCampaignLeads } from "../controller/campaignLeadController.js"

import authMiddleware from "../middleware/authMiddleware.js";
// import { restrictTo } from "../middleware/roleMiddleware.js"; // uncomment if you have role checks

const router = express.Router({ mergeParams: true }); // mergeParams so :campaignId is accessible

// Multer setup — memory storage since your controller uses req.file.buffer
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/",
  authMiddleware,              // sets req.user
  // restrictTo("admin", "manager"), // uncomment + adjust if this route needs role restriction
  upload.single("file"),
  importCampaignLeads
);

export default router;