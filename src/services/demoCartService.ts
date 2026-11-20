export interface DemoCartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPrice: number;
  imageUrl: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'techstore-demo-cart';
const CART_UPDATED_EVENT = 'techstore-demo-cart-updated';

const isCartItem = (value: unknown): value is DemoCartItem => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === 'string' &&
    typeof item.variantId === 'string' &&
    typeof item.productName === 'string' &&
    typeof item.variantLabel === 'string' &&
    typeof item.sku === 'string' &&
    typeof item.unitPrice === 'number' &&
    typeof item.imageUrl === 'string' &&
    typeof item.quantity === 'number'
  );
};

const readItems = (): DemoCartItem[] => {
  const savedItems = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!savedItems) return [];

  const items: unknown = JSON.parse(savedItems);
  if (!Array.isArray(items) || !items.every(isCartItem)) {
    throw new Error('Dữ liệu giỏ hàng demo không hợp lệ.');
  }
  return items;
};

const saveItems = (items: DemoCartItem[]) => {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

export const demoCartService = {
  getItems: readItems,

  getItemCount: () => readItems().reduce((total, item) => total + item.quantity, 0),

  addItem: (newItem: DemoCartItem) => {
    const items = readItems();
    const existingItem = items.find((item) => item.variantId === newItem.variantId);

    if (existingItem) {
      existingItem.quantity += newItem.quantity;
    } else {
      items.push(newItem);
    }

    saveItems(items);
  },

  setQuantity: (variantId: string, quantity: number) => {
    const items = readItems()
      .map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);
    saveItems(items);
  },

  removeItem: (variantId: string) => {
    saveItems(readItems().filter((item) => item.variantId !== variantId));
  },

  clear: () => saveItems([]),
};

export const demoCartUpdatedEvent = CART_UPDATED_EVENT;
