import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/layout";
import "../../styles/dashboard-glass.css";
import { usePopup } from "../../context/PopupContext";

const API = "https://api.vtufest2026.acharyahabba.com";

// ─── Mode options — values match backend ENUM (UPPERCASE) ─────────────────────
const MODES = [
  { value: "BUS_PRIVATE",      label: "🚌 Bus (Private / Rented)" },
  { value: "COLLEGE_VEHICLE",  label: "🚐 College Own Vehicle" },
  { value: "TRAIN",            label: "🚆 Train" },
  { value: "FLIGHT",           label: "✈️ Flight" },
  { value: "PUBLIC_BUS",       label: "🚍 Public Bus / KSRTC" },
  { value: "OTHER",            label: "🚗 Other" },
];

const ARRIVAL_MIN = "2026-04-10T00:00";
const ARRIVAL_MAX = "2026-04-14T23:59";

const STATION_SUGGESTIONS = ["KSR City", "Yeshwanthpur", "Cantonment", "Others"];
const BUS_STAND_SUGGESTIONS = ["Majestic", "Shivajinagar", "Satellite Bus Stand", "Others"];

const isValidPhone = (v) => /^[6-9]\d{9}$/.test(v.trim());

const inp = {
  width: "100%",
  padding: "10px 12px",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "8px",
  color: "#f1f5f9",
  fontSize: "0.9rem",
  outline: "none",
};

const lbl = (text, required) => (
  <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "5px", fontWeight: 600 }}>
    {text}{required && <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>}
  </label>
);

function Field({ children, style }) {
  return <div style={{ marginBottom: "14px", ...style }}>{children}</div>;
}

function SuggestionRow({ suggestions, onPick }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
      {suggestions.map(s => (
        <button key={s} type="button" onClick={() => onPick(s)}
          style={{ padding: "3px 10px", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "var(--gold-solid, #d4af37)", borderRadius: "20px", fontSize: "0.75rem", cursor: "pointer" }}>
          {s}
        </button>
      ))}
    </div>
  );
}

