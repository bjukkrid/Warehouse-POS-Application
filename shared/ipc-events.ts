export const IPC_EVENTS = {
  // Products
  GET_PRODUCTS: 'get-products',
  GET_PRODUCTS_PAGINATED: 'get-products-paginated',
  GET_PRODUCT: 'get-product',
  ADD_PRODUCT: 'add-product',
  UPDATE_PRODUCT: 'update-product',
  DELETE_PRODUCT: 'delete-product',
  DELETE_PRODUCTS: 'delete-products',
  GET_LOW_STOCK_ITEMS: 'get-low-stock-items',
  SAVE_PRODUCT_IMAGES: 'save-product-images',

  // Employees
  GET_EMPLOYEES: 'get-employees',
  GET_EMPLOYEES_PAGINATED: 'get-employees-paginated',
  GET_EMPLOYEE: 'get-employee',
  ADD_EMPLOYEE: 'add-employee',
  UPDATE_EMPLOYEE: 'update-employee',
  DELETE_EMPLOYEE: 'delete-employee',

  // Sales
  PROCESS_CHECKOUT: 'process-checkout',
  GET_SALES_PAGINATED: 'get-sales-paginated',
  GET_ALL_SALES_FOR_EXPORT: 'get-all-sales-for-export',

  // Dashboard
  GET_DASHBOARD_STATS: 'get-dashboard-stats',
} as const;
