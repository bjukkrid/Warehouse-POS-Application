import { ipcMain } from 'electron';
import { EmployeeRepository } from '../repositories/employee.repo';
import { IPC_EVENTS } from '../../shared/ipc-events';

export function registerEmployeeHandlers() {
  const repo = new EmployeeRepository();

  ipcMain.handle(IPC_EVENTS.GET_EMPLOYEES_PAGINATED, async (event, params: any) => {
    return await repo.getEmployeesPaginated(params);
  });

  ipcMain.handle(IPC_EVENTS.GET_EMPLOYEES, async (event, search?: string) => {
    return await repo.getEmployees(search);
  });

  ipcMain.handle(IPC_EVENTS.GET_EMPLOYEE, async (event, id: number) => {
    return await repo.getEmployee(id);
  });

  ipcMain.handle(IPC_EVENTS.ADD_EMPLOYEE, async (event, data: any) => {
    return await repo.addEmployee(data);
  });

  ipcMain.handle(IPC_EVENTS.UPDATE_EMPLOYEE, async (event, id: number, data: any) => {
    return await repo.updateEmployee(id, data);
  });

  ipcMain.handle(IPC_EVENTS.DELETE_EMPLOYEE, async (event, id: number) => {
    return await repo.deleteEmployee(id);
  });
}
