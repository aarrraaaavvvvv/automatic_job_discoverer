const express = require("express");
const router = express.Router();

const { runGreenhouseIngestion } = require("../services/sources/greenhouse");

// health check
router.get("/ping", (req, res) => {
  res.send("scrape routes alive");
});

// greenhouse ingestion
router.get("/greenhouse", async (req, res) => {
  try {
    await runGreenhouseIngestion();
    res.send("✅ Greenhouse ingestion executed. Check terminal + DB.");
  } catch (err) {
    console.error("❌ Greenhouse route error:", err);
    res.status(500).send("❌ Greenhouse ingestion crashed. See terminal.");
  }
});

module.exports = router;