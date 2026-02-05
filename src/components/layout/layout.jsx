import Navbar from "./navbar";
import Sidebar from "./sidebar";
import "../../styles/layout.css";

export default function Layout({ children, hasApplication = false }) {
  const role = localStorage.getItem("role") || "student";

  return (
    <div className="layout">
      <Navbar role={role} />
      <Sidebar role={role} hasApplication={hasApplication} />
      <main className="content">
        {children}
      </main>
    </div>
  );
}