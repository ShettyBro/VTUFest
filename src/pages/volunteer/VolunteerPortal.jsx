/**
 * VolunteerPortal.jsx — Department Selection Screen
 * 
 * Matches Screenshot 1: Dark navy background, 3 logos, department cards.
 */

import { useNavigate } from 'react-router-dom';
import { ClipboardList, Truck, ChevronRight } from 'lucide-react';
import '../../styles/volunteer.css';

const DEPARTMENTS = [
  {
    id: 'event_ops',
    title: 'Event Operations',
    subtitle: 'Registration · Help Desk · In Event',
    icon: ClipboardList,
  },
  {
    id: 'logistics',
    title: 'Logistics & Services',
    subtitle: 'College Buddy · Food Dept.',
    icon: Truck,
  },
];

export default function VolunteerPortal() {
  const navigate = useNavigate();

  return (
    <div className="vol-page">
      {/* ── Header / Branding ──────────────────────────────────────────── */}
      <div className="vol-header">
        <div className="vol-logo-strip">
          <img src="/main.webp" alt="Acharya VTU Habba 2026 Logos" />
        </div>
        <h1 className="vol-title">Acharya VTU HABBA 2026</h1>
        <p className="vol-subtitle">Volunteer Portal</p>
        <p className="vol-subtitle-dim">Select your department to continue</p>
      </div>

      {/* ── Department Cards ───────────────────────────────────────────── */}
      <div className="vol-cards">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          return (
            <div
              key={dept.id}
              className="vol-dept-card"
              onClick={() => navigate(`/volunteer/login?dept=${dept.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/volunteer/login?dept=${dept.id}`)}
            >
              <div className="vol-dept-card-icon">
                <Icon size={22} />
              </div>
              <div className="vol-dept-card-info">
                <p className="vol-dept-card-title">{dept.title}</p>
                <p className="vol-dept-card-sub">{dept.subtitle}</p>
              </div>
              <span className="vol-dept-card-arrow">
                <ChevronRight size={20} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
