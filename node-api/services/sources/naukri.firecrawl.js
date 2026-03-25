const Firecrawl = require("firecrawl").default;
const detectCategory = require("../jobCategories");

const app = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY
});

async function fetchNaukriJobsFirecrawl({
  query = "data scientist",
  maxJobs = 30
} = {}) {

  const searchUrl = `https://www.naukri.com/${encodeURIComponent(
    query
  )}-jobs-in-india`;

  console.log(`🔥 Firecrawl scraping (content mode): ${searchUrl}`);

  // 🔥 Firecrawl returns extracted CONTENT, not HTML
  const result = await app.scrape(searchUrl);

  const content =
    typeof result === "string"
      ? result
      : result?.content || result?.data?.content;

  if (!content || typeof content !== "string") {
    console.error("❌ Firecrawl raw response:", result);
    throw new Error("Firecrawl returned no readable content");
  }

  // ✅ Extract job links from TEXT content
  const jobLinkRegex = /https:\/\/www\.naukri\.com\/job-listings[^\s)]+/g;
  const matches = content.match(jobLinkRegex) || [];

  const seen = new Set();
  const jobs = [];

  for (const link of matches) {
    if (seen.has(link)) continue;
    seen.add(link);

    const slug = link.split("/job-listings-")[1] || "";
    const titleGuess = slug
      .split("-")
      .slice(0, 6)
      .join(" ")
      .replace(/\d+/g, "")
      .replace(/in india/i, "")
      .trim();

    const title = titleGuess || "Job Opening";

    jobs.push({
      title,
      company: "Unknown",
      seniority: null,
      category: detectCategory(title) || "Uncategorized",
      job_link: link,
      source: "naukri"
    });

    if (jobs.length >= maxJobs) break;
  }

  console.log(`✅ Extracted ${jobs.length} Naukri jobs`);
  return jobs;
}

module.exports = { fetchNaukriJobsFirecrawl };