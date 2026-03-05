import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  DollarSign,
  Tag,
  Image as ImageIcon,
  X,
  Zap,
  Maximize2,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { InventoryService } from "../services/inventory.service";

interface ImageData {
  id: string;
  file: File;
  preview: string;
  base64Data?: string;
}

export default function AddProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    newCategory: "",
    brand: "",
    description: "",
    basePrice: "",
    cost: "",
    sku: "",
    barcode: "",
    stock: "",
    lowStockAlert: "10",
  });

  const [isNewCategory, setIsNewCategory] = useState(false);
  const [status, setStatus] = useState("Published");
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "ADD_NEW") {
      setIsNewCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setIsNewCategory(false);
      setFormData({ ...formData, category: e.target.value });
    }
  };

  const generateSKU = () => {
    const prefix = formData.category
      ? formData.category.substring(0, 3).toUpperCase()
      : "PRD";
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    setFormData({ ...formData, sku: `${prefix}-${randomCode}` });
  };

  const toggleStatus = () => {
    setStatus((prev) => (prev === "Published" ? "Draft" : "Published"));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setLoading(true);
    const newFiles = Array.from(e.target.files);

    // Check limit
    if (images.length + newFiles.length > 10) {
      alert("You can only upload up to 10 images.");
      setLoading(false);
      return;
    }

    const processedImages: ImageData[] = [];

    // Compress options
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    try {
      for (const file of newFiles) {
        // Compress
        const compressedBlob = await imageCompression(file, options);
        // Create new file from blob
        const compressedFile = new File([compressedBlob], file.name, {
          type: file.type,
        });

        // Convert to base64 for submission
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

        processedImages.push({
          id: Math.random().toString(36).substring(7),
          file: compressedFile,
          preview: URL.createObjectURL(compressedFile),
          base64Data,
        });
      }

      setImages((prev) => [...prev, ...processedImages].slice(0, 10));
    } catch (error) {
      console.error("Error compressing image", error);
      alert("Failed to process images.");
    } finally {
      setLoading(false);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idToRemove: string) => {
    setImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert("Product name is required.");
      return;
    }

    if (!window.confirm("Are you sure you want to save this new product?")) {
      return;
    }

    setLoading(true);
    try {
      const finalCategory = isNewCategory
        ? formData.newCategory
        : formData.category;

      // Save images through IPC first if any
      let savedImagePaths: string[] = [];
      if (images.length > 0) {
        const imagePayload = images.map((img) => ({
          base64Data: img.base64Data!,
          filename: img.file.name,
        }));
        savedImagePaths =
          await InventoryService.saveProductImages(imagePayload);
      }

      const payload = {
        name: formData.name,
        category: finalCategory || "Uncategorized",
        brand: formData.brand,
        description: formData.description,
        basePrice: parseFloat(formData.basePrice) || 0,
        cost: parseFloat(formData.cost) || 0,
        sku: formData.sku,
        barcode: formData.barcode,
        stock: parseInt(formData.stock) || 0,
        lowStockAlert: parseInt(formData.lowStockAlert) || 10,
        status: status,
        images: JSON.stringify(savedImagePaths),
      };

      await InventoryService.addProduct(payload);
      navigate("/inventory");
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to save product.");
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
            Inventory <span style={{ margin: "0 8px" }}>/</span> Add Product
          </div>
          <h1 style={{ fontSize: 28 }}>Add New Product</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Fill in the information below to add a new item to the inventory.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn-outline"
            onClick={() => navigate("/inventory")}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* General Information */}
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
              <FileText size={20} color="var(--primary)" /> General Information
            </h3>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Wireless Ergonomic Mouse"
                required
              />
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Category</label>
                {isNewCategory ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      name="newCategory"
                      value={formData.newCategory}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="New Category Name"
                      autoFocus
                    />
                    <button
                      className="btn-outline"
                      onClick={() => setIsNewCategory(false)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="form-input"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option
                      value="ADD_NEW"
                      style={{ fontWeight: 600, color: "var(--primary)" }}
                    >
                      + Add New Category
                    </option>
                  </select>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Logitech"
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                rows={4}
                placeholder="Enter product description..."
              ></textarea>
            </div>
          </div>

          {/* Pricing & Inventory */}
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
              <DollarSign size={20} color="var(--primary)" /> Pricing &
              Inventory
            </h3>
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Base Price *</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="฿ 0.00"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Cost (Per Item)</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="฿ 0.00"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">SKU</label>
                <div style={{ display: "flex" }}>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="form-input"
                    style={{
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                    placeholder="ABC-12345"
                  />
                  <button
                    className="btn-outline"
                    onClick={generateSKU}
                    title="Auto-generate random SKU"
                    style={{
                      borderLeft: "none",
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      background: "#f8fafc",
                    }}
                  >
                    <Zap size={16} color="var(--primary)" />
                  </button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Barcode (ISBN/UPC)</label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Scan or enter code"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 0 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Initial Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="0"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Low Stock Alert</label>
                <input
                  type="number"
                  name="lowStockAlert"
                  value={formData.lowStockAlert}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Status */}
          <div className="card">
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 16,
                marginBottom: 16,
              }}
            >
              <Tag size={20} color="var(--primary)" /> Status
            </h3>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 500,
                  color:
                    status === "Published"
                      ? "var(--text-main)"
                      : "var(--text-muted)",
                }}
              >
                {status}
              </span>
              <div
                onClick={toggleStatus}
                style={{
                  width: 44,
                  height: 24,
                  background:
                    status === "Published" ? "var(--primary)" : "#cbd5e1",
                  borderRadius: 12,
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    background: "white",
                    borderRadius: "50%",
                    position: "absolute",
                    left: status === "Published" ? 22 : 2,
                    top: 2,
                    transition: "left 0.2s",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 16,
                  margin: 0,
                }}
              >
                <ImageIcon size={20} color="var(--primary)" /> Product Media
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {images.length}/10
              </span>
            </div>

            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImageUpload}
              name="image-upload"
            />

            <div
              onClick={() =>
                images.length < 10 && fileInputRef.current?.click()
              }
              style={{
                border: "2px dashed var(--border)",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                background: images.length >= 10 ? "#f1f5f9" : "#f8fafc",
                color: "var(--text-muted)",
                cursor: images.length >= 10 ? "not-allowed" : "pointer",
                marginBottom: images.length > 0 ? 16 : 0,
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  background: "#e0e7ff",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <span style={{ color: "var(--primary)", fontSize: 20 }}>↑</span>
              </div>
              <p
                style={{
                  fontWeight: 500,
                  color: "var(--text-main)",
                  marginBottom: 4,
                  fontSize: 14,
                }}
              >
                {loading ? "Compressing..." : "Click to upload images"}
              </p>
              <p style={{ fontSize: 12 }}>
                Supports PNG, JPG (Auto-compressed)
              </p>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    style={{
                      position: "relative",
                      height: 80,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={img.preview}
                      alt={`Preview ${index}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        display: "flex",
                        gap: 4,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomedImage(img.preview);
                        }}
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          border: "none",
                          color: "white",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Maximize2 size={10} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          border: "none",
                          color: "white",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={24} />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
