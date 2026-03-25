// node-api/services/discoverer/searchFetcher.js
require("dotenv").config();
const axios = require("axios");

const SERP_API_KEY = process.env.SERP_API_KEY;
if (!SERP_API_KEY) {
  console.error("SERP_API_KEY missing from .env");
}

async function fetchSearchResults(query, maxResults = 50) {
  try {
    const pageSize = 10;
    const urls = new Set();

    for (let start = 0; start < maxResults; start += pageSize) {
      const params = {
        engine: "google",
        q: query,
        api_key: SERP_API_KEY,
        num: pageSize,
        start,
        gl: "in", // India
        hl: "en"
      };

      const response = await axios.get("https://serpapi.com/search.json", {
        params,
        timeout: 15000
      });

      const results = response.data.organic_results || [];
      if (!results.length) break;

      for (const r of results) {
        if (r.link) urls.add(r.link);
        // also consider 'inline_links' or 'rich_snippet' if present
        if (r.rich_snippet && r.rich_snippet.top && r.rich_snippet.top.link) {
          urls.add(r.rich_snippet.top.link);
        }
      }

      // polite delay
      await new Promise(res => setTimeout(res, 250));
    }

    return Array.from(urls);
  } catch (err) {
    console.error("Search fetch error:", (err && err.message) || err);
    return [];
  }
}

module.exports = fetchSearchResults;