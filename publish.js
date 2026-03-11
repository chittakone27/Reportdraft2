require("dotenv/config");
const fetch = require("node-fetch");
const btoa = require("btoa");
const fs = require("fs");
const { VITE_BASE_URL, VITE_USERNAME, VITE_PASSWORD, VITE_REPORT_ID } = process.env;

fs.readFile("./dist/index.html", "utf8", async (err, data) => {
  const response = await fetch(`${VITE_BASE_URL}/api/reports/${VITE_REPORT_ID}`, {
    headers: {
      Authorization: `Basic ${btoa(VITE_USERNAME + ":" + VITE_PASSWORD)}`
    }
  });
  const report = await response.json();
  report.designContent = `${data}`;
  const result = await fetch(`${VITE_BASE_URL}/api/metadata`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(VITE_USERNAME + ":" + VITE_PASSWORD)}`
    },
    body: JSON.stringify({ reports: [report] })
  });
  const summary = await result.json();
});
