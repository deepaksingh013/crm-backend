import express from "express";
import multer from "multer";

import {
  importCampaignLeads,
  getCampaignLeads,updateCampaignLead, getMyCampaignLeads
} from "../controller/campaignLeadController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

// GET campaign leads
router.get("/:campaignId/leads", authMiddleware, getCampaignLeads);
// POST IMPORT
router.post(
  "/:campaignId/leads/import",
  authMiddleware,
  upload.single("file"),
  importCampaignLeads
);

router.patch(
  "/:campaignId/leads/:leadId",
  authMiddleware,
  updateCampaignLead
);
router.get(
  "/:campaignId/leads/my",
  authMiddleware,
  getMyCampaignLeads
);
export default router;