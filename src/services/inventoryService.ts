import axios from 'axios';

export interface InventoryItem {
  variantId: string;
  productId: string;
  productCode?: string;
  productName: string;
  variantName: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface InventoryAdjustPayload {
  variantId: string;
  quantity: number;
  reason?: string;
  mode: 'SET' | 'ADD' | 'REMOVE';
}

export interface InventoryTransaction {
  id: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  changeQuantity: number;
  quantityBefore?: number;
  quantityAfter?: number;
  createdAt?: string;
  performedBy?: string;
  orderCode?: string;
  orderId?: string;
}

export interface InventoryReservation {
  id: string;
  orderId?: string;
  orderCode?: string;
  productId?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  quantity: number;
  status: 'ACTIVE' | 'RELEASED' | 'COMMITTED' | 'CANCELLED' | string;
  expiresAt?: string;
  createdAt?: string;
}

const API_URL = 'http://localhost:5091/api/v1';
const axiosInstance = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });
const withToken = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
const unwrap = <T,>(data: T[] | { items?: T[] }): T[] => Array.isArray(data) ? data : data.items ?? [];

export const inventoryService = {
  getAll: async (token: string): Promise<InventoryItem[]> => {
    const response = await axiosInstance.get<InventoryItem[] | { items?: InventoryItem[] }>('/inventory', withToken(token));
    return unwrap(response.data);
  },
  getLowStock: async (token: string): Promise<InventoryItem[]> => {
    const response = await axiosInstance.get<InventoryItem[] | { items?: InventoryItem[] }>('/inventory/low-stock', withToken(token));
    return unwrap(response.data);
  },
  adjust: async (token: string, payload: InventoryAdjustPayload): Promise<void> => {
    await axiosInstance.post('/inventory/adjust', payload, withToken(token));
  },
  updateThreshold: async (token: string, variantId: string, lowStockThreshold: number): Promise<void> => {
    await axiosInstance.put(
      `/inventory/${encodeURIComponent(variantId)}/low-stock-threshold`,
      { lowStockThreshold },
      withToken(token),
    );
  },

  getTransactions: async (token: string): Promise<InventoryTransaction[]> => {
    const response = await axiosInstance.get<InventoryTransaction[] | { items?: InventoryTransaction[] }>(
      '/inventory/transactions',
      withToken(token),
    );
    return unwrap(response.data);
  },
  getReservations: async (token: string): Promise<InventoryReservation[]> => {
    const response = await axiosInstance.get<InventoryReservation[] | { items?: InventoryReservation[] }>(
      '/inventory/reservations',
      withToken(token),
    );
    return unwrap(response.data);
  },
};
