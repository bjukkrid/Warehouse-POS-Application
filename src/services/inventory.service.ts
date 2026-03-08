import { IPC_EVENTS } from "../../shared/ipc-events";

export interface GetPaginatedProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockStatus?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedProductsResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class InventoryService {
  /**
   * Fetch paginated inventory data using IPC
   */
  static async getProductsPaginated(params: GetPaginatedProductsParams): Promise<PaginatedProductsResponse> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        const response = await window.ipcRenderer.invoke(IPC_EVENTS.GET_PRODUCTS_PAGINATED, params);
        return response;
      } else {
        // Fallback for non-electron env (browser mode testing)
        console.warn('Running in browser mode. Returns mock paginated data.', params);
        return {
          data: [
            { id: 1, name: 'Minimalist Wristwatch', category: 'Accessories', basePrice: 129.00, stock: 124, sku: 'WD-001-A', lowStockAlert: 10 },
            { id: 2, name: 'Wireless Headphones', category: 'Electronics', basePrice: 249.00, stock: 3, sku: 'AU-242-X', lowStockAlert: 5 },
          ],
          total: 2,
          page: params.page || 1,
          limit: params.limit || 10,
          totalPages: 1
        };
      }
    } catch (error) {
      console.error('Error fetching paginated products:', error);
      throw error;
    }
  }

  /**
   * Add a new product
   */
  static async addProduct(data: any): Promise<any> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        return await window.ipcRenderer.invoke(IPC_EVENTS.ADD_PRODUCT, data);
      }
      return null;
    } catch (error) {
      console.error('Error adding product', error);
      throw error;
    }
  }

  /**
   * Save Product Images
   */
  static async saveProductImages(images: { base64Data: string; filename: string }[]): Promise<string[]> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        return await window.ipcRenderer.invoke(IPC_EVENTS.SAVE_PRODUCT_IMAGES, images);
      }
      return [];
    } catch (error) {
      console.error('Error saving product images:', error);
      return [];
    }
  }

  /**
   * Delete product by ID
   */
  static async deleteProduct(id: number): Promise<boolean> {
    try {
        // @ts-ignore
        if (window.ipcRenderer) {
          // @ts-ignore
          await window.ipcRenderer.invoke(IPC_EVENTS.DELETE_PRODUCT, id);
          return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting product', error);
        return false;
    }
  }

  /**
   * Delete multiple products by IDs
   */
  static async deleteProducts(ids: number[]): Promise<boolean> {
    try {
        // @ts-ignore
        if (window.ipcRenderer) {
          // @ts-ignore
          await window.ipcRenderer.invoke(IPC_EVENTS.DELETE_PRODUCTS, ids);
          return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting products', error);
        return false;
    }
  }

  /**
   * Get single product by ID
   */
  static async getProduct(id: number): Promise<any> {
    try {
        // @ts-ignore
        if (window.ipcRenderer) {
          // @ts-ignore
          return await window.ipcRenderer.invoke(IPC_EVENTS.GET_PRODUCT, id);
        }
        return null;
    } catch (error) {
        console.error('Error fetching product', error);
        return null;
    }
  }
}
