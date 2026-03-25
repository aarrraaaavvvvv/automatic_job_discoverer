const db = require("../config/db");

/**
 * This function represents the job discovery layer.
 * Today: generates realistic job entries (automation proof)
 * Tomorrow: replaced by real web crawling (server-side)
 */

const JOB_TITLES = {
  "Data Science": [
    "Data Scientist",
    "Senior Data Scientist",
    "Machine Learning Engineer",
    "AI Engineer",
    "Data Analyst"
  ],
  "Product Management": [
    "Product Manager",
    "Associate Product Manager",
    "Senior Product Manager"
  ],
  "General Management": [
    "Management Trainee",
    "Business Operations Manager",
    "General Manager"
  ],
  "HR": [
    "HR Business Partner",
    "Talent Acquisition Specialist",
    "HR Manager"
  ],
  "Digital Transformation": [
    "Digital Transformation Consultant",
    "Digital Strategy Manager"
  ],
  "OSCM": [
    "Supply Chain Analyst",
    "Operations Manager",
    "Logistics Manager"
  ],
  "CyberSecurity": [
    "Cyber Security Analyst",
    "Information Security Engineer",
    "SOC Analyst"
  ],
  "Business Management": [
    "Business Analyst",
    "Strategy Manager"
  ],
  "Project Management": [
    "Project Manager",
    "Program Manager",
    "Delivery Manager"
  ]
};

const COMPANIES = [
  "Amazon", "Google", "Microsoft", "Accenture", "Deloitte",
  "PwC", "Infosys", "TCS", "IBM", "EY"
];

function detectSeniority(title) {
  const t = title.toLowerCase();
  if (t.includes("senior")) return "Senior";
  if (t.includes("manager") || t.includes("lead")) return "Mid-Senior";
  return "Mid-Level";
}

function generateJob(category, index) {
  const titles = JOB_TITLES[category];
  const baseTitle = titles[Math.floor(Math.random() * titles.length)];
  const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];

  const uniqueTitle = `${baseTitle} (${index + 1})`;

  return {
    title: uniqueTitle,
    company,
    seniority: detectSeniority(baseTitle),
    category,
    job_link: `https://example.com/jobs/${encodeURIComponent(
      category
    )}/${company}/${Date.now()}-${index}`,
    source: "automation"
  };
}


async function fetchAndStoreJobs() {
  const VERTICALS = Object.keys(JOB_TITLES);
  const TARGET = 18;

  for (const category of VERTICALS) {
    for (let i = 0; i < TARGET; i++) {
  const job = generateJob(category, i);


      db.query(
        `INSERT IGNORE INTO jobs 
         (title, company, seniority, category, job_link, source)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          job.title,
          job.company,
          job.seniority,
          job.category,
          job.job_link,
          job.source
        ]
      );
    }
  }

  console.log("✅ Job automation run completed");
}

module.exports = { fetchAndStoreJobs };
