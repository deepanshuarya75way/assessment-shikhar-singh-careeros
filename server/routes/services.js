import express from "express"
import mongoose from "mongoose"
import Service from "../models/Service.js"
import { getAvailableDatesController, getAvailableSlotsController } from "../controllers/availability.controller.js"

const router = express.Router()

router.post("/", async (req, res) => {
  try {
    const {
      counsellorId,
      title,
      category,
      description,
      topics = [],
      mode = "video",
      duration = 45,
      price = 0,
      status = true,
    } = req.body

    if (!counsellorId || !title || !category || !description) {
      return res.status(400).json({ error: "Missing required service fields" })
    }

    const service = await Service.create({
      counsellorId: new mongoose.Types.ObjectId(counsellorId),
      title,
      category,
      description,
      topics,
      mode,
      duration,
      price,
      status,
    })

    return res.status(201).json({
      message: "Service created successfully",
      service,
    })
  } catch (error) {
    console.error("Create service error:", error)
    return res.status(500).json({ error: "Failed to create service" })
  }
})

router.get("/counsellor/:counsellorId", async (req, res) => {
  try {
    const { counsellorId } = req.params
    const { activeOnly } = req.query

    const query = {
      counsellorId: new mongoose.Types.ObjectId(counsellorId),
    }

    if (activeOnly === "true") {
      query.status = true
    }

    const services = await Service.find(query).sort({ createdAt: -1 })

    return res.json(services)
  } catch (error) {
    console.error("Fetch counsellor services error:", error)
    return res.status(500).json({ error: "Failed to fetch services" })
  }
})

router.get("/:serviceId/available-dates", getAvailableDatesController)
router.get("/:serviceId/available-slots", getAvailableSlotsController)

router.get("/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ error: "Invalid service id" })
    }

    const service = await Service.findById(serviceId)

    if (!service) {
      return res.status(404).json({ error: "Service not found" })
    }

    return res.json(service)
  } catch (error) {
    console.error("Fetch service error:", error)
    return res.status(500).json({ error: "Failed to fetch service" })
  }
})

export default router
