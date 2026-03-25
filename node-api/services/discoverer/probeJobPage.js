const axios = require("axios");
const cheerio = require("cheerio");

const extractJobLinks = require("./careerCrawler");
const detectATS = require("./atsDetector");

async function fetchHtml(url) {

  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    },
    timeout: 15000
  });

  return res.data;
}

function extractJSONLD(html, url) {

  const regex = /<script[^>]*application\/ld\+json[^>]*>(.*?)<\/script>/gs;

  const match = regex.exec(html);

  if (!match) return null;

  try {

    const json = JSON.parse(match[1]);

    if (json["@type"] === "JobPosting") {

      return {
        title: json.title,
        company: json.hiringOrganization?.name,
        location: json.jobLocation?.address?.addressLocality || "India",
        job_link: url
      };

    }

  } catch (e) {}

  return null;
}

function extractHTMLJob(html, url) {

  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim();

  if (!title) return null;

  const company =
    $(".company").text() ||
    $("meta[property='og:site_name']").attr("content");

  return {
    title,
    company: company || new URL(url).hostname,
    location: "India",
    job_link: url
  };
}

async function probeJobPage(url) {

  try {

    const ats = detectATS(url);

    if (ats) {
      return null;
    }

    const html = await fetchHtml(url);

    const jsonJob = extractJSONLD(html, url);

    if (jsonJob) return jsonJob;

    const htmlJob = extractHTMLJob(html, url);

    if (htmlJob) return htmlJob;

    const links = extractJobLinks(html, url);

    if (links.length > 0) {

      return links.map(l => ({
        title: "Job",
        company: new URL(l).hostname,
        location: "India",
        job_link: l
      }));

    }

    return null;

  } catch (err) {

    return null;

  }

}

module.exports = probeJobPage;