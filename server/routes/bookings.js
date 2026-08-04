import express from "express"
import { createBooking, releaseBooking } from "../controllers/booking.controller.js"

const router = express.Router()

router.post("/create", createBooking)
router.post("/release", releaseBooking)

export default router
