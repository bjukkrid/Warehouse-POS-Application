import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { EmployeeService } from "../services/employee.service";
import type { Employee } from "../services/employee.service";
import { useNavigate } from "react-router-dom";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [role, setRole] = useState("All Roles");
  const [status, setStatus] = useState("All Status");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await EmployeeService.getEmployeesPaginated({
        page,
        limit,
        search,
        role,
        status,
        sortBy,
        sortOrder,
      });
      setEmployees(res.data);
      setTotalCount(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, role, status, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(), 300);
    return () => clearTimeout(timer);
  }, [search, fetchEmployees]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field)
      return <ArrowUpDown size={14} style={{ opacity: 0.3, marginLeft: 6 }} />;
    return sortOrder === "asc" ? (
      <ArrowUp size={14} style={{ marginLeft: 6, color: "var(--primary)" }} />
    ) : (
      <ArrowDown size={14} style={{ marginLeft: 6, color: "var(--primary)" }} />
    );
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      await EmployeeService.deleteEmployee(id);
      fetchEmployees();
    }
  };

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
          <h1 style={{ fontSize: 28 }}>Employees</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Manage staff members and their access levels.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn-primary"
            onClick={() => navigate("/employees/add")}
          >
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div
              style={{ position: "relative", flex: "1 1 300px", maxWidth: 400 }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: 14,
                  top: 12,
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search by name, email, or phone"
                className="form-input"
                style={{ paddingLeft: 42, background: "#f8fafc" }}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginLeft: "auto",
                flexWrap: "wrap",
              }}
            >
              <select
                className="form-input"
                style={{ width: 140 }}
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All Roles">All Roles</option>
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Admin">Admin</option>
                <option value="Warehouse Staff">Warehouse Staff</option>
              </select>
              <select
                className="form-input"
                style={{ width: 140 }}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("id")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    ID <SortIcon field="id" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("name")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Name <SortIcon field="name" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("role")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Role <SortIcon field="role" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Status <SortIcon field="status" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("discountLimit")}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Discount Limit <SortIcon field="discountLimit" />
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "32px 0" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "32px 0" }}
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td>{e.role}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            e.status === "Active" ? "#dcfce7" : "#f1f5f9",
                          color: e.status === "Active" ? "#166534" : "#475569",
                        }}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td>{e.discountLimit}%</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn-outline"
                          style={{ padding: "6px 12px" }}
                          onClick={() => navigate(`/employees/edit/${e.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-outline"
                          style={{
                            padding: "6px 8px",
                            color: "var(--danger)",
                            borderColor: "transparent",
                          }}
                          onClick={() => e.id && handleDelete(e.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div
          style={{
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "var(--text-muted)",
            fontSize: 14,
            borderTop: "1px solid var(--border)",
          }}
        >
          <span>
            Showing{" "}
            <strong>
              {(page - 1) * limit + (employees.length > 0 ? 1 : 0)}
            </strong>{" "}
            to <strong>{Math.min(page * limit, totalCount)}</strong> of{" "}
            <strong>{totalCount}</strong> results
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Rows per page:</span>
              <select
                className="form-input"
                style={{
                  padding: "4px 8px",
                  paddingRight: 32,
                  minHeight: "auto",
                  height: 32,
                  width: 80,
                }}
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="btn-outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ padding: "4px 8px", height: 32 }}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  className="form-input"
                  style={{
                    width: 50,
                    padding: "4px",
                    minHeight: "auto",
                    height: 32,
                    textAlign: "center",
                  }}
                  value={page}
                  min={1}
                  max={Math.max(1, Math.ceil(totalCount / limit))}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      // Allow clearing while typing
                      return;
                    }
                    let p = Number(val);
                    const maxPage = Math.ceil(totalCount / limit);
                    if (p < 1) p = 1;
                    if (p > maxPage) p = maxPage;
                    setPage(p);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      setPage(1);
                    }
                  }}
                />
                <span>/ {Math.max(1, Math.ceil(totalCount / limit))}</span>
              </div>

              <button
                className="btn-outline"
                disabled={page * limit >= totalCount}
                onClick={() => setPage(page + 1)}
                style={{ padding: "4px 8px", height: 32 }}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
