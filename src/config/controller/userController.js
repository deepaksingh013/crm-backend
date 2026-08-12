import bcrypt from "bcryptjs";
import User from "../model/User.js"

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    // Required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
      });
    }

    // Only these roles can be created from User Management
    if (!["manager", "tl", "tc"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Only manager, tl and tc users can be created",
      });
    }

    // Check existing email
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      permissions: permissions || [],
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error("Create User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) {
      user.name = name.trim();
    }

    if (email) {
      user.email = email.toLowerCase().trim();
    }

    if (role) {
      if (!["manager", "tl", "tc"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      user.role = role;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Admin ko deactivate nahi karne denge
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin user cannot be deactivated",
      });
    }

    user.isActive = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Deactivate User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};