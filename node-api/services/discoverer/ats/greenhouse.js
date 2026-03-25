// node-api/services/discoverer/ats/greenhouse.js
const axios = require("axios");
const { URL } = require("url");

/**
 * Greenhouse job data available at:
 *  https://boards.greenhouse.io/<company>.json
 *
 * This module:
 * - extract company slug from a job or company URL
 * - fetch company JSON and return jobs or a single job
 */

function extractCompanySlug(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    // typical greenhouse job URL: /<company>/jobs/<id> or /<company>/career/<id>
    // sometimes the hostname is boards.greenhouse.io and first path segment is company slug
    if (parts.length >= 1) return parts[0];
    return null;
  } catch (e) {
    return null;
  }
}

async function fetchCompanyJson(slug) {
  try {
    const url = `https://boards.greenhouse.io/${slug}.json`;
    const res = await axios.get(url, { timeout: 10000 });
    return res.data;
  } catch (e) {
    return null;
  }
}

function normalizeGreenhouseJob(job, baseUrl) {
  return {
    title: job.title || job.name || "Unknown",
    company: job.company || job.location || (job.metadata && job.metadata.company) || (baseUrl ? new URL(baseUrl).hostname.replace(/^www\./, "") : "Unknown"),
    location: job.location && job.location.name ? job.location.name : (job.location || "India"),
    job_link: job.absolute_url || job.apply_url || (baseUrl || "")
  };
}

async function getJobsForCompany(slug) {
  const json = await fetchCompanyJson(slug);
  if (!json || !json.jobs) return [];
  return json.jobs.map(j => normalizeGreenhouseJob(j, `https://boards.greenhouse.io/${slug}`));
}

// If given a specific greenhouse job URL, find the matching job in the company JSON.
async function getJobFromUrl(url) {
  const company = extractCompanySlug(url);
  if (!company) return null;
  const json = await fetchCompanyJson(company);
  if (!json || !json.jobs) return null;

  const found = json.jobs.find(j => {
    if (!j.absolute_url) return false;
    // compare absolute_url (may be relative in JSON)
    return (j.absolute_url === url) || url.includes(j.id) || (j.absolute_url && url.includes(j.absolute_url));
  });

  if (found) return normalizeGreenhouseJob(found, url);

  // fallback: sometimes absolute_url is '/company/jobs/123' so attempt match by last path segment
  const pathLast = (() => {
    try {
      const p = new URL(url).pathname.split("/").filter(Boolean);
      return p[p.length - 1];
    } catch (e) {
      return null;
    }
  })();

  if (pathLast) {
    const f2 = json.jobs.find(j => j.id && j.id.toString() === pathLast.toString());
    if (f2) return normalizeGreenhouseJob(f2, url);
  }

  return null;
}

module.exports = {
  extractCompanySlug,
  getJobsForCompany,
  getJobFromUrl
};