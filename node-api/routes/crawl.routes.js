const express = require("express");
const router = express.Router();
const { crawlAllSources } = require("../services/careerCrawler.service");

router.get("/", async (req, res) => {
  const jobs = await crawlAllSources();
  res.json(jobs);
});

module.exports = router;