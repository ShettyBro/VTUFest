import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";

export default function Rules() {
  return (
    <Layout>
      <div className="dashboard-glass-wrapper">

        {/* Header Section */}
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Instructions</h1>
            <p>Guidelines for the 24th VTU Youth Festival</p>
          </div>
          {/* Optional Badge */}
          <div className="qr-badge-right">
            <span className="ticker-label">Official</span>
          </div>
        </div>

        {/* Rules Content */}
        <div className="glass-card">
          <div className="instruction-list" style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
            <ol style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '12px' }}>
                The 24th VTU Youth Festival is scheduled to take place from March
                24 to March 27, 2026.
              </li>
              <li style={{ marginBottom: '12px' }}>
                Team registrations will open on February 20, 2026, and close on
                March 10, 2026.
              </li>
              <li style={{ marginBottom: '12px' }}>
                Late registrations and requests for modifications after submission
                will not be entertained under any circumstances.
              </li>
              <li style={{ marginBottom: '12px' }}>
                Each contingent, including officials, participants, and
                accompanists, can have a maximum of 45 members.
              </li>
              <li style={{ marginBottom: '12px' }}>
                Registration Fee:
                <ul style={{ marginTop: '8px', marginBottom: '8px', listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                  <li>₹4,000/- for participation in up to 10 events.</li>
                  <li>₹8,000/- for participation in more than 10 events.</li>
                  <li>
                    A refundable caution deposit of ₹3,000/- must be paid offline
                    at the registration desk.
                  </li>
                </ul>
              </li>
              <li style={{ marginBottom: '12px' }}>
                Accommodation:
                <ul style={{ marginTop: '8px', marginBottom: '8px', listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                  <li>
                    Available only for outstation teams who have opted for it.
                  </li>
                  <li>
                    Accommodation will only be provided for outstation registered
                    teams during the fest dates.
                  </li>
                </ul>
              </li>
              <li style={{ marginBottom: '12px' }}>
                All participants and officials will be provided with food during
                the event.
              </li>
              <li style={{ marginBottom: '12px' }}>
                Teams must bring their own musical instruments and any other
                necessary materials required for performances.
              </li>
              <li style={{ marginBottom: '12px' }}>
                The team manager must be a faculty member with at least five years
                of experience or hold the position of Cultural Coordinator or
                Physical Education Director.
              </li>
              <li style={{ marginBottom: '12px' }}>
                The use of tobacco, alcohol, or any narcotic substances by
                participants, accompanists, or team managers will result in
                immediate disqualification.
              </li>
              <li style={{ marginBottom: '12px' }}>
                All contingent members are expected to uphold discipline and
                maintain decorum within and outside the college premises. Any
                misconduct will result in strict disciplinary action.
              </li>
              <li style={{ marginBottom: '12px' }}>
                Reporting times will be communicated along with the event
                schedule.
              </li>
              <li style={{ marginBottom: '12px' }}>
                The decisions made by the organizers and judging panel will be
                final and cannot be contested.
              </li>
              <li style={{ marginBottom: '12px' }}>
                The organizers reserve the rights to alter the schedule of the
                event at any point of time.
              </li>
              <li style={{ marginBottom: '12px' }}>
                All participants must be regular VTU students and must carry their
                institutional identity cards.
              </li>
              <li style={{ marginBottom: '12px' }}>
                An official authorization letter from the institution's
                authorities is mandatory for all participants and accompanists.
              </li>
              <li style={{ marginBottom: '12px' }}>
                If any participant wishes to swap overlapping events, it must be
                reported to the registration desk at least 12 hours in advance.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}