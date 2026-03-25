const ALLOWED_DOMAINS = [
  "boards.greenhouse.io",
  "jobs.lever.co",
  "myworkdayjobs.com",
  "workday.com",
  "careers.google.com",
  "careers.microsoft.com",
  "careers.amazon.com"
];

function isAllowedJobPage(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(d => host.includes(d));
  } catch {
    return false;
  }
}
// services/googleJobs.service.js
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../config/db");

console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "LOADED" : "MISSING");

/**
 * Extract JobPosting JSON-LD from a page
 */
function extractJobPosting(html, pageUrl) {
  const $ = cheerio.load(html);

  let job = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      const items = Array.isArray(json) ? json : [json];

      for (const item of items) {
        if (item["@type"] === "JobPosting") {
          job = {
            title: item.title || null,
            company: item.hiringOrganization?.name || null,
            location:
              item.jobLocation?.address?.addressLocality ||
              item.jobLocation?.address?.addressRegion ||
              null,
            posted_at: item.datePosted || null,
            apply_url: item.url || pageUrl,
            source: "google_jobs_index"
          };
          return false; // break
        }
      }
    } catch (e) {}
  });

  return job;
}

/**
 * Fetch a job page and store job if JobPosting exists
 */
async function ingestJobFromUrl(jobUrl) {
  try {
    const res = await axios.get(jobUrl, {
        timeout: 15000,
        headers: {
            "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive"
        },
        validateStatus: status => status < 500 // 👈 IMPORTANT
    });

    const job = extractJobPosting(res.data, jobUrl);
    if (!job || !job.title || !job.company) {
      console.log("No JobPosting found:", jobUrl);
      return;
    }

    const query = `
      INSERT IGNORE INTO jobs
      (title, company, category, job_link, source)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      job.title,
      job.company,
      null,                 // category later
      job.apply_url,
      job.source
    ]);

    console.log("Inserted:", job.title, "-", job.company);
  } catch (err) {
    console.error("Failed:", jobUrl);
  }
  if (res.status === 403) {
  console.log("403 blocked, skipping:", jobUrl);
  return;
}
}

// services/googleJobs.service.js
// (paste this BEFORE module.exports)

// paste this BEFORE module.exports in services/googleJobs.service.js
async function discoverAndIngestFromGoogle(query) {
  if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CX) {
    console.warn("Missing GOOGLE_API_KEY or GOOGLE_CX in .env");
    return;
  }

  const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query
  )}&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}`;

  try {
    const searchRes = await axios.get(searchUrl, { timeout: 15000, validateStatus: s => s < 500 });
    if (searchRes.data && searchRes.data.error) {
      console.error("Google API error:", JSON.stringify(searchRes.data.error, null, 2));
      return;
    }

    const items = searchRes.data.items || [];
    console.log(`Google search returned ${items.length} items for q="${query}"`);

    for (const item of items) {
      try {
        console.log("-> Candidate URL:", item.link);

        // Try to parse hostname
        let hostname = "";
        try { hostname = new URL(item.link).hostname; } catch (e) { /* ignore */ }
        console.log("   host:", hostname || "(invalid URL)");

        // Simple allowlist check (adjust as needed)
        if (!isAllowedJobPage(item.link)) {
          console.log("   skipping (not allowed domain)");
          continue;
        }

        // Probe the page (call with friendly browser headers but don't throw on 4xx)
        let probe;
        try {
          probe = await axios.get(item.link, {
            timeout: 12000,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              Connection: "keep-alive"
            },
            validateStatus: (s) => true // never throw; we will handle status below
          });
        } catch (probeErr) {
          console.error("   probe error (network/timeout):", probeErr.message);
          continue;
        }

        console.log("   probe status:", probe.status);

        if (probe.status === 403) {
          console.log("   403 from target page — skipping (likely protected)");
          continue;
        }
        if (probe.status >= 400) {
          console.log("   non-200 (skipping):", probe.status);
          continue;
        }

        // If probe succeeded, call ingest (which will fetch and parse fully)
        try {
          await ingestJobFromUrl(item.link);
        } catch (ingestErr) {
          console.error("   ingestJobFromUrl failed:", ingestErr?.message || ingestErr);
        }

        // be polite
        await new Promise((r) => setTimeout(r, 700));
      } catch (outer) {
        console.error("Unexpected error for item:", item.link, outer?.message || outer);
      }
    }

    console.log(`discoverAndIngestFromGoogle: finished processing ${items.length} items.`);
  } catch (err) {
    console.error("Error calling Google Custom Search:", err?.message || err);
    if (err.response) {
      console.error("Google error status/data:", err.response.status, err.response.data);
    }
    throw err;
  }
}

module.exports = {
  ingestJobFromUrl,
  discoverAndIngestFromGoogle
};