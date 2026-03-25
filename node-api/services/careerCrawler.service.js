const axios = require("axios");
const cheerio = require("cheerio");
const sources = require("./careerSources");
const categories = require("./jobCategories");

function detectCategory(title) {
  const t = title.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => t.includes(k))) {
      return category;
    }
  }
  return null;
}

async function crawlCareerPage(source) {
  console.log(`🔍 Crawling ${source.company}`);

  const jobs = [];

  try {
    const res = await axios.get(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(res.data);

    // VERY generic link-based extraction (intentionally)
    $("a").each((_, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr("href");

      if (!title || !href) return;
      if (title.length < 10) return;

      const category = detectCategory(title);
      if (!category) return;

      const link = href.startsWith("http")
        ? href
        : new URL(href, source.url).href;

      jobs.push({
        title,
        company: source.company,
        category,
        job_link: link,
        source: source.company
      });
    });

  } catch (err) {
    console.error(`❌ Failed to crawl ${source.company}`);
  }

  return jobs;
}

async function crawlAllSources() {
  let allJobs = [];

  for (const source of sources) {
    const jobs = await crawlCareerPage(source);
    allJobs = allJobs.concat(jobs);
  }

  return allJobs;
}

module.exports = { crawlAllSources };