import { IPC_EVENTS } from "../../shared/ipc-events";

export interface DashboardStats {
  totalSales: number;
  transactions: number;
  lowStockCount: number;
  activeStaff: number;
  lowStockItems: any[];
}

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        return await window.ipcRenderer.invoke(IPC_EVENTS.GET_DASHBOARD_STATS);
      }
      return {
        totalSales: 0,
        transactions: 0,
        lowStockCount: 0,
        activeStaff: 0,
        lowStockItems: []
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}
