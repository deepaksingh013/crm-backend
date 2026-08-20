import Lead from "../model/Lead.js";
import User from "../model/User.js";

export const assignLeads = async (req, res) => {
    try {
        const { leadIds, assignedTo } = req.body;

        // =========================================
        // VALIDATION
        // =========================================

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "leadIds must be a non-empty array",
            });
        }

        if (!assignedTo) {
            return res.status(400).json({
                success: false,
                message: "assignedTo is required",
            });
        }

        // =========================================
        // LOGGED-IN USER
        // =========================================

        const assignedBy = req.user.userId;
        const currentUserRole = req.user.role;

        // =========================================
        // CHECK TARGET USER
        // =========================================

        const targetUser = await User.findById(assignedTo);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "Target user not found",
            });
        }

        // =========================================
        // TARGET USER ACTIVE CHECK
        // =========================================

        if (!targetUser.isActive) {
            return res.status(400).json({
                success: false,
                message: "Target user is inactive",
            });
        }

        // =========================================
        // ROLE HIERARCHY
        // =========================================
        //
        // Admin    → Manager / TL / TC
        // Manager  → TL / TC
        // TL       → TC
        // TC       → Nobody
        //

        const allowedAssignments = {
            admin: ["manager", "tl", "tc"],
            manager: ["tl", "tc"],
            tl: ["tc"],
            tc: [],
        };

        const allowedRoles = allowedAssignments[currentUserRole] || [];

        if (!allowedRoles.includes(targetUser.role)) {
            return res.status(403).json({
                success: false,
                message: `${currentUserRole} cannot assign leads to ${targetUser.role}`,
            });
        }

        // =========================================
        // FIND LEADS
        // =========================================

        const leads = await Lead.find({
            _id: {
                $in: leadIds,
            },
        });

        if (!leads.length) {
            return res.status(404).json({
                success: false,
                message: "No leads found",
            });
        }

        // =========================================
        // CHECK ALL LEAD IDS
        // =========================================

        const foundLeadIds = leads.map((lead) =>
            lead._id.toString()
        );

        const notFoundLeadIds = leadIds.filter(
            (id) => !foundLeadIds.includes(id.toString())
        );

        // =========================================
        // ASSIGN LEADS
        // =========================================

        const result = await Lead.updateMany(
            {
                _id: {
                    $in: foundLeadIds,
                },
            },
            {
                $set: {
                    assignedTo: targetUser._id,
                    assignedBy: assignedBy,

                    // Fresh leads for new assignee
                    status: "New",
                },
            }
        );

        // =========================================
        // RESPONSE
        // =========================================

        return res.status(200).json({
            success: true,

            message: "Leads assigned successfully",

            assignedBy: {
                id: assignedBy,
                role: currentUserRole,
            },

            assignedTo: {
                id: targetUser._id,
                name: targetUser.name,
                email: targetUser.email,
                role: targetUser.role,
            },

            requestedLeads: leadIds.length,

            assignedLeads: result.modifiedCount,

            notFoundLeads: notFoundLeadIds,

            status: "New",
        });

    } catch (error) {
        console.error("Assign Leads Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};