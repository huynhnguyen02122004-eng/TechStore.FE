import { httpClient as axiosInstance } from '../httpClient';
import type { InventoryAdjustPayload, InventoryItem, InventoryReservation, InventoryTransaction } from '../dto/inventory.dto';

export type {
  InventoryAdjustPayload,
  InventoryItem,
  InventoryReservation,
  InventoryTransaction,
} from '../dto/inventory.dto';

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
