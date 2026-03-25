const cron = require("node-cron");
const { fetchAndStoreJobs } = require("./jobFetcher.service");

// Every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("⏰ Running scheduled job ingestion");
  await fetchAndStoreJobs();
});

// For dev: run once on startup
fetchAndStoreJobs();
