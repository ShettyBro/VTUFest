/**
 * CompanionHelp.jsx — /manager/help
 * Contact directory. All contacts are clickable tel: links.
 * Data extracted from HelpButton.jsx CONTACT_SECTIONS.
 */
import CompanionLayout from './CompanionLayout';

const CONTACT_SECTIONS = [
  {
    label: 'Operations',
    icon: '⚙️',
    color: '#60a5fa',
    contacts: [
      { name: 'Prof. Arun',         role: 'Accommodation',  phone: '9742787700' },
      { name: 'Prof. Rajeev',       role: 'Registration',   phone: '9900919132' },
      { name: 'Prof. Dhananjay',    role: 'Clock Room',     phone: '9844407767' },
      { name: 'Prof. Prashanth K P',role: 'Transportation', phone: '9538166113' },
      { name: 'Prof. Yogeesh',      role: 'Food',           phone: '9036684274' },
    ],
  },
  {
    label: 'Events',
    icon: '🎭',
    color: '#f472b6',
    contacts: [
      { name: 'Prof. Devrajaiah',   role: 'Theater',    phone: '9449680516' },
      { name: 'Prof. Swetha',       role: 'Music',      phone: '9901849153' },
      { name: 'Prof. Lakshmikanth', role: 'Fine Arts',  phone: '9986431667' },
      { name: 'Prof. Shilpa',       role: 'Dance',      phone: '7348922237' },
      { name: 'Prof. Rohith',       role: 'Literature', phone: '9731352543' },
    ],
  },
  {
    label: 'Heads',
    icon: '👑',
    color: '#a78bfa',
    contacts: [
      { name: 'Prof. Rajanna', role: 'Events Head',     phone: '9845475725' },
      { name: 'Prof. Satish',  role: 'Operations Head', phone: '9591976939' },
    ],
  },
  {
    label: 'Organising Secretaries',
    icon: '📋',
    color: '#34d399',
    contacts: [
      { name: 'Prof Tejas K',  role: 'Organising Secretary', phone: '9449890035' },
      { name: 'Mr Gangadhar',  role: 'Organising Secretary', phone: '7975218064' },
    ],
  },
];

function ContactCard({ contact, sectionColor }) {
  return (
    <a
      href={`tel:+91${contact.phone}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 13,
        textDecoration: 'none',
        color: '#f1f5f9',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{contact.name}</div>
        <div style={{ fontSize: 12, color: sectionColor, fontWeight: 600, marginTop: 2 }}>
          {contact.role}
        </div>
      </div>

      {/* Phone + call icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(241,245,249,0.55)' }}>
          {contact.phone}
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `rgba(${hexToRgb(sectionColor)},0.12)`,
          border: `1px solid rgba(${hexToRgb(sectionColor)},0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={sectionColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.2 2 2 0 0 1 3.57 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l.93-.93a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
      </div>
    </a>
  );
}

// hex to "r,g,b" for rgba()
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0,2), 16);
  const g = parseInt(clean.slice(2,4), 16);
  const b = parseInt(clean.slice(4,6), 16);
  return `${r},${g},${b}`;
}

export default function CompanionHelp() {
  return (
    <CompanionLayout>
      <div style={{ padding: '24px 18px 8px' }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Help & Contacts</div>
          <div style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', marginTop: 4 }}>
            Tap any contact to call directly
          </div>
        </div>

        {/* Sections */}
        {CONTACT_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 24 }}>
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: `1px solid rgba(${hexToRgb(section.color)},0.2)`,
            }}>
              <span style={{ fontSize: 18 }}>{section.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: section.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {section.label}
              </span>
            </div>

            {/* Contacts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.contacts.map(c => (
                <ContactCard key={c.phone} contact={c} sectionColor={section.color} />
              ))}
            </div>
          </div>
        ))}

        {/* Footer note */}
        <div style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'rgba(241,245,249,0.25)',
          padding: '8px 0 12px',
        }}>
          Available Mon–Sat, 9 AM – 6 PM
        </div>

        <div style={{ height: 12 }} />
      </div>
    </CompanionLayout>
  );
}
