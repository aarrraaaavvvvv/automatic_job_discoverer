const express = require("express");
const router = express.Router();

const runDiscoverer = require("../services/discoverer/discoverer");

router.post("/", async (req, res) => {
  try {
    const inserted = await runDiscoverer();

    res.json({
      success: true,
      inserted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;