import dotenv from "dotenv"
import mongoose from "mongoose"
import Booking from "../models/Booking.js"
import CounsellorAvailability from "../models/CounsellorAvailability.js"
import CounsellorProfile from "../models/counsellor-profile.js"

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

const run = async () => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required")
  }

  await mongoose.connect(MONGODB_URI)

  const availabilityDocs = await CounsellorAvailability.find({}).lean()
  let updatedCount = 0
  let skippedCount = 0
  let mergedCount = 0
  let legacyOnlyCount = 0

  for (const doc of availabilityDocs) {
    const currentCounsellorId = String(doc.counsellorId)

    const profileByUserId = await CounsellorProfile.findOne({ userId: currentCounsellorId }).lean()
    if (profileByUserId) {
      skippedCount += 1
      continue
    }

    const profileByProfileId = await CounsellorProfile.findById(currentCounsellorId).lean()
    if (!profileByProfileId?.userId) {
      legacyOnlyCount += 1
      skippedCount += 1
      continue
    }

    const targetUserId = String(profileByProfileId.userId)
    const targetDoc = await CounsellorAvailability.findOne({ counsellorId: targetUserId })

    if (targetDoc && String(targetDoc._id) !== String(doc._id)) {
      targetDoc.timezone = doc.timezone
      targetDoc.weeklySchedule = doc.weeklySchedule
      targetDoc.dateOverrides = doc.dateOverrides
      targetDoc.bookingRules = doc.bookingRules
      targetDoc.isActive = doc.isActive
      await targetDoc.save()
      await CounsellorAvailability.deleteOne({ _id: doc._id })
      mergedCount += 1
      continue
    }

    await CounsellorAvailability.updateOne(
      { _id: doc._id },
      { $set: { counsellorId: targetUserId } }
    )
    updatedCount += 1
  }

  const bookingIndexes = await Booking.collection.indexes()
  const legacyIndex = bookingIndexes.find((index) => {
    const keys = index.key || {}
    return (
      index.unique &&
      !index.partialFilterExpression &&
      keys.counsellorId === 1 &&
      keys.scheduledDate === 1 &&
      keys.startTime === 1
    )
  })

  if (legacyIndex?.name) {
    await Booking.collection.dropIndex(legacyIndex.name)
  }

  await Booking.syncIndexes()

  console.log(
    JSON.stringify(
      {
        updatedCount,
        mergedCount,
        legacyOnlyCount,
        skippedCount,
      },
      null,
      2
    )
  )
}

run()
  .catch((error) => {
    console.error("Migration failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
