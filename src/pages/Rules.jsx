import { useState, useEffect } from "react";
import Layout from "../components/layout/layout";
import "../styles/rules.css";

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api/student/dashboard";

export default function Rules() {
  const [hasApplication, setHasApplication] = useState(false);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      const token = localStorage.getItem("vtufest_token");
      if (!token) return;

      try {
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHasApplication(data.data?.application !== null);
        }
      } catch (error) {
        console.error("Error fetching application status:", error);
      }
    };

    fetchApplicationStatus();
  }, []);

  return (
    <Layout hasApplication={hasApplication}>
      <div className="rules-container">
        <h2>INSTRUCTIONS</h2>
        <p className="rules-subtitle">
          GUIDELINES FOR THE 24TH VTU YOUTH FESTIVAL
        </p>

        <div className="rules-card">
          <ol>
            <li>
              The 24th VTU Youth Festival is scheduled to take place from March
              24 to March 27, 2026.
            </li>
            <li>
              Team registrations will open on February 20, 2026, and close on
              March 10, 2026.
            </li>
            <li>
              Late registrations and requests for modifications after submission
              will not be entertained under any circumstances.
            </li>
            <li>
              Each contingent, including officials, participants, and
              accompanists, can have a maximum of 45 members.
            </li>
            <li>
              Registration Fee:
              <ul>
                <li>₹4,000/- for participation in up to 10 events.</li>
                <li>₹8,000/- for participation in more than 10 events.</li>
                <li>
                  A refundable caution deposit of ₹3,000/- must be paid offline
                  at the registration desk.
                </li>
              </ul>
            </li>
            <li>
              Accommodation:
              <ul>
                <li>
                  Available only for outstation teams who have opted for it.
                </li>
                <li>
                  Accommodation will only be provided for outstation registered
                  teams during the fest dates.
                </li>
              </ul>
            </li>
            <li>
              All participants and officials will be provided with food during
              the event.
            </li>
            <li>
              Teams must bring their own musical instruments and any other
              necessary materials required for performances.
            </li>
            <li>
              The team manager must be a faculty member with at least five years
              of experience or hold the position of Cultural Coordinator or
              Physical Education Director.
            </li>
            <li>
              The use of tobacco, alcohol, or any narcotic substances by
              participants, accompanists, or team managers will result in
              immediate disqualification.
            </li>
            <li>
              All contingent members are expected to uphold discipline and
              maintain decorum within and outside the college premises. Any
              misconduct will result in strict disciplinary action.
            </li>
            <li>
              Reporting times will be communicated along with the event
              schedule.
            </li>
            <li>
              The decisions made by the organizers and judging panel will be
              final and cannot be contested.
            </li>
            <li>
              The organizers reserve the rights to alter the schedule of the
              event at any point of time.
            </li>
            <li>
              All participants must be regular VTU students and must carry their
              institutional identity cards.
            </li>
            <li>
              An official authorization letter from the institution's
              authorities is mandatory for all participants and accompanists.
            </li>
            <li>
              If any participant wishes to swap overlapping events, it must be
              reported to the registration desk at least 12 hours in advance.
            </li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}