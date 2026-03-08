import { ipcMain } from 'electron';
import { ProductRepository } from '../repositories/product.repo';
import { IPC_EVENTS } from '../../shared/ipc-events';

export function registerProductHandlers() {
  const repo = new ProductRepository();

  ipcMain.handle(IPC_EVENTS.GET_PRODUCTS, async (event, search?: string) => {
    return await repo.getProducts(search);
  });

  ipcMain.handle(IPC_EVENTS.GET_PRODUCT, async (event, id: number) => {
    return await repo.getProduct(id);
  });

  ipcMain.handle(IPC_EVENTS.GET_PRODUCTS_PAGINATED, async (event, params: any) => {
    return await repo.getProductsPaginated(params);
  });

  ipcMain.handle(IPC_EVENTS.GET_LOW_STOCK_ITEMS, async () => {
    return await repo.getLowStockItems();
  });

  ipcMain.handle(IPC_EVENTS.ADD_PRODUCT, async (event, data: any) => {
    return await repo.addProduct(data);
  });

  ipcMain.handle(IPC_EVENTS.UPDATE_PRODUCT, async (event, id: number, data: any) => {
    return await repo.updateProduct(id, data);
  });

  ipcMain.handle(IPC_EVENTS.DELETE_PRODUCT, async (event, id: number) => {
    return await repo.deleteProduct(id);
  });

  ipcMain.handle(IPC_EVENTS.DELETE_PRODUCTS, async (event, ids: number[]) => {
    return await repo.deleteProducts(ids);
  });
}
