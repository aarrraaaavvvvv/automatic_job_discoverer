require("dotenv").config();
const express = require("express");
const cors = require("cors");
// init app FIRST
const app = express();
app.use(express.json());
app.use(cors());
// routes
const crawlRoutes = require("./routes/crawl.routes");
app.use("/api/crawl", crawlRoutes);
const scrapeRoutes = require("./routes/scrape.routes");
app.use("/api/scrape", scrapeRoutes);

const jobsRoutes = require("./routes/jobs.routes");
app.use("/api/jobs", jobsRoutes);

const discoverRoutes = require("./routes/discover.routes");
app.use("/api/discover", discoverRoutes);
// start server
app.listen(5000, () => {
  console.log("🚀 Backend running on port 5000");
});