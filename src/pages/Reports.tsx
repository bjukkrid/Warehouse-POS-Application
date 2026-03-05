import { useEffect, useState, Fragment } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { ReportService, type Sale } from "../services/report.service";
import * as XLSX from "xlsx";

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await ReportService.getSalesPaginated({
        page,
        limit,
      });
      setSales(res.data);
      setTotalCount(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, limit]);

  return (
    <div className="page-container" style={{ padding: "24px" }}>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FileText size={28} />
            Sales Reports
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
            View transaction history and sales data.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn-outline"
            onClick={async () => {
              setLoading(true);
              try {
                const allSales = await ReportService.getAllSales();
                let exportData: any[] = [];

                allSales.forEach((sale) => {
                  if (sale.items && sale.items.length > 0) {
                    sale.items.forEach((item) => {
                      exportData.push({
                        "Order ID": sale.id,
                        Date: new Date(sale.createdAt).toLocaleString(),
                        "Employee Name": sale.employeeName || "No Employee",
                        "Order Total Amount": sale.totalAmount,
                        "Order Discount": sale.discountAmount || 0,
                        "Product ID": item.productId,
                        "Product Name": item.productName || "Unknown",
                        Quantity: item.quantity,
                        "Price At Time": item.priceAtTime,
                        "Item Total": (
                          item.quantity * item.priceAtTime
                        ).toFixed(2),
                      });
                    });
                  } else {
                    exportData.push({
                      "Order ID": sale.id,
                      Date: new Date(sale.createdAt).toLocaleString(),
                      "Employee Name": sale.employeeName || "No Employee",
                      "Order Total Amount": sale.totalAmount,
                      "Order Discount": sale.discountAmount || 0,
                      "Product ID": "",
                      "Product Name": "",
                      Quantity: "",
                      "Price At Time": "",
                      "Item Total": "",
                    });
                  }
                });

                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
                XLSX.writeFile(
                  wb,
                  `Sales_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
                );
              } catch (err) {
                console.error("Failed to export:", err);
                alert("Failed to export data");
              } finally {
                setLoading(false);
              }
            }}
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            className="table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th
                  style={{
                    padding: "12px 24px",
                    width: 48,
                    textAlign: "center",
                  }}
                ></th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  Order ID
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  Date & Time
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  Handled By
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  Discount
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  Total Amount
                </th>
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
              ) : sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "32px 0" }}
                  >
                    No sales records found.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <Fragment key={s.id}>
                    <tr
                      style={{
                        borderBottom:
                          expandedId === s.id
                            ? "none"
                            : "1px solid var(--border)",
                        cursor: "pointer",
                        background:
                          expandedId === s.id ? "#f8fafc" : "transparent",
                      }}
                      onClick={() =>
                        setExpandedId(expandedId === s.id ? null : s.id)
                      }
                    >
                      <td
                        style={{
                          padding: "12px 24px",
                          textAlign: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        {expandedId === s.id ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </td>
                      <td style={{ padding: "12px 24px", fontWeight: 600 }}>
                        #{s.id}
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        {new Date(s.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 24px" }}>
                        {s.employeeName ? (
                          s.employeeName
                        ) : (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontStyle: "italic",
                            }}
                          >
                            No Employee
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 24px",
                          color:
                            s.discountAmount > 0 ? "var(--danger)" : "inherit",
                        }}
                      >
                        {s.discountAmount > 0 ? (
                          <>
                            -฿{s.discountAmount.toFixed(2)}
                            <span
                              style={{
                                fontSize: 11,
                                background: "#fee2e2",
                                padding: "2px 6px",
                                borderRadius: 4,
                                marginLeft: 6,
                              }}
                            >
                              {s.discountPercentage}%
                            </span>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 24px",
                          fontWeight: 700,
                          color: "var(--success)",
                        }}
                      >
                        ฿{s.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                    {expandedId === s.id && (
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: "#f8fafc",
                        }}
                      >
                        <td colSpan={6} style={{ padding: "0 24px 24px 24px" }}>
                          <div
                            style={{
                              background: "white",
                              padding: 16,
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                            }}
                          >
                            <h4
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                marginBottom: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Package size={14} /> Order Items
                            </h4>
                            <table
                              style={{
                                width: "100%",
                                fontSize: 13,
                                borderCollapse: "collapse",
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    borderBottom: "1px solid var(--border)",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  <th
                                    style={{
                                      textAlign: "center",
                                      padding: "8px 12px",
                                      fontWeight: 500,
                                      width: 100,
                                    }}
                                  >
                                    Product ID
                                  </th>
                                  <th
                                    style={{
                                      textAlign: "left",
                                      padding: "8px 12px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Product Name
                                  </th>
                                  <th
                                    style={{
                                      textAlign: "right",
                                      padding: "8px 12px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Qty
                                  </th>
                                  <th
                                    style={{
                                      textAlign: "right",
                                      padding: "8px 12px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Price at Sale
                                  </th>
                                  <th
                                    style={{
                                      textAlign: "right",
                                      padding: "8px 12px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Item Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.items && s.items.length > 0 ? (
                                  s.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td
                                        style={{
                                          padding: "8px 12px",
                                          textAlign: "right",
                                        }}
                                      >
                                        {item.productId}
                                      </td>
                                      <td style={{ padding: "8px 12px" }}>
                                        {item.productName || "Unknown Product"}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 12px",
                                          textAlign: "right",
                                        }}
                                      >
                                        {item.quantity}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 12px",
                                          textAlign: "right",
                                        }}
                                      >
                                        ฿{item.priceAtTime.toFixed(2)}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 12px",
                                          textAlign: "right",
                                          fontWeight: 600,
                                        }}
                                      >
                                        ฿
                                        {(
                                          item.quantity * item.priceAtTime
                                        ).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      style={{
                                        padding: "8px 0",
                                        textAlign: "center",
                                        fontStyle: "italic",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      No items found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
            <strong>{(page - 1) * limit + (sales.length > 0 ? 1 : 0)}</strong>{" "}
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
                    if (val === "") return;
                    let p = Number(val);
                    const maxPage = Math.ceil(totalCount / limit);
                    if (p < 1) p = 1;
                    if (p > maxPage) p = maxPage;
                    setPage(p);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") setPage(1);
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
