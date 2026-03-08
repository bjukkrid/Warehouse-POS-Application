import { ipcMain } from 'electron';
import { SaleRepository } from '../repositories/sale.repo';
import { IPC_EVENTS } from '../../shared/ipc-events';

export function registerSaleHandlers() {
  const repo = new SaleRepository();

  ipcMain.handle(IPC_EVENTS.PROCESS_CHECKOUT, async (event, payload: any) => {
    return await repo.processCheckout(payload);
  });

  ipcMain.handle(IPC_EVENTS.GET_SALES_PAGINATED, async (event, params: any) => {
    return await repo.getSalesPaginated(params);
  });

  ipcMain.handle(IPC_EVENTS.GET_ALL_SALES_FOR_EXPORT, async () => {
    return await repo.getAllSalesForExport();
  });
}
