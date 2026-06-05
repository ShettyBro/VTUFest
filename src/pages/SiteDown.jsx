import { useEffect, useState } from "react";

const DEV_URL  = "https://www.sudeepbro.works/homepage";
const DEV_NAME = "Sudeep Shivashettar";

export default function SiteDown() {
  const [dots, setDots] = useState(".");

  // Animated ellipsis for the status line
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 600);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Outfit', system-ui, sans-serif;
          background: #0a0a0f;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ── animated background ─────────────────────────────── */
        .sd-bg {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(239,68,68,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(124,58,237,0.10) 0%, transparent 55%),
            radial-gradient(ellipse 100% 80% at 50% 50%, rgba(15,15,25,1) 30%, #0a0a0f 100%);
          z-index: 0;
        }

        .sd-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          z-index: 0;
          mask-image: radial-gradient(ellipse 90% 90% at center, black 30%, transparent 100%);
        }

        /* ── main card ───────────────────────────────────────── */
        .sd-wrap {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.25rem;
          gap: 0;
        }

        .sd-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          max-width: 640px;
          width: 100%;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(239,68,68,0.08),
            0 40px 80px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.07);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: sd-fadeIn 0.8s ease both;
        }

        @keyframes sd-fadeIn {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        /* ── logo ────────────────────────────────────────────── */
        .sd-logo {
          display: block;
          max-width: 340px;
          width: 90%;
          height: auto;
          margin: 0 auto 2rem auto;
          border-radius: 12px;
          filter: brightness(0.9);
          animation: sd-fadeIn 0.9s ease 0.1s both;
        }

        /* ── error badge ─────────────────────────────────────── */
        .sd-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.30);
          color: #fca5a5;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.35rem 1rem;
          border-radius: 999px;
          margin-bottom: 1.5rem;
          animation: sd-fadeIn 0.9s ease 0.2s both;
        }

        .sd-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          animation: sd-pulse 1.4s ease-in-out infinite;
        }

        @keyframes sd-pulse {
          0%, 100% { opacity: 1; transform: scale(1);    }
          50%       { opacity: 0.4; transform: scale(0.6); }
        }

        /* ── headline ────────────────────────────────────────── */
        .sd-title {
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 800;
          color: #f9fafb;
          line-height: 1.2;
          margin-bottom: 0.75rem;
          animation: sd-fadeIn 0.9s ease 0.3s both;
        }

        .sd-title span {
          background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── sub text ────────────────────────────────────────── */
        .sd-desc {
          font-size: 1rem;
          font-weight: 400;
          color: #9ca3af;
          line-height: 1.7;
          margin-bottom: 2rem;
          animation: sd-fadeIn 0.9s ease 0.4s both;
        }

        /* ── error code block ────────────────────────────────── */
        .sd-code-block {
          background: rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.07);
          border-left: 3px solid #ef4444;
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin-bottom: 2rem;
          text-align: left;
          font-family: 'Courier New', monospace;
          animation: sd-fadeIn 0.9s ease 0.5s both;
          width: 100%;
        }

        .sd-code-line {
          font-size: 0.78rem;
          line-height: 1.9;
        }

        .sd-code-key   { color: #f87171; }
        .sd-code-colon { color: #6b7280; }
        .sd-code-val   { color: #86efac; }
        .sd-code-str   { color: #fde68a; }
        .sd-code-num   { color: #93c5fd; }

        /* ── divider ─────────────────────────────────────────── */
        .sd-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          margin: 1.75rem 0;
        }

        /* ── contact section ─────────────────────────────────── */
        .sd-contact-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 0.75rem;
          animation: sd-fadeIn 0.9s ease 0.6s both;
        }

        .sd-contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.10));
          border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: sd-fadeIn 0.9s ease 0.7s both;
        }

        .sd-contact-btn:hover {
          background: linear-gradient(135deg, rgba(239,68,68,0.25), rgba(249,115,22,0.18));
          border-color: rgba(239,68,68,0.45);
          color: #fecaca;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(239,68,68,0.18);
        }

        /* ── status ticker ───────────────────────────────────── */
        .sd-status {
          margin-top: 2rem;
          font-size: 0.78rem;
          color: #4b5563;
          font-family: 'Courier New', monospace;
          animation: sd-fadeIn 0.9s ease 0.8s both;
        }

        /* ── floating particles ──────────────────────────────── */
        .sd-particle {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          animation: sd-float linear infinite;
          opacity: 0;
        }

        @keyframes sd-float {
          0%   { transform: translateY(110vh) scale(0.5); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-10vh) scale(1.1); opacity: 0; }
        }

        /* ── footer ──────────────────────────────────────────── */
        .sd-footer {
          position: relative;
          z-index: 1;
          margin-top: 2rem;
          font-size: 0.72rem;
          color: #374151;
          text-align: center;
          letter-spacing: 0.04em;
        }

        @media (max-width: 480px) {
          .sd-card { padding: 2rem 1.25rem; border-radius: 18px; }
          .sd-logo { max-width: 240px; }
        }
      `}</style>

      {/* Background layers */}
      <div className="sd-bg" />
      <div className="sd-grid" />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="sd-particle"
          style={{
            width:  `${4 + (i % 4) * 3}px`,
            height: `${4 + (i % 4) * 3}px`,
            left:   `${10 + i * 11}%`,
            background: i % 2 === 0 ? "rgba(239,68,68,0.5)" : "rgba(124,58,237,0.4)",
            animationDuration: `${10 + i * 3}s`,
            animationDelay:    `${i * 1.5}s`,
          }}
        />
      ))}

      <div className="sd-wrap">
        <div className="sd-card">

          {/* Logo */}
          <img
            src="/main.webp"
            alt="VTU Fest / Acharya"
            className="sd-logo"
          />

          {/* Red badge */}
          <div className="sd-badge">
            <span className="sd-badge-dot" />
            Service Unavailable
          </div>

          {/* Headline */}
          <h1 className="sd-title">
            This portal has been<br />
            <span>taken down.</span>
          </h1>

          {/* Description */}
          <p className="sd-desc">
            The VTU Fest registration and management portal is currently
            offline and is no longer accessible. All services associated
            with this platform have been suspended.
          </p>

          {/* Error block */}
          <div className="sd-code-block">
            <div className="sd-code-line">
              <span className="sd-code-key">error</span>
              <span className="sd-code-colon">: </span>
              <span className="sd-code-str">"SERVICE_TERMINATED"</span>
            </div>
            <div className="sd-code-line">
              <span className="sd-code-key">status</span>
              <span className="sd-code-colon">: </span>
              <span className="sd-code-num">503</span>
            </div>
            <div className="sd-code-line">
              <span className="sd-code-key">platform</span>
              <span className="sd-code-colon">: </span>
              <span className="sd-code-str">"VTU Fest Portal"</span>
            </div>
            <div className="sd-code-line">
              <span className="sd-code-key">message</span>
              <span className="sd-code-colon">: </span>
              <span className="sd-code-str">"This service is no longer available."</span>
            </div>
          </div>

          {/* Divider */}
          <div className="sd-divider" />

          {/* Contact */}
          <p className="sd-contact-label">Need help? Contact the developer</p>
          <a
            href={DEV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="sd-contact-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            {DEV_NAME}
          </a>

          {/* Status ticker */}
          <p className="sd-status">
            &gt; Awaiting further instructions{dots}
          </p>
        </div>

        {/* Footer */}
        <p className="sd-footer">
          VTU Fest Portal &nbsp;·&nbsp; Acharya Institute of Technology &nbsp;·&nbsp; Visvesvaraya Technological University
        </p>
      </div>
    </>
  );
}
