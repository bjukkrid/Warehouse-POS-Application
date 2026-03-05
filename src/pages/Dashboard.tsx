import { useEffect, useState } from "react";
import { ShoppingCart, Package, AlertTriangle, Users } from "lucide-react";
import {
  DashboardService,
  type DashboardStats as Stats,
} from "../services/dashboard.service";

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    DashboardService.getDashboardStats().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="page-content">
      <div
        className="header"
        style={{
          padding: 0,
          border: "none",
          marginBottom: 32,
          background: "transparent",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28 }}>Dashboard Overview</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Welcome back, Manager Alex
          </p>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            className="badge badge-success"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--success)",
              }}
            ></span>
            Online & Synced
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div
          className="card stat-card"
          style={{
            borderColor: "var(--success)",
            borderWidth: "2px 1px 1px 1px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "#e0e7ff",
              padding: 12,
              borderRadius: "50%",
              color: "var(--primary)",
            }}
          >
            <ShoppingCart size={24} />
          </div>
          <span className="stat-label">Total Sales Today</span>
          <span className="stat-value">
            ฿{stats?.totalSales.toFixed(2) || "0.00"}
          </span>
        </div>
        <div className="card stat-card">
          <div
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "#f1f5f9",
              padding: 12,
              borderRadius: "50%",
              color: "var(--text-muted)",
            }}
          >
            <Package size={24} />
          </div>
          <span className="stat-label">Transactions</span>
          <span className="stat-value">{stats?.transactions || 0}</span>
        </div>
        <div
          className="card stat-card"
          style={{ background: "var(--danger-bg)", borderColor: "#fecaca" }}
        >
          <div
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "#fee2e2",
              padding: 12,
              borderRadius: "50%",
              color: "var(--danger)",
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <span className="stat-label" style={{ color: "var(--danger)" }}>
            Low Stock Alerts
          </span>
          <span className="stat-value" style={{ color: "var(--danger)" }}>
            {stats?.lowStockCount || 0}{" "}
            <span style={{ fontSize: 16, fontWeight: 500 }}>items</span>
          </span>
          <span
            style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600 }}
          >
            ↓ Critical levels
          </span>
        </div>
        <div className="card stat-card">
          <div
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "#e0e7ff",
              padding: 12,
              borderRadius: "50%",
              color: "var(--primary)",
            }}
          >
            <Users size={24} />
          </div>
          <span className="stat-label">Active Staff</span>
          <span className="stat-value">{stats?.activeStaff || 0}</span>
        </div>
      </div>

      {/* Dashboard tables or charts placeholders */}
      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: "24px 24px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            Low Stock Alerts
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Items below reorder level requiring immediate attention.
          </p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Stock Level</th>
            </tr>
          </thead>
          <tbody>
            {!stats?.lowStockItems || stats.lowStockItems.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: "24px",
                    color: "var(--text-muted)",
                  }}
                >
                  All items are sufficiently stocked.
                </td>
              </tr>
            ) : (
              stats.lowStockItems.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {item.brand || "No Brand"}
                    </div>
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      color: "var(--text-muted)",
                    }}
                  >
                    {item.sku || "N/A"}
                  </td>
                  <td>
                    <span className="badge" style={{ background: "#f1f5f9" }}>
                      {item.category || "Uncategorized"}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-danger">{item.stock}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
