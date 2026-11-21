import { httpClient } from '../httpClient';

export interface CartItemResponse {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  totalQuantity: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddCartItemRequest {
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

const withToken = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const cartApi = {
  getCart: async (token: string): Promise<CartResponse> => {
    const response = await httpClient.get<CartResponse>('/cart', withToken(token));
    return response.data;
  },

  addItem: async (token: string, request: AddCartItemRequest): Promise<CartResponse> => {
    const response = await httpClient.post<CartResponse>('/cart/items', request, withToken(token));
    return response.data;
  },

  updateItem: async (
    token: string,
    variantId: string,
    request: UpdateCartItemRequest,
  ): Promise<CartResponse> => {
    const response = await httpClient.put<CartResponse>(
      `/cart/items/${encodeURIComponent(variantId)}`,
      request,
      withToken(token),
    );
    return response.data;
  },

  removeItem: async (token: string, variantId: string): Promise<void> => {
    await httpClient.delete(`/cart/items/${encodeURIComponent(variantId)}`, withToken(token));
  },
};
