import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { InventoryService } from "../services/inventory.service";

interface Product {
  id: number;
  name: string;
  category: string;
  basePrice: number;
  stock: number;
  sku: string;
  lowStockAlert: number;
  status: string;
  images?: string;
  updatedAt?: string;
}

export default function Inventory() {
  const navigate = useNavigate();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter/Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [stockStatus, setStockStatus] = useState("Stock Status");
  const [status, setStatus] = useState("Product Status");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allRes = await InventoryService.getProductsPaginated({
          limit: 1000,
        });
        const uniqueCategories = Array.from(
          new Set(
            allRes.data.map((p: any) => p.category as string).filter(Boolean),
          ),
        );
        setCategories(uniqueCategories);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    };
    fetchCategories();
  }, []);

  const getProductImage = (imagesStr?: string) => {
    if (!imagesStr) return null;
    try {
      const images = JSON.parse(imagesStr);
      if (Array.isArray(images) && images.length > 0) {
        return images[0].replace("file://", "local://");
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // Load backend data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await InventoryService.getProductsPaginated({
        page,
        limit,
        search,
        category,
        stockStatus,
        status,
        sortBy,
        sortOrder,
      });
      setProducts(response.data);
      setTotal(response.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, category, stockStatus, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selection Handlers
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Delete Handlers
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.length} item(s)? This action cannot be undone.`,
      )
    ) {
      setLoading(true);
      const success = await InventoryService.deleteProducts(selectedIds);
      if (success) {
        setSelectedIds([]);
        fetchData(); // Refresh data
      } else {
        alert("Failed to delete selected items.");
        setLoading(false);
      }
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setLoading(true);
      const success = await InventoryService.deleteProduct(id);
      if (success) {
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        fetchData();
      } else {
        alert("Failed to delete product.");
        setLoading(false);
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page
  };

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

  return (
    <div className="page-content">
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
          <h1 style={{ fontSize: 28 }}>Inventory</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Manage your product stock levels and pricing.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {selectedIds.length > 0 && (
            <button
              className="btn-outline"
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
              onClick={handleDeleteSelected}
            >
              <Trash2 size={18} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          {/* <button className="btn-outline">
            <Download size={18} /> Export CSV
          </button> */}
          <button
            className="btn-primary"
            onClick={() => navigate("/inventory/add")}
          >
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {/* Toolbar */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            gap: 16,
            borderBottom: "1px solid var(--border)",
            flexWrap: "wrap",
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
              placeholder="Search by product name, SKU, or category"
              className="form-input"
              style={{ paddingLeft: 42, background: "#f8fafc" }}
              value={search}
              onChange={handleSearch}
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
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option>All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ width: 140 }}
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
            >
              <option>Stock Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
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
              <option>Product Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={
                      products.length > 0 &&
                      selectedIds.length === products.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("name")}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Product <SortIcon field="name" />
                  </div>
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("sku")}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    SKU <SortIcon field="sku" />
                  </div>
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("category")}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Category <SortIcon field="category" />
                  </div>
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("status")}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Status <SortIcon field="status" />
                  </div>
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("stock")}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Stock Level <SortIcon field="stock" />
                  </div>
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("basePrice")}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Price <SortIcon field="basePrice" />
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "32px 0",
                      color: "var(--text-muted)",
                    }}
                  >
                    Loading data...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "32px 0",
                      color: "var(--text-muted)",
                    }}
                  >
                    No products found matching your criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        {getProductImage(p.images) ? (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              background: "#f1f5f9",
                              borderRadius: 8,
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              src={getProductImage(p.images)}
                              alt={p.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              background: "#f1f5f9",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>
                              IMG
                            </span>
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div
                            style={{ fontSize: 12, color: "var(--text-muted)" }}
                          >
                            ID: {p.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        fontFamily: "monospace",
                        color: "var(--primary)",
                        fontSize: 13,
                      }}
                    >
                      {p.sku || "-"}
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            p.status === "Published"
                              ? "#dcfce7"
                              : p.status === "Draft"
                                ? "#fef9c3"
                                : "#f1f5f9",
                          color:
                            p.status === "Published"
                              ? "#166534"
                              : p.status === "Draft"
                                ? "#854d0e"
                                : "#475569",
                          fontWeight: 500,
                        }}
                      >
                        ● {p.status || "Published"}
                      </span>
                    </td>
                    <td>
                      {p.stock <= p.lowStockAlert ? (
                        <span className="badge badge-danger">
                          ● Low Stock ({p.stock})
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          ● In Stock ({p.stock})
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      ฿{p.basePrice?.toFixed(2) || "0.00"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn-outline"
                          style={{ padding: "6px 12px", fontSize: 13 }}
                          onClick={() => navigate(`/inventory/edit/${p.id}`)}
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
                          onClick={() => handleDeleteItem(p.id)}
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
          }}
        >
          <span>
            Showing{" "}
            <strong>
              {(page - 1) * limit + (products.length > 0 ? 1 : 0)}
            </strong>{" "}
            to <strong>{(page - 1) * limit + products.length}</strong> of{" "}
            <strong>{total}</strong> results
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
                  max={Math.max(1, Math.ceil(total / limit))}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      // Allow clearing while typing
                      return;
                    }
                    let p = Number(val);
                    const maxPage = Math.ceil(total / limit);
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
                <span>/ {Math.max(1, Math.ceil(total / limit))}</span>
              </div>

              <button
                className="btn-outline"
                disabled={page * limit >= total}
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
