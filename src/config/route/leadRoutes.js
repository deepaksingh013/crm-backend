import express from "express";

import {
  assignLeads,
} from "../controller/leadController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/assign",
  authMiddleware,
  assignLeads
);

export default router;