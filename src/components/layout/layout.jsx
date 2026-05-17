import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import MobileTopBar from "./MobileTopBar";
import MobileBottomNav from "./MobileBottomNav";
import MobileInstallBanner from "./MobileInstallBanner";
import "../../styles/layout-glass.css";
import "../../styles/mobile-layout.css";
import { isPhysicalMobile } from "../../utils/deviceDetect";

const API_BASE_URL = "https://api.vtufest2026.acharyahabba.com/api/student/dashboard";
const DASHBOARD_PATHS = ["/dashboard", "/principal-dashboard", "/manager-dashboard", "/student-application"];

export default function Layout({ children, hasApplication: hasApplicationProp, collegeLocked: collegeLockedProp }) {
  const role = localStorage.getItem("vtufest_role") || localStorage.getItem("role") || "student";
  const location = useLocation();
  const isDashboard = DASHBOARD_PATHS.includes(location.pathname);
  const [hasApplication, setHasApplication] = useState(null);
  const [collegeLocked, setCollegeLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsData, setNotificationsData] = useState([]);
  // Physical screen detection — bypasses 'Desktop mode' on phones
  const isMobile = isPhysicalMobile();

  useEffect(() => {
    if (hasApplicationProp !== undefined) {
      setHasApplication(hasApplicationProp);
    }
    if (collegeLockedProp !== undefined) {
      setCollegeLocked(collegeLockedProp);
    }
    if (hasApplicationProp !== undefined && collegeLockedProp !== undefined) {
      setIsLoading(false);
      return;
    }

    if (role !== "student") {
      setIsLoading(false);
      return;
    }

    const fetchApplicationStatus = async () => {
      const token = localStorage.getItem("vtufest_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

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
          setCollegeLocked(data.data?.college?.is_locked === true);
        }
      } catch (error) {
        // silent
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationStatus();
  }, [role, hasApplicationProp, collegeLockedProp]);

  // Fetch notifications for mobile top bar
  useEffect(() => {
    if (!isMobile) return;
    fetch("https://api.vtufest2026.acharyahabba.com/api/shared/notifications")
      .then(r => r.json())
      .then(d => { if (d.success) setNotificationsData(d.data); })
      .catch(() => { });
  }, [isMobile]);

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="layout">
        {/* Mobile Top App Bar */}
        <MobileTopBar notificationsData={notificationsData} />

        {/* Main Content — CSS in mobile-layout.css handles all offsets via --mtb-h / --mcs-h tokens */}
        <main
          className="mobile-content"
          data-dashboard={isDashboard ? "1" : "0"}
          style={{ position: "relative", marginLeft: 0, width: "100%" }}
        >
          {children}
        </main>

        {/* PWA Install Banner (sits above bottom nav) */}
        <MobileInstallBanner />

        {/* Mobile Bottom Nav */}
        {!isLoading && (
          <MobileBottomNav
            role={role}
            hasApplication={hasApplication || false}
            collegeLocked={collegeLocked}
          />
        )}

      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────────
  return (
    <div className="layout">
      <Navbar role={role} />
      {!isLoading && <Sidebar role={role} hasApplication={hasApplication || false} collegeLocked={collegeLocked} />}
      <main className="content">
        {children}
      </main>
    </div>
  );
}