import { HashRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  MonitorSmartphone,
  Users,
  FileText,
  Settings,
  LogOut,
  Store,
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import POS from "./pages/POS";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import Reports from "./pages/Reports";

function App() {
  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div
              style={{
                background: "var(--primary)",
                color: "white",
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Store size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>LocalPOS</h2>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                v1.0.0 • Enterprise
              </span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94a3b8",
                margin: "16px 16px 8px",
                letterSpacing: "1px",
              }}
            >
              MENU
            </span>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <Package size={20} />
              Inventory
            </NavLink>
            <NavLink
              to="/pos"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <MonitorSmartphone size={20} />
              POS Terminal
            </NavLink>
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <Users size={20} />
              Employees
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <FileText size={20} />
              Reports
            </NavLink>
            <div style={{ flex: 1 }}></div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94a3b8",
                margin: "16px 16px 8px",
                letterSpacing: "1px",
              }}
            >
              SYSTEM
            </span>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <Settings size={20} />
              Settings
            </NavLink>
            <div
              className="nav-item"
              style={{ marginTop: "auto" }}
              onClick={() => console.log("Logout")}
            >
              <LogOut size={20} />
              Log Out
            </div>
          </nav>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/add" element={<AddProduct />} />
            <Route path="/inventory/edit/:id" element={<EditProduct />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/add" element={<AddEmployee />} />
            <Route path="/employees/edit/:id" element={<AddEmployee />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
