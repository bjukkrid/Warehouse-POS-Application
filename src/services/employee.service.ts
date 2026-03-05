export interface Employee {
  id?: number;
  name: string;
  role: string;
  passcode: string;
  phone?: string;
  email?: string;
  discountLimit?: number;
  status: string;
}

export class EmployeeService {
  /**
   * Fetch all employees, optionally filtered by search text
   */
  static async getEmployees(search?: string): Promise<Employee[]> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        return await window.ipcRenderer.invoke('get-employees', search);
      } else {
        return [
          { id: 1, name: "Alex Johnson", role: "Manager", passcode: "1234", discountLimit: 20, status: "Active" },
          { id: 2, name: "Sara Smith", role: "Cashier", passcode: "1111", discountLimit: 5, status: "Active" }
        ];
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  }

  /**
   * Fetch employees with pagination, sorting, and filtering
   */
  static async getEmployeesPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        return await window.ipcRenderer.invoke('get-employees-paginated', params);
      }
      return {
        data: [],
        total: 0,
        page: params.page,
        limit: params.limit,
        totalPages: 0
      };
    } catch (error) {
      console.error('Error fetching paginated employees:', error);
      throw error;
    }
  }

  /**
   * Get single employee by ID
   */
  static async getEmployee(id: number): Promise<Employee | null> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        return await window.ipcRenderer.invoke('get-employee', id);
      }
      return null;
    } catch (error) {
      console.error('Error fetching employee', error);
      return null;
    }
  }

  /**
   * Add a new employee
   */
  static async addEmployee(data: Partial<Employee>): Promise<Employee | null> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        const res = await window.ipcRenderer.invoke('add-employee', data);
        return res[0];
      }
      return null;
    } catch (error) {
      console.error('Error adding employee', error);
      throw error;
    }
  }

  /**
   * Update an existing employee
   */
  static async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee | null> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        const res = await window.ipcRenderer.invoke('update-employee', id, data);
        return res[0];
      }
      return null;
    } catch (error) {
      console.error('Error updating employee', error);
      throw error;
    }
  }

  /**
   * Delete an employee
   */
  static async deleteEmployee(id: number): Promise<boolean> {
    try {
      // @ts-ignore
      if (window.ipcRenderer) {
        // @ts-ignore
        await window.ipcRenderer.invoke('delete-employee', id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting employee', error);
      return false;
    }
  }
}
