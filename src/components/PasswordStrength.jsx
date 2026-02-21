/**
 * PasswordStrength — renders a live checklist of password requirements.
 * Only visible when `password` is non-empty.
 *
 * Props:
 *   password      – current password string
 *   confirmPassword – (optional) confirm field value; adds a "Passwords match" row if provided
 *   compact       – (optional) reduces padding for tight layouts
 */
export default function PasswordStrength({ password, confirmPassword, compact = false }) {
    if (!password) return null;

    const rules = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "At least one uppercase letter", met: /[A-Z]/.test(password) },
        { label: "At least one lowercase letter", met: /[a-z]/.test(password) },
        { label: "At least one number", met: /[0-9]/.test(password) },
        { label: "At least one special character", met: /[^A-Za-z0-9]/.test(password) },
    ];

    if (confirmPassword !== undefined) {
        rules.push({
            label: "Passwords match",
            met: confirmPassword.length > 0 && password === confirmPassword,
        });
    }

    const passed = rules.filter(r => r.met).length;
    const total = rules.length;

    // Colour gradient: red → orange → green based on % passed
    const ratio = passed / total;
    const barColor = ratio < 0.4 ? "#ef4444" : ratio < 0.8 ? "#f59e0b" : "#10b981";
    const label = ratio < 0.4 ? "Weak" : ratio < 0.8 ? "Fair" : passed === total ? "Strong" : "Good";

    const wrap = {
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: compact ? "10px 12px" : "12px 14px",
        marginTop: "8px",
        marginBottom: "4px",
        fontSize: "0.78rem",
    };

    const barTrack = {
        height: "4px",
        borderRadius: "4px",
        background: "rgba(255,255,255,0.1)",
        marginBottom: "10px",
        overflow: "hidden",
    };

    const barFill = {
        height: "100%",
        width: `${(passed / total) * 100}%`,
        background: barColor,
        borderRadius: "4px",
        transition: "width 0.3s ease, background 0.3s ease",
    };

    return (
        <div style={wrap}>
            {/* Strength bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>Password strength</span>
                <span style={{ color: barColor, fontWeight: 600, fontSize: "0.72rem" }}>{label}</span>
            </div>
            <div style={barTrack}><div style={barFill} /></div>

            {/* Rule checklist */}
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                {rules.map((r, i) => (
                    <li key={i} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        color: r.met ? "#10b981" : "rgba(255,255,255,0.45)",
                        transition: "color 0.2s",
                    }}>
                        <span style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem",
                            flexShrink: 0,
                            background: r.met ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)",
                            border: `1px solid ${r.met ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.12)"}`,
                            transition: "all 0.2s",
                        }}>
                            {r.met ? "✓" : "✗"}
                        </span>
                        {r.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}
