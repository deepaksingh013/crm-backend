import express from "express";
import { createCampaign , getCampaigns, updateCampaign, deleteCampaign} from "../controller/campaignController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/", authMiddleware, createCampaign);
router.get("/", authMiddleware, getCampaigns);
router.patch("/:id", authMiddleware, updateCampaign);
router.delete("/:id", authMiddleware, deleteCampaign);
export default router;