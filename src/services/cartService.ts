import axios from 'axios';
import { cartApi, type CartResponse } from '../shared/api/endpoints/cartApi';

export type { CartItemResponse, CartResponse } from '../shared/api/endpoints/cartApi';

export const cartUpdatedEvent = 'techstore-cart-updated';

export function getCartApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;

  const responseBody = error.response?.data;
  if (responseBody && typeof responseBody === 'object') {
    const body = responseBody as Record<string, unknown>;
    for (const key of ['detail', 'message', 'title']) {
      if (typeof body[key] === 'string' && body[key].trim()) return body[key];
    }
  }

  if (error.response) return `${fallback} (HTTP ${error.response.status}).`;
  return `${fallback} Không thể kết nối tới API giỏ hàng.`;
}

export function getCurrentAccessToken(): string | null {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export function notifyCartUpdated() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(cartUpdatedEvent));
}

export async function getAccountCart(token: string): Promise<CartResponse> {
  return cartApi.getCart(token);
}

export async function addAccountCartItem(
  token: string,
  variantId: string,
  quantity: number,
): Promise<CartResponse> {
  const cart = await cartApi.addItem(token, { variantId, quantity });
  notifyCartUpdated();
  return cart;
}

export async function addOrIncrementAccountCartItem(
  token: string,
  variantId: string,
  quantity: number,
  loadedCart?: CartResponse,
): Promise<CartResponse> {
  const cart = loadedCart ?? await getAccountCart(token);
  const existingItem = (cart.items ?? []).find((item) => item.variantId === variantId);
  if (existingItem) {
    return updateAccountCartItem(token, variantId, existingItem.quantity + quantity);
  }
  return addAccountCartItem(token, variantId, quantity);
}

export async function updateAccountCartItem(
  token: string,
  variantId: string,
  quantity: number,
): Promise<CartResponse> {
  const cart = await cartApi.updateItem(token, variantId, { quantity });
  notifyCartUpdated();
  return cart;
}

export async function removeAccountCartItem(token: string, variantId: string): Promise<void> {
  await cartApi.removeItem(token, variantId);
  notifyCartUpdated();
}

export async function getCartItemCount(token = getCurrentAccessToken()): Promise<number> {
  if (!token) return 0;
  const cart = await getAccountCart(token);
  const totalQuantity = Number(cart.totalQuantity);
  if (Number.isFinite(totalQuantity)) return totalQuantity;
  return Array.isArray(cart.items)
    ? cart.items.reduce((total, item) => total + (Number.isFinite(item.quantity) ? item.quantity : 0), 0)
    : 0;
}
