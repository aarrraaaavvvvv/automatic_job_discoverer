require("dotenv").config();

const generateQueries = require("./queryGenerator");
const fetchSearchResults = require("./searchFetcher");
const filterUrls = require("./urlFilter");
const probeJobPage = require("./probeJobPage");
const isValidJob = require("./jobValidator");

const db = require("../../config/db");

const TARGET_PER_VERTICAL = parseInt(process.env.TARGET_PER_VERTICAL || "8");

async function insertJobIfNew(job) {

  const sql = `
    INSERT IGNORE INTO jobs
    (title, company, location, job_link, source, fetched_at)
    VALUES (?, ?, ?, ?, 'automation', NOW())
  `;

  try {

    const [result] = await db.execute(sql, [
      job.title,
      job.company,
      job.location,
      job.job_link
    ]);

    if (result.affectedRows > 0) {
      return true;
    }

    return false;

  } catch (err) {

    console.error("DB error:", err.message);
    return false;

  }

}

async function runDiscoverer() {

  console.log("Starting job discovery...");

  const queries = generateQueries();

  const visitedUrls = new Set();
  let totalInserted = 0;

  for (const query of queries) {

    console.log(`\nQuery: ${query}`);

    let insertedForQuery = 0;

    const rawUrls = await fetchSearchResults(query);

    console.log("URLs found:", rawUrls.length);

    const candidateUrls = filterUrls(rawUrls);

    console.log("Candidate URLs after filter:", candidateUrls.length);

    for (const url of candidateUrls) {

      if (insertedForQuery >= TARGET_PER_VERTICAL) {

        console.log(`Target reached for query "${query}" (${TARGET_PER_VERTICAL})`);
        break;

      }

      if (visitedUrls.has(url)) {
        continue;
      }

      visitedUrls.add(url);

      console.log("Checking URL:", url);

      try {

        const result = await probeJobPage(url);

        if (!result) {

          console.log("No job data extracted from URL.");
          continue;

        }

        const jobs = Array.isArray(result) ? result : [result];

        for (const job of jobs) {

          if (!job) continue;

          if (!job.job_link) continue;

          if (!isValidJob(job)) {

            console.log("Rejected invalid job:", job.title);
            continue;

          }

          const inserted = await insertJobIfNew(job);

          if (inserted) {

            console.log("Inserted:", job.title);

            totalInserted++;
            insertedForQuery++;

          }

          if (insertedForQuery >= TARGET_PER_VERTICAL) {
            break;
          }

        }

      } catch (err) {

        console.error("Probe error:", err.message);

      }

    }

    console.log(`Inserted for "${query}":`, insertedForQuery);

  }

  console.log("\nDiscovery finished. Inserted total:", totalInserted);

}

module.exports = runDiscoverer;