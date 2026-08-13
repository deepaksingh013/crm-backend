import Campaign from "../model/Campaign.js";

export const createCampaign = async (req, res) => {
 
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Campaign title is required",
      });
    }

    const existingCampaign = await Campaign.findOne({
      title: title.trim(),
    });

    if (existingCampaign) {
      return res.status(409).json({
        success: false,
        message: "Campaign already exists",
      });
    }

    const campaign = await Campaign.create({
      title: title.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign,
    });
  } catch (error) {
    console.error("Create Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getCampaigns = async (req, res) => {
   console.log("hello")
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      campaigns,
    });
  } catch (error) {
    console.error("Get Campaigns Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Campaign title is required",
      });
    }

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    campaign.title = title.trim();

    await campaign.save();

    return res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      campaign,
    });
  } catch (error) {
    console.error("Update Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    campaign.isActive = false;

    await campaign.save();

    return res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
      campaign: {
        id: campaign._id,
        title: campaign.title,
        isActive: campaign.isActive,
      },
    });
  } catch (error) {
    console.error("Delete Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};