const db = require("../../config/db");
const { fetchNaukriJobsFirecrawl } = require("./naukri.firecrawl");

async function runNaukriFirecrawlAndSave(opts = {}) {
  const jobs = await fetchNaukriJobsFirecrawl(opts);

  console.log(`🔥 Firecrawl found ${jobs.length} jobs`);

  let inserted = 0;
  for (const j of jobs) {
    await new Promise((res, rej) => {
      db.query(
        `INSERT IGNORE INTO jobs
         (title, company, seniority, category, job_link, source)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [j.title, j.company, j.seniority, j.category, j.job_link, j.source],
        err => (err ? rej(err) : res())
      );
    });
    inserted++;
  }

  console.log(`✅ Inserted ${inserted} Naukri jobs`);
  return { found: jobs.length, inserted };
}

module.exports = { runNaukriFirecrawlAndSave };