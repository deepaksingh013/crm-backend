import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "./db.js";
import User from "../backend/src/config/model/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const password = await bcrypt.hash("123456", 10);

    const admin = await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password,
      role: "admin",
      isActive: true,
      permissions: [
        "dashboard",
        "users",
        "campaigns",
        "leads",
        "assignments",
        "reports"
      ]
    });

    console.log("Admin created:", admin.email);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();