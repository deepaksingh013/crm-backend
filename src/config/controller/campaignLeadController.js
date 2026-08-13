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

      const name = String(row.name || "").trim();
      const mobile = String(row.mobile || "").trim();

      const pincode = String(row.pincode || "").trim();

      const address = String(row.address || "").trim();

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
      // LEAD OBJECT
      // =========================

      leads.push({
        campaign: campaignId,

        name,

        mobile,

        pincode: pincode || null,

        address: address || null,

        assignedTo: null,

        assignedBy: null,

        status: "New",

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