import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_AUTH } from "../config";

const EventSummary = ({ orgUnitId }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const year = "2025;2026"
  useEffect(() => {
    if (!orgUnitId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch enrollments
        const enrollUrl = `https://hfml.gov.la/hfml/api/29/analytics/enrollments/query/gr24luudE0t.json`;
        const enrollRes = await axios.get(enrollUrl, {
          auth: API_AUTH,
          params: {
            dimension: [`pe:${year}`, `ou:${orgUnitId}`],
            stage: "MLBhJz9GKds",
            displayProperty: "NAME",
            totalPages: false,
            outputType: "ENROLLMENT",
            desc: "enrollmentdate",
            paging: false,
          },
        });
        const enrollmentRows = enrollRes.data.rows || [];
        setEnrollments(enrollmentRows);

        // Fetch events
        const eventUrl = `https://hfml.gov.la/hfml/api/29/analytics/events/query/gr24luudE0t.json`;
        const eventRes = await axios.get(eventUrl, {
          auth: API_AUTH,
          params: {
            dimension: [`pe:${year}`, `ou:${orgUnitId}`],
            stage: "MLBhJz9GKds",
            displayProperty: "NAME",
            totalPages: false,
            outputType: "EVENT",
            desc: "eventdate",
            paging: false,
          },
        });
        const eventRows = eventRes.data.rows || [];
        setEvents(eventRows);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgUnitId]);

  const completedEvents = events.filter(
    e => e[events.length && events[0].length > 0 ? 0 : 0] // placeholder
  ).length;

  // Compute completion percentage
  const completionPercent = enrollments.length
    ? Math.min((events.length / enrollments.length) * 100, 100).toFixed(2)
    : 0;

  return (
    <div>
      <h2>Event Summary</h2>
      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <>
          <p>Total enrollments: {enrollments.length}</p>
          <p>Total events: {events.length}</p>
          <p>Completion: {completionPercent}%</p>
        </>
      )}
    </div>
  );
};

export default EventSummary;
