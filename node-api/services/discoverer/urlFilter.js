// node-api/services/discoverer/urlFilter.js

const blockedDomains = [
  "linkedin.com",
  "indeed.com",
  "naukri.com",
  "glassdoor",
  "wellfound",
  "mployee",
  "devjobsscanner",
  "monsterindia",
  "timesjobs",
  "quora.com",
  "kaggle.com",
  "youtube.com",
  "instagram.com",
  "reddit.com"
];

// regex that indicates an individual job page or careers page
const jobPathRegex = /(\/jobs?\/|\bcareers?\b|\/openings?\/|\/positions?\/|\/apply\b|\/job-|\bjob-details\b|\/job\?id=|\/career\/|\/careers\/|\/vacancies\/|\/positions\/|\/postings\/|boards\.greenhouse\.io|jobs\.lever\.co|workday|smartrecruiters|jobs\.workable\.com)/i;

function filterUrls(urls) {
  const out = new Set();

  for (const raw of urls) {
    if (!raw || typeof raw !== "string") continue;

    const url = raw.trim();

    // skip obvious search or tracking pages
    if (url.startsWith("https://www.google.com/") || url.startsWith("https://webcache.googleusercontent.com/")) continue;
    if (url.includes("javascript:")) continue;

    // skip very long query URLs (probably search filters)
    if (url.length > 400) continue;

    // block aggregator domains
    if (blockedDomains.some(d => url.includes(d))) {
      // still allow certain ATS on aggregator hosts (rare) - but keep simple: skip aggregators
      continue;
    }

    // require job-like path / careers / boards.greenhouse.io / jobs.lever.co etc
    if (!jobPathRegex.test(url)) continue;

    out.add(url);
  }

  return Array.from(out);
}

module.exports = filterUrls;