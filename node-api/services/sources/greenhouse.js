// services/sources/greenhouse.js

const axios = require("axios");
const db = require("../../config/db");

async function ingestGreenhouseSource(source) {
  const companySlug = source.source_url
    .replace("https://boards.greenhouse.io/", "")
    .replace("/", "");

  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs`;

  console.log("\n🔍 Fetching Greenhouse API:", apiUrl);

  const res = await axios.get(apiUrl, {
    timeout: 15000,
    validateStatus: () => true
  });

  if (res.status !== 200) {
    console.error(`❌ HTTP ${res.status} for ${apiUrl}`);
    return;
  }

  const jobs = res.data.jobs || [];

  if (jobs.length === 0) {
    console.warn(`⚠️ No jobs found for ${source.company_name}`);
    return;
  }

  console.log(`✅ Found ${jobs.length} jobs for ${source.company_name}`);

  for (const job of jobs) {
    const title = job.title || null;
    const company = source.company_name;
    const location = job.location?.name || null;
    const jobLink = job.absolute_url || null;
    const atsJobId = String(job.id);
    const postedAt = job.updated_at ? new Date(job.updated_at) : null;

    try {
      await db.query(
        `
        INSERT IGNORE INTO jobs
        (
          title,
          company,
          location,
          category,
          job_link,
          ats_job_id,
          posted_at,
          fetched_at,
          raw_payload,
          source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `,
        [
          title,
          company,
          location,
          null,
          jobLink,
          atsJobId,
          postedAt,
          JSON.stringify(job),
          "automation"
        ]
      );

      console.log("🟢 Inserted:", title);
    } catch (err) {
      console.error("❌ DB insert failed:", title, err.message);
    }
  }
}

async function runGreenhouseIngestion() {
  console.log("\n🚀 Starting Greenhouse ingestion…");

  const [sources] = await db.query(
    "SELECT * FROM job_sources WHERE active = 1 AND source_type = 'greenhouse'"
  );

  if (sources.length === 0) {
    console.error("❌ No Greenhouse sources found");
    return;
  }

  for (const source of sources) {
    await ingestGreenhouseSource(source);
  }

  console.log("✅ Greenhouse ingestion finished");
}

module.exports = { runGreenhouseIngestion };