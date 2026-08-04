import express from "express"
import { createOrder, verifyPayment } from "../controllers/payments.controller.js"

const router = express.Router()

router.post("/create-order", createOrder)
router.post("/verify", verifyPayment)

export default router
