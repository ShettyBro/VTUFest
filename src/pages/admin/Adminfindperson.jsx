import { useState, useRef } from "react";
import AdminLayout from "./AdminLayout";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

// ─── helpers ─────────────────────────────────────────────────────────────────
const PAYMENT_STATUS = {
    VERIFIED: { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "✅ Verified" },
    REJECTED: { color: "#f87171", bg: "rgba(239,68,68,0.15)", label: "❌ Rejected" },
    PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "⏳ Pending" },
    waiting_for_verification: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "⏳ Awaiting Verification" },
};
const ACCOMM_STATUS = {
    APPROVED: { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "✅ Approved" },
    REJECTED: { color: "#f87171", bg: "rgba(239,68,68,0.15)", label: "❌ Rejected" },
    PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "⏳ Pending" },
};

const pill = (color, bg, text) => (
    <span style={{ background: bg, color, padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>
        {text}
    </span>
);

const Meta = ({ label, value, mono = false, accent }) => (
    <div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "3px" }}>{label}</div>
        <div style={{ color: accent || "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-word" }}>
            {value || "—"}
        </div>
    </div>
);

// ─── Document Viewer (one card per document) ──────────────────────────────────
function DocCard({ label, blobUrl, headers }) {
    const [sasUrl, setSasUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const [imgError, setImgError] = useState(false);

    const fetchSAS = async () => {
        setLoading(true);
        setErr(null);
        setImgError(false);
        try {
            const res = await fetch(`${API_BASE}/api/admin/find/sas`, {
                method: "POST",
                headers,
                body: JSON.stringify({ blob_url: blobUrl }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to get secure URL");
            setSasUrl(data.data.sas_url);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    const docIcon = label.toLowerCase().includes("photo") ? "🪪"
        : label.toLowerCase().includes("aadhaar") ? "🆔"
            : label.toLowerCase().includes("sslc") ? "📄"
                : "📋";

    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            overflow: "hidden",
        }}>
            {/* Doc header */}
            <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", borderBottom: sasUrl ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.1rem" }}>{docIcon}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>{label}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                        onClick={fetchSAS}
                        disabled={loading}
                        style={{ padding: "5px 14px", background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#818cf8", borderRadius: "6px", cursor: loading ? "wait" : "pointer", fontSize: "0.76rem", fontWeight: 600 }}
                    >
                        {loading ? "⏳" : sasUrl ? "🔄 Refresh" : "🔗 View"}
                    </button>
                    {sasUrl && (
                        <a href={sasUrl} target="_blank" rel="noreferrer"
                            style={{ padding: "5px 12px", background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#10b981", borderRadius: "6px", fontSize: "0.76rem", textDecoration: "none", fontWeight: 600 }}>
                            ↗ Open
                        </a>
                    )}
                </div>
            </div>
            {err && (
                <div style={{ padding: "10px 16px", color: "#f87171", fontSize: "0.82rem" }}>{err}</div>
            )}
            {/* Preview */}
            {sasUrl && !err && (
                <div style={{ background: "rgba(0,0,0,0.3)", maxHeight: "300px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {!imgError ? (
                        <img
                            src={sasUrl}
                            alt={label}
                            style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", display: "block" }}
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div style={{ padding: "24px", color: "var(--text-muted)", textAlign: "center", fontSize: "0.85rem" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
                            <div>Cannot preview this file type.</div>
                            <a href={sasUrl} target="_blank" rel="noreferrer" style={{ color: "#818cf8", marginTop: "6px", display: "inline-block" }}>Open in new tab →</a>
                        </div>
                    )}
                </div>
            )}
            {!sasUrl && !err && (
                <div style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Click <strong>View</strong> to load a secure preview (expires in 15 min)
                </div>
            )}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminFindPerson() {
    const [qrInput, setQrInput] = useState("");
    const [searching, setSearching] = useState(false);
    const [result, setResult] = useState(null);
    const [searchError, setSearchError] = useState("");
    const inputRef = useRef(null);

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const handleSearch = async (e) => {
        e?.preventDefault();
        const qr = qrInput.trim();
        if (!qr) return;

        setSearching(true);
        setSearchError("");
        setResult(null);

        try {
            const res = await fetch(`${API_BASE}/api/admin/find/person?qr=${encodeURIComponent(qr)}`, { headers });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setSearchError(data.message || "Participant not found");
                return;
            }
            setResult(data.data);
        } catch {
            setSearchError("Network error — could not reach the server");
        } finally {
            setSearching(false);
        }
    };

    const handleClear = () => {
        setQrInput("");
        setResult(null);
        setSearchError("");
        inputRef.current?.focus();
    };

    const r = result;
    const p = r?.participant;
    const isStudent = p?.person_type === "STUDENT";

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AdminLayout>
            <div style={{ padding: "10px 0", maxWidth: "960px", margin: "0 auto" }}>

                {/* ── Page header ── */}
                <div style={{ marginBottom: "28px" }}>
                    <h3 style={{ margin: "0 0 6px", color: "var(--text-primary)" }}>Find Person</h3>
                    <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>
                        Look up any finalized participant by their unique QR code. Read-only — operates on officially approved individuals only.
                    </p>
                </div>

                {/* ── Search bar ── */}
                <form onSubmit={handleSearch}>
                    <div style={{
                        display: "flex",
                        gap: "12px",
                        padding: "20px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "14px",
                        marginBottom: "28px",
                        alignItems: "center",
                    }}>
                        <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🔍</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={qrInput}
                            onChange={e => setQrInput(e.target.value)}
                            placeholder="Enter QR code (e.g. VTU20260001)..."
                            autoFocus
                            style={{
                                flex: 1,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "8px",
                                padding: "11px 14px",
                                color: "#f1f5f9",
                                fontSize: "0.95rem",
                                fontFamily: "monospace",
                                letterSpacing: "0.05em",
                                outline: "none",
                            }}
                            onFocus={e => e.target.style.borderColor = "#6366f1"}
                            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
                        />
                        <button
                            type="submit"
                            disabled={searching || !qrInput.trim()}
                            className="neon-btn"
                            style={{ width: "auto", marginTop: 0, padding: "10px 28px", flexShrink: 0, opacity: (!qrInput.trim() || searching) ? 0.5 : 1 }}
                        >
                            {searching ? "Searching…" : "Search"}
                        </button>
                        {(result || searchError) && (
                            <button
                                type="button"
                                onClick={handleClear}
                                style={{ padding: "10px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", flexShrink: 0, fontWeight: 600, fontSize: "0.85rem" }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </form>

                {/* ── Error state ── */}
                {searchError && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", padding: "16px 20px", borderRadius: "10px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1.3rem" }}>⚠️</span>
                        <span>{searchError}</span>
                    </div>
                )}

                {/* ── Loading skeleton ── */}
                {searching && (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "14px", animation: "spin 1s linear infinite" }}>⏳</div>
                        <div style={{ fontSize: "0.9rem" }}>Looking up participant…</div>
                    </div>
                )}

                {/* ── Result ── */}
                {result && !searching && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                        {/* ── Identity card ── */}
                        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", overflow: "hidden" }}>
                            {/* Header strip */}
                            <div style={{
                                padding: "16px 20px",
                                borderBottom: "1px solid rgba(255,255,255,0.08)",
                                background: isStudent ? "rgba(99,102,241,0.08)" : "rgba(212,175,55,0.08)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "10px",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontSize: "1.8rem" }}>{isStudent ? "👤" : "🎵"}</span>
                                    <div>
                                        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.1rem" }}>{p.full_name}</div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>
                                            QR: <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: "4px", fontFamily: "monospace", color: "#818cf8" }}>{p.qr_code}</code>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {pill(
                                        isStudent ? "#818cf8" : "#d4af37",
                                        isStudent ? "rgba(99,102,241,0.2)" : "rgba(212,175,55,0.2)",
                                        isStudent ? "STUDENT" : `ACCOMPANIST${p.accompanist_type ? ` · ${p.accompanist_type}` : ""}`
                                    )}
                                    {p.is_team_manager && pill("#10b981", "rgba(16,185,129,0.2)", "⭐ Team Manager")}
                                    {pill("#94a3b8", "rgba(148,163,184,0.1)", `${p.college_name || p.college_code}`)}
                                </div>
                            </div>

                            {/* Identity details grid */}
                            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "18px" }}>
                                {isStudent && <Meta label="USN" value={p.usn} mono accent="#818cf8" />}
                                <Meta label="Phone" value={p.phone} />
                                <Meta label="Email" value={p.email} />
                                <Meta label="Gender" value={p.gender} />
                                <Meta label="Blood Group" value={p.blood_group} accent="#f87171" />
                                {isStudent && <Meta label="Department" value={p.department} />}
                                {isStudent && <Meta label="Year / Semester" value={p.year_of_study && p.semester ? `Year ${p.year_of_study}, Sem ${p.semester}` : p.year_of_study ? `Year ${p.year_of_study}` : null} />}
                                <Meta label="Final Approved" value={p.final_approved_at ? new Date(p.final_approved_at).toLocaleString("en-IN") : null} />
                                {p.address && <Meta label="Address" value={p.address} />}
                            </div>
                        </div>

                        {/* ── College info strip ── */}
                        {r.college && (
                            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px 20px" }}>
                                <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "12px" }}>🏫 College</div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
                                    <Meta label="College Name" value={r.college.college_name} />
                                    <Meta label="Code" value={r.college.college_code} mono accent="#818cf8" />
                                    <Meta label="Place" value={r.college.place} />
                                    <Meta label="Max Quota" value={r.college.max_quota} />
                                    <div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "3px" }}>Lock Status</div>
                                        {r.college.is_final_approved
                                            ? pill("#10b981", "rgba(16,185,129,0.15)", "🔒 Locked")
                                            : pill("#f59e0b", "rgba(245,158,11,0.15)", "🔓 Open")}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Events + Payment + Accommodation in a 2-col layout ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

                            {/* Events */}
                            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>🎭 Event Participation</span>
                                    <span style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8", padding: "2px 10px", borderRadius: "12px", fontSize: "0.76rem", fontWeight: 700 }}>
                                        {r.events?.length || 0} event{r.events?.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div style={{ padding: "4px 0", maxHeight: "280px", overflowY: "auto" }}>
                                    {r.events?.length > 0 ? r.events.map((ev, i) => (
                                        <div key={i} style={{
                                            padding: "10px 16px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            borderBottom: i < r.events.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                                        }}>
                                            <span style={{ color: "var(--text-primary)", fontSize: "0.88rem" }}>
                                                {ev.event_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                            {pill(
                                                ev.role === "PARTICIPANT" ? "#10b981" : "#d4af37",
                                                ev.role === "PARTICIPANT" ? "rgba(16,185,129,0.15)" : "rgba(212,175,55,0.15)",
                                                ev.role
                                            )}
                                        </div>
                                    )) : (
                                        <div style={{ padding: "24px", color: "var(--text-muted)", textAlign: "center", fontSize: "0.85rem" }}>No events assigned</div>
                                    )}
                                </div>
                            </div>

                            {/* Payment + Accommodation stacked */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {/* Payment */}
                                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px" }}>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "12px" }}>💳 Payment</div>
                                    {r.payment ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Status</span>
                                                {(() => {
                                                    const cfg = PAYMENT_STATUS[r.payment.status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", label: r.payment.status };
                                                    return pill(cfg.color, cfg.bg, cfg.label);
                                                })()}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Amount</span>
                                                <span style={{ color: "#10b981", fontWeight: 700 }}>₹{Number(r.payment.amount_paid).toLocaleString("en-IN")}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>UTR</span>
                                                <span style={{ color: "#818cf8", fontFamily: "monospace", fontSize: "0.82rem" }}>{r.payment.utr_reference_number || "—"}</span>
                                            </div>
                                            {r.payment.admin_remarks && (
                                                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                                    {r.payment.admin_remarks}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No payment record found</div>
                                    )}
                                </div>

                                {/* Accommodation */}
                                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px" }}>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "12px" }}>🏨 Accommodation</div>
                                    {r.accommodation ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Status</span>
                                                {(() => {
                                                    const cfg = ACCOMM_STATUS[r.accommodation.status] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", label: r.accommodation.status || "PENDING" };
                                                    return pill(cfg.color, cfg.bg, cfg.label);
                                                })()}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Boys / Girls</span>
                                                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.accommodation.total_boys} / {r.accommodation.total_girls}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No accommodation request</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Documents ── */}
                        {r.documents?.length > 0 && (
                            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", overflow: "hidden" }}>
                                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>📁 Documents</div>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "4px" }}>Click "View" on each document to generate a secure 15-minute preview link.</div>
                                </div>
                                <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
                                    {r.documents.map((doc) => (
                                        <DocCard
                                            key={doc.key}
                                            label={doc.label}
                                            blobUrl={doc.url}
                                            headers={headers}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Read-only notice */}
                        <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>🔒</span>
                            <span>This is a read-only view. Only officially finalized participants can be looked up here.</span>
                        </div>

                    </div>
                )}

                {/* ── Empty state ── */}
                {!result && !searching && !searchError && (
                    <div style={{
                        textAlign: "center",
                        padding: "70px 30px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.12)",
                        borderRadius: "14px",
                        color: "var(--text-muted)",
                    }}>
                        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🔍</div>
                        <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Enter a QR Code to get started</div>
                        <div style={{ fontSize: "0.85rem" }}>Search by the unique alphanumeric QR code assigned during Principal Final Approval.</div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}