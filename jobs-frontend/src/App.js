import { useEffect, useState } from "react";

const VERTICALS = [
  "All",
  "Data Science",
  "Product Management",
  "CyberSecurity",
  "HR",
  "Project Management",
  "OSCM"
];

function timeAgo(date) {
  const hours = Math.floor((Date.now() - new Date(date)) / 36e5);
  return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
}

function JobsPage({ region }) {
  const [jobs, setJobs] = useState([]);
  const [vertical, setVertical] = useState("All");

  useEffect(() => {
    const v =
      vertical === "All"
        ? ""
        : `?vertical=${encodeURIComponent(vertical)}`;

    fetch(`http://localhost:5000/api/jobs/${region}${v}`)
      .then(res => res.json())
      .then(data => setJobs(data));
  }, [region, vertical]);

  return (
    <div style={styles.page}>
      <h1>{region === "india" ? "India Jobs" : "Global Jobs"}</h1>

      {/* Region Tabs */}
      <div style={styles.tabs}>
        <a href="/" style={region === "india" ? styles.activeTab : styles.tab}>
          India
        </a>
        <a
          href="/global"
          style={region === "global" ? styles.activeTab : styles.tab}
        >
          Global
        </a>
      </div>

      {/* Vertical Tabs */}
      <div style={styles.verticalTabs}>
        {VERTICALS.map(v => (
          <button
            key={v}
            onClick={() => setVertical(v)}
            style={v === vertical ? styles.activeButton : styles.button}
          >
            {v}
          </button>
        ))}
      </div>

      {jobs.map((job, i) => (
        <div key={i} style={styles.card}>
          <h2>{job.title}</h2>
          <p>
            {job.company} • {job.location || "Location not specified"}
          </p>
          <p style={styles.meta}>
            {job.vertical} • Discovered {timeAgo(job.fetched_at)}
          </p>
          <a
            href={job.job_link}
            target="_blank"
            rel="noreferrer"
            style={styles.apply}
          >
            Apply
          </a>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return window.location.pathname === "/global" ? (
    <JobsPage region="global" />
  ) : (
    <JobsPage region="india" />
  );
}

const styles = {
  page: { padding: 40, background: "#fff", color: "#111" },
  tabs: { display: "flex", gap: 20, marginBottom: 20 },
  tab: { color: "#1F3C88", textDecoration: "none" },
  activeTab: {
    color: "#1F3C88",
    fontWeight: "bold",
    textDecoration: "underline"
  },
  verticalTabs: {
    display: "flex",
    gap: 10,
    marginBottom: 30,
    flexWrap: "wrap"
  },
  button: {
    border: "1px solid #1F3C88",
    background: "#fff",
    color: "#1F3C88",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer"
  },
  activeButton: {
    background: "#1F3C88",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer"
  },
  card: {
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20
  },
  meta: { color: "#555", fontSize: 14 },
  apply: {
    display: "inline-block",
    marginTop: 10,
    background: "#1F3C88",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 6,
    textDecoration: "none"
  }
};