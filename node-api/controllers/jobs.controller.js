const db = require("../config/db");

exports.getJobs = (req, res) => {
  const { category } = req.query;

  let sql = "SELECT * FROM jobs ORDER BY created_at DESC";
  let params = [];

  if (category) {
    sql = "SELECT * FROM jobs WHERE category = ? ORDER BY created_at DESC";
    params.push(category);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};
