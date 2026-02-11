import { useState, useEffect } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import "../../styles/layout.css";

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api/student/dashboard";

export default function Layout({ children, hasApplication: hasApplicationProp }) {
  const role = localStorage.getItem("role") || "student";
  const [hasApplication, setHasApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasApplicationProp !== undefined) {
      setHasApplication(hasApplicationProp);
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
        }
      } catch (error) {
        console.error("Error fetching application status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationStatus();
  }, [role, hasApplicationProp]);

  return (
    <div className="layout">
      <Navbar role={role} />
      {!isLoading && <Sidebar role={role} hasApplication={hasApplication || false} />}
      <main className="content">
        {children}
      </main>
    </div>
  );
}