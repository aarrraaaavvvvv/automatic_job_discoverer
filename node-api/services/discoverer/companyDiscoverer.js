// node-api/services/discoverer/companyDiscoverer.js
// lightweight helper: discover candidate company domains from search results,
// detect if they use a known ATS (greenhouse, lever, workday, etc.)
// You can call this from your main discoverer to harvest many companies.

const fetchSearchResults = require("./searchFetcher");
const axios = require("axios");

const knownAtsSignatures = [
  { name: "greenhouse", pattern: /boards\.greenhouse\.io/ },
  { name: "lever", pattern: /jobs\.lever\.co/ },
  { name: "workday", pattern: /workdayjobs\.com|myworkdayjobs/ },
  { name: "smartrecruiters", pattern: /jobs\.smartrecruiters\.com/ },
  { name: "breezy", pattern: /hire\.breezy\.hr/ }
];

// simple domain extractor
function domainFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch (e) {
    return null;
  }
}

// detect ATS by checking a page's HTML for known patterns
async function detectAtsForUrl(url) {
  try {
    const resp = await axios.get(url, { timeout: 8000 });
    const html = resp.data || "";

    for (const sig of knownAtsSignatures) {
      if (sig.pattern.test(url) || sig.pattern.test(html)) {
        return sig.name;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// discover candidate company career pages using simple queries
async function discoverCompaniesForVertical(verticalQuery, maxCompanies = 50) {
  // verticalQuery example: '"data scientist" "india" careers'
  const urls = await fetchSearchResults(verticalQuery, 50);
  const domains = new Set();

  for (const u of urls) {
    const d = domainFromUrl(u);
    if (d) domains.add(d);
  }

  const domainList = Array.from(domains).slice(0, maxCompanies);
  const companies = [];

  // detect ATS in parallel but limit concurrency lightly
  const concurrency = 5;
  for (let i = 0; i < domainList.length; i += concurrency) {
    const chunk = domainList.slice(i, i + concurrency);
    const jobs = await Promise.all(chunk.map(async domain => {
      const sampleCareerUrl = `https://${domain}/careers`;
      const ats = await detectAtsForUrl(sampleCareerUrl);
      return { domain, ats, sampleCareerUrl };
    }));
    for (const j of jobs) {
      if (j.ats) companies.push(j);
    }
  }

  return companies; // array of { domain, ats, sampleCareerUrl }
}

module.exports = {
  detectAtsForUrl,
  discoverCompaniesForVertical
};