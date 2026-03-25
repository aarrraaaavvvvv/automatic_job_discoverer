// node-api/services/discoverer/atsDetector.js

function detectATS(url) {

  const u = url.toLowerCase();

  if (u.includes("greenhouse")) return "greenhouse";
  if (u.includes("lever.co")) return "lever";
  if (u.includes("smartrecruiters")) return "smartrecruiters";
  if (u.includes("workday")) return "workday";
  if (u.includes("oraclecloud")) return "oracle";

  return null;
}

module.exports = detectATS;