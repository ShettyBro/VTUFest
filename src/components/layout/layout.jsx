import Navbar from "./navbar";
import Sidebar from "./sidebar";
import "../../styles/layout.css";

export default function Layout({ children }) {
  const role = localStorage.getItem("role") || "student";

  return (
    <div className="layout">
      <Navbar role={role} />
      <Sidebar role={role} />
      <main className="content">
        {children}
      </main>
    </div>
  );
}
