import { IPC_EVENTS } from "../../shared/ipc-events";

export interface SaleItem {
  saleId: number;
  productId: number;
  productName: string | null;
  quantity: number;
  priceAtTime: number;
}

export interface Sale {
  id: number;
  totalAmount: number;
  discountAmount: number;
  discountPercentage?: number;
  createdAt: string;
  employeeName?: string | null;
  items?: SaleItem[];
}

export class ReportService {
  /**
   * Fetch sales with pagination
   */
  static async getSalesPaginated(params: {
    page: number;
    limit: number;
  }): Promise<{
    data: Sale[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        return await window.ipcRenderer.invoke(IPC_EVENTS.GET_SALES_PAGINATED, params);
      }
      return {
        data: [],
        total: 0,
        page: params.page,
        limit: params.limit,
        totalPages: 0
      };
    } catch (error) {
      console.error('Error fetching paginated sales:', error);
      throw error;
    }
  }

  /**
   * Fetch all sales without pagination for export
   */
  static async getAllSales(): Promise<Sale[]> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        return await window.ipcRenderer.invoke(IPC_EVENTS.GET_ALL_SALES_FOR_EXPORT);
      }
      return [];
    } catch (error) {
      console.error('Error fetching all sales:', error);
      throw error;
    }
  }
}
