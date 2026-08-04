import express from "express"
import {
  getAvailability,
  updateTimezone,
  updateWeeklySchedule,
  toggleWeekday,
  addOrUpdatePeriod,
  deletePeriod,
  copySchedule,
  addOrUpdateDateOverride,
  deleteDateOverride,
  updateBookingRules,
} from "../controllers/availability.controller.js"

const router = express.Router()

router.get("/counsellor/:counsellorId", getAvailability)
router.patch("/counsellor/:counsellorId/timezone", updateTimezone)
router.put("/counsellor/:counsellorId/weekly-schedule", updateWeeklySchedule)
router.patch("/counsellor/:counsellorId/weekday/:weekday", toggleWeekday)
router.post("/counsellor/:counsellorId/periods/:weekday", addOrUpdatePeriod)
router.put("/counsellor/:counsellorId/periods/:weekday/:periodId", addOrUpdatePeriod)
router.delete("/counsellor/:counsellorId/periods/:weekday/:periodId", deletePeriod)
router.post("/counsellor/:counsellorId/copy-schedule", copySchedule)
router.post("/counsellor/:counsellorId/date-overrides", addOrUpdateDateOverride)
router.put("/counsellor/:counsellorId/date-overrides/:overrideId", addOrUpdateDateOverride)
router.delete("/counsellor/:counsellorId/date-overrides/:overrideId", deleteDateOverride)
router.patch("/counsellor/:counsellorId/booking-rules", updateBookingRules)

export default router
