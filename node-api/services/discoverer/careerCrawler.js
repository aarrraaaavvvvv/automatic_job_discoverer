// node-api/services/discoverer/careerCrawler.js

const cheerio = require("cheerio");

function extractJobLinks(html, baseUrl) {

  const $ = cheerio.load(html);
  const links = new Set();

  $("a").each((i, el) => {

    const href = $(el).attr("href");
    const text = $(el).text();

    if (!href) return;

    const jobPattern = /(job|career|opening|position)/i;

    if (jobPattern.test(href) || jobPattern.test(text)) {

      try {

        const absolute = new URL(href, baseUrl).href;

        if (absolute.length < 200) {
          links.add(absolute);
        }

      } catch (e) {}

    }

  });

  return Array.from(links).slice(0, 20);
}

module.exports = extractJobLinks;