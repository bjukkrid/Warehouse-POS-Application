import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, Activity, Percent } from "lucide-react";
import { EmployeeService } from "../services/employee.service";
import type { Employee } from "../services/employee.service";

export default function AddEmployee() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<
    Partial<Employee> & { newRole?: string }
  >({
    name: "",
    role: "Cashier",
    newRole: "",
    passcode: "",
    phone: "",
    email: "",
    discountLimit: 0,
    status: "Active",
  });
  const [loading, setLoading] = useState(false);
  const [isNewRole, setIsNewRole] = useState(false);

  useEffect(() => {
    if (isEditing) {
      EmployeeService.getEmployee(Number(id)).then((data) => {
        if (data) {
          setFormData(data);
        }
      });
    }
  }, [id, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "discountLimit" ? Number(value) : value,
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "ADD_NEW") {
      setIsNewRole(true);
      setFormData({ ...formData, role: "" });
    } else {
      setIsNewRole(false);
      setFormData({ ...formData, role: e.target.value });
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("Employee name is required.");
      return;
    }

    const finalRole = isNewRole ? formData.newRole : formData.role;
    if (!finalRole) {
      alert("Employee role is required.");
      return;
    }

    if (!window.confirm("Are you sure you want to save this employee data?")) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        role: finalRole,
        passcode: formData.passcode || "0000",
      };
      delete payload.newRole;

      if (isEditing) {
        await EmployeeService.updateEmployee(Number(id), payload);
      } else {
        await EmployeeService.addEmployee(payload);
      }
      navigate("/employees");
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to save employee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 1000 }}>
      {/* Header */}
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
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Employees <span style={{ margin: "0 8px" }}>/</span>{" "}
            {isEditing ? "Edit" : "Add"} Employee
          </div>
          <h1 style={{ fontSize: 28 }}>
            {isEditing ? "Edit Employee" : "Add New Employee"}
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Fill in the information below to add or update staff data.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn-outline"
            onClick={() => navigate("/employees")}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Employee"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
          maxWidth: 640,
        }}
      >
        <div className="card">
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 16,
              marginBottom: 24,
            }}
          >
            <User size={20} color="var(--primary)" /> Staff Information
          </h3>

          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. John Doe"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Role *</label>
              {isNewRole ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    name="newRole"
                    value={formData.newRole || ""}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="New Role Name"
                    autoFocus
                  />
                  <button
                    className="btn-outline"
                    onClick={() => setIsNewRole(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  name="role"
                  value={formData.role || ""}
                  onChange={handleRoleChange}
                  className="form-input"
                >
                  <option value="">Select a role</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Admin">Admin</option>
                  <option value="Warehouse Staff">Warehouse Staff</option>
                  <option
                    value="ADD_NEW"
                    style={{ fontWeight: 600, color: "var(--primary)" }}
                  >
                    + Add New Role
                  </option>
                </select>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="employee@company.com"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="Phone Number"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 16,
              marginBottom: 24,
            }}
          >
            <Percent size={20} color="var(--primary)" /> Store Permissions
          </h3>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Max Allowed POS Discount %</label>
              <input
                type="number"
                name="discountLimit"
                value={formData.discountLimit || 0}
                onChange={handleChange}
                className="form-input"
                placeholder="0 - 100"
                min={0}
                max={100}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 16,
              marginBottom: 24,
            }}
          >
            <Activity size={20} color="var(--primary)" /> Status
          </h3>
          <div style={{ display: "flex", gap: 16 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 24,
                  background:
                    formData.status === "Active" ? "var(--primary)" : "#cbd5e1",
                  borderRadius: 12,
                  position: "relative",
                  transition: "background 0.2s",
                }}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    status: prev.status === "Active" ? "Inactive" : "Active",
                  }))
                }
              >
                <div
                  style={{
                    position: "absolute",
                    left: formData.status === "Active" ? 22 : 2,
                    top: 2,
                    width: 20,
                    height: 20,
                    background: "white",
                    borderRadius: "50%",
                    transition: "left 0.2s",
                  }}
                />
              </div>
              <span style={{ fontWeight: 500 }}>
                {formData.status === "Active" ? "Active" : "Inactive"}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
