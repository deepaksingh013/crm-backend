import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      default: null,
      trim: true,
    },

    address: {
      type: String,
      default: null,
      trim: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "New",
        "Assigned",
        "Pending",
        "Follow Up",
        "On Hold",
        "Interested",
        "Not Interested",
        "Callback",
        "Converted",
        "Closed",
        "Duplicate",
      ],
      default: "New",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Lead", leadSchema);