import { useState, useEffect } from "react";
import { Search, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { InventoryService } from "../services/inventory.service";
import { EmployeeService } from "../services/employee.service";
import type { Employee } from "../services/employee.service";
interface Product {
  id: number;
  name: string;
  category: string;
  basePrice: number;
  sku: string;
  stock: number;
  images?: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeSuggestions, setEmployeeSuggestions] = useState<Employee[]>(
    [],
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [discountAmount, setDiscountAmount] = useState(0);

  // Recalculate discount if cart changes
  useEffect(() => {
    if (selectedEmployee && selectedEmployee.discountLimit) {
      const sub = cart.reduce(
        (sum, item) => sum + item.basePrice * item.quantity,
        0,
      );
      setDiscountAmount(sub * (selectedEmployee.discountLimit / 100));
    } else {
      setDiscountAmount(0);
    }
  }, [cart, selectedEmployee]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [categories, setCategories] = useState<string[]>([]);

  const fetchProductsAndCategories = async () => {
    try {
      // Use paginated or all to get categories
      const allRes = await InventoryService.getProductsPaginated({
        limit: 1000,
        status: "Published",
      });
      const uniqueCategories = Array.from(
        new Set(allRes.data.map((p) => p.category as string).filter(Boolean)),
      );
      setCategories(uniqueCategories);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await InventoryService.getProductsPaginated({
        search: searchTerm,
        category:
          selectedCategory === "All Items"
            ? "All Categories"
            : selectedCategory,
        status: "Published",
        limit: 100,
      });
      setProducts(res.data);
    } catch (e) {
      console.error("Failed to load products", e);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const getProductImage = (imagesStr?: string) => {
    if (!imagesStr) return null;
    try {
      const imgs = JSON.parse(imagesStr);
      if (Array.isArray(imgs) && imgs.length > 0) {
        return imgs[0].replace("file://", "local://");
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      }),
    );
  };

  useEffect(() => {
    if (!employeeSearch) {
      setEmployeeSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await EmployeeService.getEmployees(employeeSearch);
        setEmployeeSuggestions(res.filter((e) => e.status === "Active"));
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  const applyEmployeeDiscount = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeSearch("");
    setEmployeeSuggestions([]);

    if (employee.discountLimit && employee.discountLimit > 0) {
      alert(`${employee.name} (${employee.discountLimit}%) discount applied!`);
    } else {
      alert(`${employee.name} has no discount allowance.`);
    }
  };

  const removeEmployeeDiscount = () => {
    setSelectedEmployee(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    const payload = {
      employeeId: selectedEmployee?.id || null, // use selected employee or null
      totalAmount: total,
      discountAmount,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        priceAtTime: item.basePrice,
      })),
    };

    // @ts-ignore
    if (window.ipcRenderer) {
      // @ts-ignore
      const res = await window.ipcRenderer.invoke("process-checkout", payload);
      if (res.success) {
        alert("Checkout Successful! Order #" + res.saleId);
        setCart([]);
        setDiscountAmount(0);
        setSelectedEmployee(null);
      } else {
        alert("Error: " + res.error);
      }
    } else {
      alert("Checkout mock success!");
      setCart([]);
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.basePrice * item.quantity,
    0,
  );
  const tax = (subtotal - discountAmount) * 0.08; // 8% tax
  const total = subtotal - discountAmount + tax;

  return (
    <div
      className="page-content"
      style={{ padding: "24px 32px", height: "100%" }}
    >
      {/* Header */}
      <div
        className="header"
        style={{
          padding: 0,
          border: "none",
          marginBottom: 24,
          background: "transparent",
        }}
      >
        <div style={{ position: "relative", flex: 1, maxWidth: 480 }}>
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
            placeholder="Scan barcode or search products... (Cmd+K)"
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: 42,
              background: "white",
              borderColor: "var(--primary)",
              boxShadow: "0 0 0 2px rgba(37,99,235,0.1)",
              width: "380px",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <select
            className="form-input"
            style={{ width: 200, padding: "8px 12px" }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All Items">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pos-layout">
        <div className="pos-products">
          {products.map((p) => (
            <div
              key={p.id}
              className="pos-product-card"
              onClick={() => addToCart(p)}
            >
              {getProductImage(p.images) ? (
                <div
                  style={{
                    height: 120,
                    borderRadius: 8,
                    marginBottom: 12,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={getProductImage(p.images)!}
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
                    background: "#f1f5f9",
                    height: 120,
                    borderRadius: 8,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  Img
                </div>
              )}
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  lineHeight: 1.3,
                  marginBottom: 4,
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                SKU: {p.sku}
              </div>
              <div className="pos-product-price">฿{p.basePrice.toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="pos-cart">
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Checkout Cart{" "}
              <span
                className="badge badge-success"
                style={{
                  background: "#e0e7ff",
                  color: "var(--primary)",
                  fontSize: 11,
                }}
              >
                {cart.length} Items
              </span>
            </h2>
            <button
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
              onClick={() => setCart([])}
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="pos-cart-items">
            {cart.map((item) => (
              <div key={item.id} className="pos-cart-item">
                <div style={{ display: "flex", gap: 12, flex: 1 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: "#f1f5f9",
                      borderRadius: 8,
                    }}
                  ></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 6,
                      }}
                    >
                      ฿{item.basePrice.toFixed(2)} / unit
                    </div>
                    <div className="quantity-control">
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        -
                      </button>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          minWidth: 20,
                          textAlign: "center",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  ฿{(item.basePrice * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--text-muted)",
                }}
              >
                <ShoppingBag
                  size={48}
                  style={{ opacity: 0.2, margin: "0 auto 16px" }}
                />
                <p>Cart is empty</p>
                <p style={{ fontSize: 12 }}>
                  Scan items or select from the list
                </p>
              </div>
            )}
          </div>

          <div className="pos-cart-footer">
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              EMPLOYEE APP DISCOUNT
            </div>

            {selectedEmployee ? (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#f1f5f9",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {selectedEmployee.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {selectedEmployee.role} • {selectedEmployee.discountLimit}%
                    Limit
                  </div>
                </div>
                <button
                  className="btn-outline"
                  style={{
                    padding: "4px 8px",
                    borderColor: "transparent",
                    color: "var(--danger)",
                  }}
                  onClick={removeEmployeeDiscount}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div style={{ position: "relative", marginBottom: 20 }}>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search Employee by Name, Phone, or Email"
                  className="form-input"
                  style={{ width: "100%" }}
                />
                {employeeSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "white",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      marginTop: 4,
                      zIndex: 10,
                      maxHeight: 150,
                      overflowY: "auto",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  >
                    {employeeSuggestions.map((e) => (
                      <div
                        key={e.id}
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                        onClick={() => applyEmployeeDiscount(e)}
                      >
                        <div style={{ fontWeight: 600 }}>{e.name}</div>
                        <div
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          {e.role}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 14,
                color: "var(--text-muted)",
              }}
            >
              <span>Subtotal</span>
              <span>฿{subtotal.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 14,
                color: "var(--success)",
              }}
            >
              <span>
                Discount {discountAmount > 0 ? "(Applied)" : "(None)"}
              </span>
              <span>-฿{discountAmount.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
                fontSize: 14,
                color: "var(--text-muted)",
              }}
            >
              <span>Tax (8%)</span>
              <span>฿{tax.toFixed(2)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700 }}>Total</span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                ฿{Math.max(0, total).toFixed(2)}
              </span>
            </div>

            <button
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "14px",
                fontSize: 16,
              }}
              onClick={handleCheckout}
            >
              Checkout <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
