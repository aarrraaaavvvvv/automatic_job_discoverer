// node-api/services/discoverer/ats/lever.js
const axios = require("axios");
const { URL } = require("url");

/**
 * Lever postings API:
 *  https://api.lever.co/v0/postings/{company}?limit=50
 *
 * For job URLs like https://jobs.lever.co/{company}/{id}
 */

function extractCompanySlug(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    // lever pattern: /{company}/{role-slug}
    if (parts.length >= 1) return parts[0];
    return null;
  } catch (e) {
    return null;
  }
}

async function fetchCompanyPostings(slug, limit = 100) {
  try {
    const api = `https://api.lever.co/v0/postings/${slug}`;
    const res = await axios.get(api, { params: { limit }, timeout: 12000 });
    return res.data || [];
  } catch (e) {
    return null;
  }
}

function normalizeLeverJob(job) {
  return {
    title: job.text || job.title || job.position || job.role || "Unknown",
    company: (job.company || (job.hostedUrl && new URL(job.hostedUrl).hostname) || "Unknown"),
    location: job.categories && job.categories.location ? job.categories.location : (job.location || "India"),
    job_link: job.hostedUrl || job.applyUrl || job.applyUrl?.url || ""
  };
}

async function getJobsForCompany(slug) {
  const postings = await fetchCompanyPostings(slug, 200);
  if (!postings) return [];
  return postings.map(normalizeLeverJob);
}

async function getJobFromUrl(url) {
  const slug = extractCompanySlug(url);
  if (!slug) return null;
  const postings = await fetchCompanyPostings(slug, 200);
  if (!postings) return null;

  // match either hostedUrl or id in URL
  const found = postings.find(p => {
    if (p.hostedUrl && url.includes(p.hostedUrl)) return true;
    if (p.hostedUrl && p.hostedUrl === url) return true;
    if (p.id && url.includes(p.id)) return true;
    // hostedUrl may be fully qualified, try path match
    try {
      const u = new URL(url);
      const h = new URL(p.hostedUrl);
      if (h.pathname === u.pathname) return true;
    } catch (e) {}
    return false;
  });

  if (found) return normalizeLeverJob(found);
  return null;
}

module.exports = {
  extractCompanySlug,
  getJobsForCompany,
  getJobFromUrl
};