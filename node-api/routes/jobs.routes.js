// node-api/routes/jobs.js

const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET all jobs
router.get("/", async (req, res) => {
  try {

    const [rows] = await db.execute(`
      SELECT
        id,
        title,
        company,
        location,
        job_link,
        source,
        fetched_at
      FROM jobs
      ORDER BY fetched_at DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;