export default function TransportForm() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vtufest_token");
  const role = localStorage.getItem("vtufest_role");
  const { showPopup } = usePopup();

  const [pageState, setPageState] = useState("loading"); // loading | disabled | form | status | submitted
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTransportDetails, setShowTransportDetails] = useState(false);
  const [submission, setSubmission] = useState(null); // hold the existing submission for the status view

  // ── form fields ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("");
  const [trainName, setTrainName] = useState("");
  const [pnr, setPnr] = useState("");
  const [arrivalStation, setArrivalStation] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [boardingCity, setBoardingCity] = useState("");
  const [routeNumber, setRouteNumber] = useState("");
  const [busStand, setBusStand] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [description, setDescription] = useState("");
  const [eta, setEta] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactTravelling, setContactTravelling] = useState(true);
  const [onVehicleName, setOnVehicleName] = useState("");
  const [onVehiclePhone, setOnVehiclePhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!token || role !== "manager") { navigate("/"); return; }
    checkStatus();
    // Re-check whenever manager tabs back (admin may have changed settings)
    const onVisible = () => { if (document.visibilityState === "visible") checkStatus(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const userAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const checkStatus = async () => {
    try {
      // ?t= cache-buster forces fresh response (bypasses browser ETag 304 cache)
      const res = await fetch(`${API}/api/settings/transport-status?t=${Date.now()}`, {
        headers: userAuthHeader(),
      });
      const data = await res.json();
      if (!data.success || !data.data?.enabled) { setPageState("disabled"); return; }

      const showDetails = !!data.data?.show_details;
      setShowTransportDetails(showDetails);

      // Check existing submission — if found, ALWAYS go to status (no editing)
      const subRes = await fetch(`${API}/api/transport/my-submission`, {
        headers: userAuthHeader(),
      });
      const subData = await subRes.json();
      if (subData.success && subData.data) {
        setSubmission(subData.data);
        setPageState("status");
        return;
      }
      // No submission yet — show the form
      setPageState("form");
    } catch {
      setPageState("form");
    }
  };

  const prefillForm = (d) => {
    setMode(d.transport_mode || "");
    // Map vehicle_or_train_number to the right field based on mode
    const m = d.transport_mode || "";
    if (m === "TRAIN")    { setTrainName(d.vehicle_or_train_number || ""); }
    if (m === "FLIGHT")   { setFlightNumber(d.vehicle_or_train_number || ""); }
    if (m === "BUS_PRIVATE" || m === "COLLEGE_VEHICLE") { setVehicleReg(d.vehicle_or_train_number || ""); }
    if (m === "PUBLIC_BUS") { setRouteNumber(d.vehicle_or_train_number || ""); }

    setPnr(d.pnr_number || "");
    // arrival_point maps differently per mode
    if (m === "TRAIN")    { setArrivalStation(d.arrival_point || ""); }
    if (m === "PUBLIC_BUS") { setBusStand(d.arrival_point || ""); }
    if (m === "BUS_PRIVATE" || m === "COLLEGE_VEHICLE") { setBoardingCity(d.arrival_point || ""); }

    setEta(d.estimated_arrival_datetime ? d.estimated_arrival_datetime.slice(0, 16) : "");
    setHeadcount(String(d.total_headcount || ""));
    setContactName(d.contact_person_name || "");
    setContactPhone(d.contact_person_phone || "");
    const hasSeparateContact = !!d.on_vehicle_contact_name;
    setContactTravelling(!hasSeparateContact);
    setOnVehicleName(d.on_vehicle_contact_name || "");
    setOnVehiclePhone(d.on_vehicle_contact_phone || "");
    setNotes(d.additional_notes || "");
    setDescription(d.additional_notes || ""); // used for OTHER mode
  };

  const buildPayload = () => {
    let vehicle_or_train_number = null;
    let arrival_point = null;

    if (mode === "TRAIN") {
      vehicle_or_train_number = trainName.trim() || null;
      arrival_point = arrivalStation.trim() || null;
    } else if (mode === "BUS_PRIVATE" || mode === "COLLEGE_VEHICLE") {
      vehicle_or_train_number = vehicleReg.trim() || null;
      arrival_point = boardingCity.trim() || null;
    } else if (mode === "PUBLIC_BUS") {
      vehicle_or_train_number = routeNumber.trim() || null;
      arrival_point = busStand.trim() || null;
    } else if (mode === "FLIGHT") {
      vehicle_or_train_number = flightNumber.trim() || null;
      arrival_point = "Kempegowda International Airport";
    }

    return {
      transport_mode: mode,
      vehicle_or_train_number,
      pnr_number: mode === "TRAIN" ? (pnr.trim() || null) : null,
      arrival_point,
      estimated_arrival_datetime: eta || null,
      total_headcount: parseInt(headcount) || 0,
      contact_person_name: contactName.trim(),
      contact_person_phone: contactPhone.trim(),
      on_vehicle_contact_name: contactTravelling ? null : (onVehicleName.trim() || null),
      on_vehicle_contact_phone: contactTravelling ? null : (onVehiclePhone.trim() || null),
      additional_notes: mode === "OTHER" ? (description.trim() || null) : (notes.trim() || null),
    };
  };

  const validate = () => {
    if (!mode) return "Please select a transport mode.";
    if (mode === "TRAIN" && !trainName.trim()) return "Train Name & Number is required.";
    if (mode === "TRAIN" && !arrivalStation.trim()) return "Arrival Station is required.";
    if ((mode === "BUS_PRIVATE" || mode === "COLLEGE_VEHICLE") && !vehicleReg.trim()) return "Vehicle Registration Number is required.";
    if ((mode === "BUS_PRIVATE" || mode === "COLLEGE_VEHICLE") && !boardingCity.trim()) return "Boarding City is required.";
    if (mode === "PUBLIC_BUS" && !busStand.trim()) return "Expected Bus Stand is required.";
    if (mode === "FLIGHT" && !flightNumber.trim()) return "Flight Number is required.";
    if (mode === "OTHER" && !description.trim()) return "Description is required.";
    if (!eta) return "Estimated Arrival Date & Time is required.";
    if (eta < ARRIVAL_MIN || eta > ARRIVAL_MAX) return "Arrival must be between Apr 10, 2026 and Apr 14, 2026.";
    if (!headcount || parseInt(headcount) < 1) return "Total Headcount must be at least 1.";
    if (!contactName.trim()) return "Contact Person Name is required.";
    if (!contactPhone.trim()) return "Contact Person Phone is required.";
    if (!isValidPhone(contactPhone)) return "Phone must be 10 digits starting with 6, 7, 8, or 9.";
    if (!contactTravelling) {
      if (!onVehicleName.trim()) return "On-Vehicle Contact Name is required.";
      if (!onVehiclePhone.trim()) return "On-Vehicle Contact Phone is required.";
      if (!isValidPhone(onVehiclePhone)) return "On-Vehicle Contact Phone must be 10 digits starting with 6–9.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { showPopup(err, "warning"); return; }

    setSubmitting(true);
    try {
      // Always POST — one-time submission, no editing allowed
      const res = await fetch(`${API}/api/transport/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userAuthHeader() },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showPopup(data.message || "Failed to submit", "error");
        return;
      }
      // After submit, fetch updated submission then go to status view
      const subRes = await fetch(`${API}/api/transport/my-submission`, { headers: userAuthHeader() });
      const subData = await subRes.json();
      if (subData.success && subData.data) setSubmission(subData.data);
      setPageState("status");
    } catch {
      showPopup("Network error. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── States ───────────────────────────────────────────────────────────────────
  const fmtMode = (m) => ({
    BUS_PRIVATE: "🚌 Bus (Private)", COLLEGE_VEHICLE: "🚐 College Vehicle",
    TRAIN: "🚆 Train", FLIGHT: "✈️ Flight", PUBLIC_BUS: "🚍 Public Bus", OTHER: "🚗 Other",
  })[m] || m || "—";
  const fmtDt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  if (pageState === "status" && submission) {
    const isCoordinated = submission.coordination_status === "coordinated";
    const hasDriver     = !!submission.driver_name;
    const fmtMode = (m) => ({ BUS_PRIVATE: "🚌 Bus (Private)", COLLEGE_VEHICLE: "🚐 College Vehicle", TRAIN: "🚆 Train", FLIGHT: "✈️ Flight", PUBLIC_BUS: "🚍 Public Bus", OTHER: "🚗 Other" })[m] || m || "—";
    const fmtDt  = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
    return (
      <Layout>
        <div className="dashboard-glass-wrapper">
          <div className="dashboard-header">
            <div className="welcome-text">
              <h1>Transport Details</h1>
              <p style={{ color: "var(--text-secondary)" }}>Your submitted transport information</p>
            </div>
          </div>

          {/* Status badge */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              padding: "8px 20px", borderRadius: "30px", fontWeight: 700, fontSize: "0.9rem",
              background: isCoordinated ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.12)",
              color: isCoordinated ? "#10b981" : "#f59e0b",
              border: `1px solid ${isCoordinated ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`
            }}>
              {isCoordinated ? "✅ Coordinated" : "⏳ Pending Coordination"}
            </span>
          </div>

          {/* Submission summary */}
          <div className="glass-card" style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 16px", color: "var(--text-primary)" }}>📋 Submission Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {[
                { label: "Mode",          value: fmtMode(submission.transport_mode) },
                { label: "Arrival Point", value: submission.arrival_point || "—" },
                { label: "ETA",           value: fmtDt(submission.estimated_arrival_datetime) },
                { label: "Headcount",     value: submission.total_headcount ?? "—" },
                { label: "Contact",       value: submission.contact_person_name || "—" },
                { label: "Phone",         value: submission.contact_person_phone || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{label}</div>
                  <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.88rem" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver / contact section — only shown when show_transport_details is ON */}
          {showTransportDetails && (
            hasDriver ? (
              <div className="glass-card" style={{ borderColor: "rgba(16,185,129,0.35)", marginBottom: "20px" }}>
                <h3 style={{ margin: "0 0 14px", color: "#10b981" }}>🚗 Assigned Driver</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                  {[
                    { label: "Driver Name",    value: submission.driver_name },
                    { label: "Driver Phone",   value: submission.driver_phone, isPhone: true },
                    { label: "Vehicle Number", value: submission.vehicle_number },
                    ...(submission.driver_remarks ? [{ label: "Remarks", value: submission.driver_remarks }] : []),
                  ].map(({ label, value, isPhone }) => (
                    <div key={label}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{label}</div>
                      <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.88rem" }}>
                        {isPhone ? <a href={`tel:${value}`} style={{ color: "#60a5fa", textDecoration: "none" }}>{value}</a> : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "10px", padding: "16px 20px", color: "#fbbf24", fontSize: "0.88rem", marginBottom: "20px" }}>
                📞 The transport team will contact you shortly with your driver and vehicle details.
              </div>
            )
          )}
        </div>
      </Layout>
    );
  }

  if (pageState === "loading") {
    return (
      <Layout>
        <div className="dashboard-glass-wrapper">
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading…
          </div>
        </div>
      </Layout>
    );
  }

  if (pageState === "disabled") {
    return (
      <Layout>
        <div className="dashboard-glass-wrapper">
          <div className="dashboard-header"><div className="welcome-text"><h1>Transport Details</h1><p style={{ color: "var(--text-secondary)" }}>VTU HABBA 2026</p></div></div>
          <div className="glass-card" style={{ textAlign: "center", padding: "60px 40px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🚌</div>
            <h3 style={{ color: "var(--text-secondary)", fontWeight: 600, margin: "0 0 8px" }}>Transport Details Collection Not Open Yet</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>The admin has not opened transport detail submission. Please check back later.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (pageState === "submitted") {
    return (
      <Layout>
        <div className="dashboard-glass-wrapper">
          <div className="dashboard-header"><div className="welcome-text"><h1>Transport Details</h1></div></div>
          <div className="glass-card" style={{ textAlign: "center", padding: "60px 40px" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>✅</div>
            <h3 style={{ color: "var(--accent-success)", fontWeight: 700, margin: "0 0 8px", fontSize: "1.3rem" }}>
              {isEditMode ? "Transport Details Updated!" : "Transport Details Submitted!"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "400px", margin: "0 auto" }}>
              Your transport details have been received. The transport team will coordinate with you closer to the event dates.
            </p>
            <button className="neon-btn" onClick={() => navigate("/manager-dashboard")} style={{ maxWidth: "240px", marginTop: "30px" }}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Guard: if show_transport_details is ON and there's an existing submission, always show status view
  if (showTransportDetails && submission) {
    return null; // checkStatus already sets pageState="status"; this is just a safety fallback
  }

  const isTrain        = mode === "TRAIN";
  const isBusOrVehicle = mode === "BUS_PRIVATE" || mode === "COLLEGE_VEHICLE";
  const isPublicBus    = mode === "PUBLIC_BUS";
  const isFlight       = mode === "FLIGHT";
  const isOther        = mode === "OTHER";

  return (
    <Layout>
      <div className="dashboard-glass-wrapper">
        <div className="dashboard-header">
          <div className="welcome-text">
            <h1>Transport Details</h1>
            <p style={{ color: "var(--text-secondary)" }}>
              {isEditMode ? "Update your team's transport details" : "Submit your team's travel information for VTU HABBA 2026"}
            </p>
          </div>
        </div>

        {isEditMode && (
          <div style={{ marginBottom: "20px", padding: "12px 18px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: "10px", color: "#60a5fa", fontSize: "0.88rem", fontWeight: 600 }}>
            ✏️ You are editing a previously submitted transport form.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── SECTION 1: Primary Mode ── */}
          <div className="glass-card" style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 16px" }}>1. Primary Mode of Transport</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
              {MODES.map(m => (
                <button key={m.value} type="button" onClick={() => setMode(m.value)}
                  style={{
                    padding: "13px 16px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
                    fontWeight: mode === m.value ? 700 : 500, fontSize: "0.88rem",
                    background: mode === m.value ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${mode === m.value ? "var(--gold-solid, #d4af37)" : "rgba(255,255,255,0.1)"}`,
                    color: mode === m.value ? "var(--gold-solid, #d4af37)" : "var(--text-secondary)",
                    transition: "all 0.2s",
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── SECTION 2: Conditional Fields ── */}
          {mode && (
            <div className="glass-card" style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 16px" }}>2. Travel Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

                {isTrain && (
                  <>
                    <Field style={{ gridColumn: "1 / -1" }}>
                      {lbl("Train Name & Number", true)}
                      <input style={inp} placeholder="e.g. Rajdhani Express 12434" value={trainName} onChange={e => setTrainName(e.target.value)} />
                    </Field>
                    <Field>
                      {lbl("PNR Number")}
                      <input style={inp} placeholder="Optional" value={pnr} onChange={e => setPnr(e.target.value)} />
                    </Field>
                    <Field>
                      {lbl("Arrival Station", true)}
                      <input style={inp} placeholder="e.g. KSR City" value={arrivalStation} onChange={e => setArrivalStation(e.target.value)} />
                      <SuggestionRow suggestions={STATION_SUGGESTIONS} onPick={v => setArrivalStation(v)} />
                    </Field>
                  </>
                )}

                {isBusOrVehicle && (
                  <>
                    <Field>
                      {lbl("Vehicle Registration Number", true)}
                      <input style={inp} placeholder="e.g. KA 01 AB 1234" value={vehicleReg} onChange={e => setVehicleReg(e.target.value)} />
                    </Field>
                    <Field>
                      {lbl("Boarding City / Starting Point", true)}
                      <input style={inp} placeholder="e.g. Mysuru" value={boardingCity} onChange={e => setBoardingCity(e.target.value)} />
                    </Field>
                  </>
                )}

                {isPublicBus && (
                  <>
                    <Field>
                      {lbl("Route or Bus Number")}
                      <input style={inp} placeholder="Optional" value={routeNumber} onChange={e => setRouteNumber(e.target.value)} />
                    </Field>
                    <Field>
                      {lbl("Expected Bus Stand", true)}
                      <input style={inp} placeholder="e.g. Majestic" value={busStand} onChange={e => setBusStand(e.target.value)} />
                      <SuggestionRow suggestions={BUS_STAND_SUGGESTIONS} onPick={v => setBusStand(v)} />
                    </Field>
                  </>
                )}

                {isFlight && (
                  <>
                    <Field>
                      {lbl("Flight Number", true)}
                      <input style={inp} placeholder="e.g. 6E 204" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} />
                    </Field>
                    <Field>
                      {lbl("Arrival Terminal")}
                      <input style={{ ...inp, opacity: 0.7, cursor: "not-allowed" }} value="Kempegowda International Airport" readOnly />
                    </Field>
                  </>
                )}

                {isOther && (
                  <Field style={{ gridColumn: "1 / -1" }}>
                    {lbl("Description", true)}
                    <textarea style={{ ...inp, resize: "vertical", minHeight: "80px" }} rows={3}
                      placeholder="Describe your mode of transport…" value={description} onChange={e => setDescription(e.target.value)} />
                  </Field>
                )}

                <Field style={{ gridColumn: "1 / -1" }}>
                  {lbl("Estimated Arrival Date & Time", true)}
                  <input type="datetime-local" style={inp}
                    min={ARRIVAL_MIN} max={ARRIVAL_MAX}
                    value={eta} onChange={e => setEta(e.target.value)} />
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "4px" }}>
                    Must be between Apr 10 and Apr 14, 2026
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* ── SECTION 3: Passenger & Contact ── */}
          <div className="glass-card" style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 16px" }}>3. Passenger & Contact Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

              <Field style={{ gridColumn: "1 / -1" }}>
                {lbl("Total Headcount (students + accompanists + manager)", true)}
                <input type="number" min={1} style={inp} placeholder="e.g. 35" value={headcount} onChange={e => setHeadcount(e.target.value)} />
              </Field>

              <Field>
                {lbl("Contact Person Name", true)}
                <input style={inp} placeholder="Full name" value={contactName} onChange={e => setContactName(e.target.value)} />
              </Field>
              <Field>
                {lbl("Contact Person Phone", true)}
                <input type="tel" inputMode="numeric" maxLength={10} style={inp}
                  placeholder="10-digit number starting with 6–9" value={contactPhone}
                  onChange={e => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
                {contactPhone && !isValidPhone(contactPhone) && (
                  <div style={{ color: "#f87171", fontSize: "0.73rem", marginTop: "4px" }}>⚠ Must be 10 digits starting with 6, 7, 8, or 9</div>
                )}
              </Field>

              <Field style={{ gridColumn: "1 / -1" }}>
                {lbl("Is the contact person travelling with the group?", true)}
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  {[true, false].map(v => (
                    <button key={String(v)} type="button" onClick={() => setContactTravelling(v)}
                      style={{
                        padding: "9px 22px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem",
                        background: contactTravelling === v ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1.5px solid ${contactTravelling === v ? "var(--accent-success)" : "rgba(255,255,255,0.12)"}`,
                        color: contactTravelling === v ? "var(--accent-success)" : "var(--text-secondary)",
                        transition: "all 0.2s",
                      }}>
                      {v ? "✓ Yes" : "✗ No"}
                    </button>
                  ))}
                </div>
              </Field>

              {!contactTravelling && (
                <>
                  <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", color: "#fbbf24", fontSize: "0.82rem" }}>
                    ⚠️ Since the contact person won't be on the vehicle, please provide on-vehicle contact details.
                  </div>
                  <Field>
                    {lbl("On-Vehicle Contact Name", true)}
                    <input style={inp} placeholder="Name of person on vehicle" value={onVehicleName} onChange={e => setOnVehicleName(e.target.value)} />
                  </Field>
                  <Field>
                    {lbl("On-Vehicle Contact Phone", true)}
                    <input type="tel" inputMode="numeric" maxLength={10} style={inp}
                      placeholder="10-digit number starting with 6–9" value={onVehiclePhone}
                      onChange={e => setOnVehiclePhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
                    {onVehiclePhone && !isValidPhone(onVehiclePhone) && (
                      <div style={{ color: "#f87171", fontSize: "0.73rem", marginTop: "4px" }}>⚠ Must be 10 digits starting with 6, 7, 8, or 9</div>
                    )}
                  </Field>
                </>
              )}

              {!isOther && (
                <Field style={{ gridColumn: "1 / -1" }}>
                  {lbl("Additional Notes")}
                  <textarea style={{ ...inp, resize: "vertical", minHeight: "80px" }} rows={3}
                    placeholder="Any special requirements, delays expected, or other relevant info…"
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </Field>
              )}
            </div>
          </div>

          {/* ── SUBMIT ── */}
        <button className="neon-btn" type="submit" disabled={submitting || !mode}
            style={{ maxWidth: "320px", opacity: (!mode || submitting) ? 0.6 : 1 }}>
            {submitting ? "Submitting…" : "🚌 Submit Transport Details"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
