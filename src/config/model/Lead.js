import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    // =========================
    // CAMPAIGN
    // =========================

    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    // =========================
    // BASIC DETAILS
    // =========================

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

    alternateNumber: {
      type: String,
      default: null,
      trim: true,
    },

    // =========================
    // PATIENT DETAILS
    // =========================

    relation: {
      type: String,
      default: null,
      trim: true,
    },

    patientGender: {
      type: String,
      default: null,
      trim: true,
    },

    aboutDisease: {
      type: String,
      default: null,
      trim: true,
    },

    problem: {
      type: String,
      default: null,
      trim: true,
    },

    problemDuration: {
      type: String,
      default: null,
      trim: true,
    },

    previousTreatment: {
      type: String,
      default: null,
      trim: true,
    },

    allergy: {
      type: String,
      default: null,
      trim: true,
    },

    // =========================
    // ADDRESS DETAILS
    // =========================

    city: {
      type: String,
      default: null,
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

    // =========================
    // ASSIGNMENT
    // =========================

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

    // TC Name
    tcName: {
      type: String,
      default: null,
      trim: true,
    },

    // =========================
    // LEAD STATUS
    // =========================

    status: {
      type: String,
      enum: [
        "Complete",
        "Reject",
        "Holding",
        "Not Connected",
      ],
      default: "Not Connected",
    },

    // =========================
    // STATUS REASON
    // =========================

    reason: {
      type: String,
      default: null,
      trim: true,
    },

    // =========================
    // CREATED BY
    // =========================

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