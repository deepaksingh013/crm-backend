import XLSX from "xlsx";
import Lead from "../model/Lead.js";
import Campaign from "../model/Campaign.js";
import mongoose from "mongoose";

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
    const { campaignId } = req.params;

    const { assigned = "all" } = req.query;

    console.log("🔥 GET CAMPAIGN LEADS HIT");
    console.log("Campaign ID:", campaignId);
    console.log("Assigned Filter:", assigned);

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
    // ASSIGNMENT FILTER
    // =========================

    if (assigned === "unassigned") {
      query.assignedTo = null;
    }

    if (assigned === "assigned") {
      query.assignedTo = {
        $ne: null,
      };
    }

    // assigned=all
    // koi assignedTo filter nahi lagega

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
      message: "Campaign leads fetched successfully",

      filter: {
        assigned,
      },

      count: leads.length,

      data: leads,
    });
  } catch (error) {
    console.error("GET CAMPAIGN LEADS ERROR:", error);

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

    const {
      status,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    console.log("🔥 GET MY CAMPAIGN LEADS HIT");
    console.log("Campaign ID:", campaignId);
    console.log("User ID:", userId);
    console.log("Role:", role);
    console.log("Status:", status);
    console.log("Search:", search);

    // =========================
    // CAMPAIGN ID CHECK
    // =========================

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID",
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
    // BUILD QUERY
    // =========================

    const query = {
      campaign: new mongoose.Types.ObjectId(campaignId),
    };

    // =========================
    // ADMIN
    // =========================

    if (role === "admin" || role === "superadmin") {
      // Admin can see all leads of this campaign
    }

    // =========================
    // TC / TL / MANAGER
    // =========================

    else if (
      role === "tc" ||
      role === "tl" ||
      role === "manager"
    ) {
      query.assignedTo = new mongoose.Types.ObjectId(userId);
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
    // STATUS FILTER
    // =========================

    if (status) {
      query.status = status;
    }

    // =========================
    // SEARCH FILTER
    // =========================

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          mobile: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    console.log("FINAL QUERY:", query);

    // =========================
    // PAGINATION
    // =========================

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

    const skip = (pageNumber - 1) * limitNumber;

    // =========================
    // TOTAL COUNT
    // =========================

    const total = await Lead.countDocuments(query);

    // =========================
    // GET LEADS
    // =========================

    const leads = await Lead.find(query)
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Campaign leads fetched successfully",

      role,

      campaign: {
        id: campaign._id,
        name: campaign.title,
      },

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },

      filters: {
        status: status || "All",
        search: search || "",
      },

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

export const getCampaignLeadSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    console.log("🔥 CAMPAIGN LEAD SUMMARY");
    console.log("User ID:", userId);
    console.log("Role:", role);

    let leadMatch = {};

    // =========================
    // ADMIN
    // =========================

    if (role === "admin" || role === "superadmin") {
      // Admin sees all leads
      leadMatch = {};
    }

    // =========================
    // TC / TL / MANAGER
    // =========================

    else if (
      role === "tc" ||
      role === "tl" ||
      role === "manager"
    ) {
      leadMatch = {
        assignedTo: new mongoose.Types.ObjectId(userId),
      };
    }

    // =========================
    // INVALID ROLE
    // =========================

    else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view lead summary",
      });
    }

    console.log("LEAD MATCH:", leadMatch);

    // =========================
    // GET ALL CAMPAIGNS
    // =========================

    const campaigns = await Campaign.find()
      .select("_id title")
      .sort({ createdAt: -1 });

    // =========================
    // GET LEAD COUNTS
    // =========================

    const Lead = mongoose.model("Lead");

    const leadSummary = await Lead.aggregate([
      {
        $match: leadMatch,
      },

      {
        $group: {
          _id: {
            campaign: "$campaign",
            status: "$status",
          },

          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // =========================
    // CREATE COUNT MAP
    // =========================

    const summaryMap = {};

    leadSummary.forEach((item) => {
      const campaignId = item._id.campaign.toString();
      const status = item._id.status;

      if (!summaryMap[campaignId]) {
        summaryMap[campaignId] = {
          total: 0,
          pending: 0,
          complete: 0,
          reject: 0,
          holding: 0,
          notConnected: 0,
        };
      }

      // Total
      summaryMap[campaignId].total += item.count;

      // Pending
      if (status === "Pending") {
        summaryMap[campaignId].pending += item.count;
      }

      // Complete
      if (status === "Complete") {
        summaryMap[campaignId].complete += item.count;
      }

      // Reject
      if (status === "Reject") {
        summaryMap[campaignId].reject += item.count;
      }

      // Holding
      if (status === "Holding") {
        summaryMap[campaignId].holding += item.count;
      }

      // Not Connected
      if (status === "Not Connected") {
        summaryMap[campaignId].notConnected += item.count;
      }
    });

    // =========================
    // COMBINE CAMPAIGNS + COUNTS
    // =========================

    const data = campaigns.map((campaign) => {
      const campaignId = campaign._id.toString();

      const counts = summaryMap[campaignId] || {
        total: 0,
        pending: 0,
        complete: 0,
        reject: 0,
        holding: 0,
        notConnected: 0,
      };

      return {
        campaignId: campaign._id,

        campaignName: campaign.title,

        totalLeads: counts.total,

        statusCount: {
          pending: counts.pending,
          complete: counts.complete,
          reject: counts.reject,
          holding: counts.holding,
          notConnected: counts.notConnected,
        },
      };
    });

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,

      message: "Campaign lead summary fetched successfully",

      role,

      count: data.length,

      data,
    });

  } catch (error) {
    console.error("CAMPAIGN LEAD SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getUserLeadSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    console.log("🔥 USER LEAD SUMMARY HIT");
    console.log("User ID:", userId);
    console.log("Role:", role);

    // =====================================
    // USER FILTER
    // =====================================

    let leadMatch = {};

    if (role === "admin" || role === "superadmin") {
      // Admin -> all leads
      leadMatch = {};
    } else if (
      role === "tc" ||
      role === "tl" ||
      role === "manager"
    ) {
      // User -> only assigned leads
      leadMatch = {
        assignedTo: new mongoose.Types.ObjectId(userId),
      };
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view summary",
      });
    }

    // =====================================
    // TOTAL CAMPAIGNS
    // =====================================

    const totalCampaigns = await Campaign.countDocuments();

    // =====================================
    // OVERALL SUMMARY
    // =====================================

    const overallSummary = await Lead.aggregate([
      {
        $match: leadMatch,
      },
      {
        $group: {
          _id: null,

          totalLeads: {
            $sum: 1,
          },

          totalPending: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Pending"] },
                1,
                0,
              ],
            },
          },

          totalComplete: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Complete"] },
                1,
                0,
              ],
            },
          },

          totalReject: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Reject"] },
                1,
                0,
              ],
            },
          },

          totalHolding: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Holding"] },
                1,
                0,
              ],
            },
          },

          totalNotConnected: {
            $sum: {
              $cond: [
                { $eq: ["$status", "Not Connected"] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // =====================================
    // DEFAULT OVERALL
    // =====================================

    const overall = overallSummary[0] || {
      totalLeads: 0,
      totalPending: 0,
      totalComplete: 0,
      totalReject: 0,
      totalHolding: 0,
      totalNotConnected: 0,
    };

    // =====================================
    // CAMPAIGN-WISE SUMMARY
    // =====================================

    const campaignSummary = await Lead.aggregate([
      {
        $match: leadMatch,
      },

      {
        $group: {
          _id: {
            campaign: "$campaign",
            status: "$status",
          },

          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // =====================================
    // CREATE CAMPAIGN MAP
    // =====================================

    const summaryMap = {};

    campaignSummary.forEach((item) => {
      const campaignId = item._id.campaign.toString();
      const status = item._id.status;

      if (!summaryMap[campaignId]) {
        summaryMap[campaignId] = {
          totalLeads: 0,
          pending: 0,
          complete: 0,
          reject: 0,
          holding: 0,
          notConnected: 0,
        };
      }

      summaryMap[campaignId].totalLeads += item.count;

      if (status === "Pending") {
        summaryMap[campaignId].pending += item.count;
      }

      if (status === "Complete") {
        summaryMap[campaignId].complete += item.count;
      }

      if (status === "Reject") {
        summaryMap[campaignId].reject += item.count;
      }

      if (status === "Holding") {
        summaryMap[campaignId].holding += item.count;
      }

      if (status === "Not Connected") {
        summaryMap[campaignId].notConnected += item.count;
      }
    });

    // =====================================
    // GET CAMPAIGNS
    // =====================================

    const campaigns = await Campaign.find()
      .select("_id title")
      .sort({ createdAt: -1 });

    // =====================================
    // CAMPAIGN-WISE RESPONSE
    // =====================================

    const campaignWiseSummary = campaigns.map((campaign) => {
      const campaignId = campaign._id.toString();

      const counts = summaryMap[campaignId] || {
        totalLeads: 0,
        pending: 0,
        complete: 0,
        reject: 0,
        holding: 0,
        notConnected: 0,
      };

      return {
        campaignId: campaign._id,
        campaignName: campaign.title,

        totalLeads: counts.totalLeads,

        statusCount: {
          pending: counts.pending,
          complete: counts.complete,
          reject: counts.reject,
          holding: counts.holding,
          notConnected: counts.notConnected,
        },
      };
    });

    // =====================================
    // RESPONSE
    // =====================================

    return res.status(200).json({
      success: true,

      message: "User lead summary fetched successfully",

      user: {
        userId,
        role,
      },

      summary: {
        totalCampaigns,

        totalLeads: overall.totalLeads,

        totalPending: overall.totalPending,

        totalComplete: overall.totalComplete,

        totalReject: overall.totalReject,

        totalHolding: overall.totalHolding,

        totalNotConnected: overall.totalNotConnected,
      },

      campaignWiseSummary,
    });

  } catch (error) {
    console.error("USER LEAD SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};