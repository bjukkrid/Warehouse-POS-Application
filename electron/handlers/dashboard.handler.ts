import { ipcMain } from 'electron';
import { DashboardRepository } from '../repositories/dashboard.repo';
import { IPC_EVENTS } from '../../shared/ipc-events';

export function registerDashboardHandlers() {
  const dashboardRepo = new DashboardRepository();

  ipcMain.handle(IPC_EVENTS.GET_DASHBOARD_STATS, async () => {
    try {
      return await dashboardRepo.getDashboardStats();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  });
}
