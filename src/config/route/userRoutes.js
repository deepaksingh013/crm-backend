import express from "express";
import { createUser, updateUser, deleteUser, getUsers, approveUser } from "../controller/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/", authMiddleware, createUser);
router.get("/", authMiddleware, getUsers);
router.patch("/:id", authMiddleware, updateUser);
router.patch(
  "/:id/approve",
  authMiddleware,
  approveUser
);
router.delete("/:id", authMiddleware, deleteUser);

export default router;