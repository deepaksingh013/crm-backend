import XLSX from "xlsx";

import Lead from "../model/Lead.js";
import Campaign from "../model/Campaign.js";

export const importCampaignLeads = async (req, res) => {
  console.log("IMPORT API HIT");

  try {
    const { campaignId } = req.params;

    // =========================
    // FILE CHECK
    // =========================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    // =========================
    // CAMPAIGN CHECK
    // =========================

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // =========================
    // READ EXCEL
    // =========================

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    // =========================
    // EMPTY EXCEL CHECK
    // =========================

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    // =========================
    // CREATE LEADS ARRAY
    // =========================

    const leads = [];
    const errors = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      // =========================
      // ONLY NAME & MOBILE REQUIRED
      // =========================

      const name = String(row.name || "").trim();
      const mobile = String(row.mobile || "").trim();

      // =========================
      // NAME REQUIRED
      // =========================

      if (!name) {
        errors.push({
          row: rowNumber,
          message: "Name is required",
        });

        return;
      }

      // =========================
      // MOBILE REQUIRED
      // =========================

      if (!mobile) {
        errors.push({
          row: rowNumber,
          message: "Mobile is required",
        });

        return;
      }

      // =========================
      // CREATE LEAD
      // =========================

      leads.push({
        campaign: campaignId,

        // Required fields
        name,
        mobile,

        // =========================
        // PATIENT DETAILS
        // Initially null
        // TC will update after assignment
        // =========================

        relation: null,
        patientGender: null,
        aboutDisease: null,
        problem: null,
        problemDuration: null,
        previousTreatment: null,
        allergy: null,

        // =========================
        // CONTACT / ADDRESS
        // =========================

        alternateNumber: null,
        city: null,
        pincode: null,
        address: null,

        // =========================
        // ASSIGNMENT
        // =========================

        assignedTo: null,
        assignedBy: null,

        // TC name
        tcName: null,

        // =========================
        // STATUS
        // =========================

        status: "Not Connected",

        // =========================
        // CREATED BY
        // =========================

        createdBy: req.user.userId,
      });
    });

    // =========================
    // NO VALID LEADS
    // =========================

    if (!leads.length) {
      return res.status(400).json({
        success: false,
        message: "No valid leads found in Excel",
        errors,
      });
    }

    // =========================
    // INSERT ALL LEADS
    // =========================

    const insertedLeads = await Lead.insertMany(leads);

    // =========================
    // RESPONSE
    // =========================

    return res.status(201).json({
      success: true,
      message: "Leads imported successfully",

      totalRows: rows.length,

      imported: insertedLeads.length,

      failed: errors.length,

      errors,

      data: insertedLeads,
    });
  } catch (error) {
    console.error("Import Campaign Leads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getCampaignLeads = async (req, res) => {
  try {
    console.log("🔥 GET CAMPAIGN LEADS HIT");
    console.log("Campaign ID:", req.params.campaignId);
    console.log("User:", req.user);

    const { campaignId } = req.params;

    // =========================
    // CAMPAIGN CHECK
    // =========================

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // =========================
    // GET CAMPAIGN LEADS
    // =========================

    const leads = await Lead.find({
      campaign: campaignId,
    })
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Campaign leads fetched successfully",
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("GET LEADS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateCampaignLead = async (req, res) => {
  try {
    const { campaignId, leadId } = req.params;

    // =========================
    // CAMPAIGN CHECK
    // =========================

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // =========================
    // FIND LEAD
    // =========================

    const lead = await Lead.findOne({
      _id: leadId,
      campaign: campaignId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found in this campaign",
      });
    }

    // =========================
    // ALLOWED FIELDS
    // =========================

    const allowedFields = [
      "name",
      "mobile",
      "alternateNumber",

      "relation",
      "patientGender",
      "aboutDisease",
      "problem",
      "problemDuration",
      "previousTreatment",
      "allergy",

      "city",
      "pincode",
      "address",

      "status",
      "reason",
    ];

    // =========================
    // UPDATE ONLY ALLOWED FIELDS
    // =========================

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    // =========================
    // STATUS VALIDATION
    // =========================

    const allowedStatuses = [
      "Complete",
      "Reject",
      "Holding",
      "Not Connected",
    ];

    if (
      req.body.status !== undefined &&
      !allowedStatuses.includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        allowedStatuses,
      });
    }

    // =========================
    // REASON VALIDATION
    // =========================

    if (
      req.body.reason !== undefined &&
      typeof req.body.reason !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason must be a string",
      });
    }

    // =========================
    // SAVE
    // =========================

    const updatedLead = await lead.save();

    // =========================
    // POPULATE
    // =========================

    await updatedLead.populate([
      {
        path: "assignedTo",
        select: "name email role",
      },
      {
        path: "assignedBy",
        select: "name email role",
      },
      {
        path: "createdBy",
        select: "name email role",
      },
    ]);

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    });
  } catch (error) {
    console.error("UPDATE CAMPAIGN LEAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getMyCampaignLeads = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const userId = req.user.userId;
    const role = req.user.role;

    console.log("🔥 GET MY LEADS HIT");
    console.log("Campaign ID:", campaignId);
    console.log("User ID:", userId);
    console.log("Role:", role);

    // =========================
    // CAMPAIGN CHECK
    // =========================

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // =========================
    // BUILD QUERY
    // =========================

    const query = {
      campaign: campaignId,
    };

    // =========================
    // ADMIN
    // =========================

    if (role === "admin" || role === "superadmin") {
      // Admin can see all campaign leads
    }

    // =========================
    // TC
    // =========================

    else if (role === "tc") {
      query.assignedTo = userId;
    }

    // =========================
    // TL
    // =========================

    else if (role === "tl") {
      query.assignedTo = userId;
    }

    // =========================
    // MANAGER
    // =========================

    else if (role === "manager") {
      query.assignedTo = userId;
    }

    // =========================
    // INVALID ROLE
    // =========================

    else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view leads",
      });
    }

    // =========================
    // GET LEADS
    // =========================

    const leads = await Lead.find(query)
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Leads fetched successfully",
      role,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("GET MY CAMPAIGN LEADS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};