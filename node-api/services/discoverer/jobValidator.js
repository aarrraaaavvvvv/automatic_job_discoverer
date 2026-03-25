// node-api/services/discoverer/jobValidator.js

const bannedWords = [
  "see all",
  "career guidance",
  "blog",
  "salary",
  "course",
  "learn",
  "how to",
  "what is",
  "guide",
  "tips",
  "apply now",
  "search jobs",
  "jobs in",
  "job search",
  "all jobs",
  "category"
];

function isValidJob(job) {

  if (!job) return false;

  if (!job.title || job.title.length < 4) return false;

  if (!job.company) return false;

  const title = job.title.toLowerCase();

  for (const word of bannedWords) {
    if (title.includes(word)) return false;
  }

  // reject category style titles
  if (title.endsWith("jobs")) return false;

  return true;
}

module.exports = isValidJob;