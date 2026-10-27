const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

const allowedStatuses = [
  "New",
  "Contacted",
  "Follow-up",
  "Converted",
  "Lost",
];

const allowedPriorities = ["Low", "Medium", "High"];

function normalizeLead(body = {}) {
  const {
    customerName,
    companyName = "",
    phone,
    email = "",
    source = "Direct",
    requirement,
    budget = "",
    followUpDate = null,
    priority = "Medium",
    status = "New",
  } = body;

  if (
    typeof customerName !== "string" ||
    !customerName.trim()
  ) {
    throw new Error("Customer name is required.");
  }

  if (
    typeof phone !== "string" ||
    !phone.trim()
  ) {
    throw new Error("Phone number is required.");
  }

  if (
    typeof requirement !== "string" ||
    !requirement.trim()
  ) {
    throw new Error("Project requirement is required.");
  }

  if (
    typeof companyName !== "string" ||
    typeof email !== "string" ||
    typeof source !== "string" ||
    typeof budget !== "string" ||
    typeof priority !== "string" ||
    typeof status !== "string"
  ) {
    throw new Error("Invalid lead field values.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid lead status.");
  }

  if (!allowedPriorities.includes(priority)) {
    throw new Error("Invalid lead priority.");
  }

  let parsedFollowUpDate = null;

  if (followUpDate !== null && followUpDate !== "") {
    if (
      typeof followUpDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(followUpDate)
    ) {
      throw new Error("Follow-up date must use YYYY-MM-DD.");
    }

    const date = new Date(`${followUpDate}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== followUpDate
    ) {
      throw new Error("Invalid follow-up date.");
    }

    parsedFollowUpDate = date;
  }

  return {
    customerName: customerName.trim(),
    companyName: companyName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    source: source.trim() || "Direct",
    requirement: requirement.trim(),
    budget: budget.trim(),
    followUpDate: parsedFollowUpDate,
    priority,
    status,
  };
}

// READ: Get all leads
router.get("/", async (req, res) => {
  try {
    const leads = await prisma.leadEnquiry.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, leads });
  } catch (error) {
    console.error("Fetch leads error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads.",
    });
  }
});

// READ: Get one lead
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const lead = await prisma.leadEnquiry.findUnique({
      where: { id },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    res.json({ success: true, lead });
  } catch (error) {
    console.error("Fetch lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lead.",
    });
  }
});

// CREATE: Add lead
router.post("/", async (req, res) => {
  try {
    const payload = normalizeLead(req.body);

    const lead = await prisma.leadEnquiry.create({
      data: payload,
    });

    res.status(201).json({
      success: true,
      message: "Lead created successfully.",
      lead,
    });
  } catch (error) {
    console.error("Create lead error:", error);

    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create lead.",
    });
  }
});

// UPDATE: Update lead
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const payload = normalizeLead(req.body);

    const existing = await prisma.leadEnquiry.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    const lead = await prisma.leadEnquiry.update({
      where: { id },
      data: payload,
    });

    res.json({
      success: true,
      message: "Lead updated successfully.",
      lead,
    });
  } catch (error) {
    console.error("Update lead error:", error);

    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update lead.",
    });
  }
});

// DELETE: Delete lead from PostgreSQL
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const existing = await prisma.leadEnquiry.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    await prisma.leadEnquiry.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Lead deleted successfully.",
    });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete lead.",
    });
  }
});

module.exports = router;