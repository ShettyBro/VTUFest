import { useState, useEffect } from "react";
import "../styles/AllocatedEventsModal.css";

const API_URL = "https://vtu-festserver-production.up.railway.app/api/student/assigned-events";

export default function AllocatedEventsModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllocatedEvents();
  }, []);

  const fetchAllocatedEvents = async () => {
    const token = localStorage.getItem("vtufest_token");

    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "https://vtufest2026.acharyahabba.com/";
        }, 2000);
        return;
      }

      if (!response.ok) {
        setError(result.message || "Failed to fetch allocated events");
        return;
      }

      setData(result);
    } catch (err) {
      console.error("Error fetching allocated events:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="allocated-modal-overlay">
      <div className="allocated-modal-card">
        <button className="allocated-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h3>My Allocated Events</h3>

        {loading ? (
          <div className="allocated-loading">
            <div className="allocated-spinner"></div>
            <p>Loading your allocated events...</p>
          </div>
        ) : error ? (
          <div className="allocated-error">
            <p>{error}</p>
            <button onClick={onClose} className="allocated-close-button">
              Close
            </button>
          </div>
        ) : !data?.approved ? (
          <div className="allocated-not-approved">
            <p>Your application has not been approved yet. Event allocation will be available after final approval.</p>
            <button onClick={onClose} className="allocated-close-button">
              Close
            </button>
          </div>
        ) : (
          <div className="allocated-content">
            <div className="allocated-student-info">
              <div className="allocated-info-item">
                <strong>Name:</strong>
                <span>{data.student?.name || "N/A"}</span>
              </div>
              <div className="allocated-info-item">
                <strong>8-Digit Code:</strong>
                <span className="allocated-code">{data.student?.code || "N/A"}</span>
              </div>
            </div>

            <div className="allocated-events-section">
              <h4>Section 1: Participating Events</h4>
              <div className="allocated-table-wrapper">
                <table className="allocated-table">
                  <thead>
                    <tr>
                      <th>Sl.No</th>
                      <th>Participating Events</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.participantEvents && data.participantEvents.length > 0 ? (
                      data.participantEvents.map((event) => (
                        <tr key={event.slNo}>
                          <td>{event.slNo}</td>
                          <td>{event.eventName}</td>
                          <td>{event.attendance || ""}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="allocated-no-events">
                          No events assigned
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="allocated-events-section">
              <h4>Section 2: Accompanying Events</h4>
              <div className="allocated-table-wrapper">
                <table className="allocated-table">
                  <thead>
                    <tr>
                      <th>Sl.No</th>
                      <th>Accompanying Events</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.accompanistEvents && data.accompanistEvents.length > 0 ? (
                      data.accompanistEvents.map((event) => (
                        <tr key={event.slNo}>
                          <td>{event.slNo}</td>
                          <td>{event.eventName}</td>
                          <td>{event.attendance || ""}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="allocated-no-events">
                          No events assigned
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="allocated-modal-actions">
              <button onClick={onClose} className="allocated-close-button">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}