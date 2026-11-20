import axios from 'axios';

const API_URL = 'http://localhost:5091/api/v1';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface ShippingAddress {
  id: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault?: boolean;
}

export interface NewShippingAddress {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault?: boolean;
}

export interface CheckoutRequest {
  shippingAddressId?: string;
  newShippingAddress?: NewShippingAddress;
  paymentMethod: 1 | 2;
}

export interface CheckoutResponse {
  id?: string;
  orderId?: string;
  orderCode?: string;
  grandTotal?: number;
}

export interface PaymentInitiationResponse {
  paymentUrl?: string;
  paymentReference?: string;
}

export interface OrderItemResponse {
  id?: string;
  productName?: string;
  name?: string;
  sku?: string;
  imageUrl?: string;
  unitPrice?: number;
  quantity?: number;
  lineTotal?: number;
}

export interface OrderDetailsResponse {
  id: string;
  orderCode?: string;
  status?: string;
  createdAt?: string;
  cancelReason?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: 1 | 2 | 'COD' | 'VNPAY' | string;
  paymentStatus?: string;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  grandTotal?: number;
  paymentExpiresAt?: string;
  shippingAddress?: ShippingAddress | string;
  items?: OrderItemResponse[];
}

export interface ShipmentStatusHistoryResponse {
  id?: string;
  status?: string;
  description?: string;
  createdAt?: string;
  timestamp?: string;
  createdByName?: string;
}

export interface ShipmentDetailsResponse {
  id?: string;
  provider?: string;
  trackingCode?: string;
  status?: string;
  orderId?: string;
  orderCode?: string;
  customerName?: string;
  shippingAddress?: ShippingAddress | string;
  createdAt?: string;
  expectedDeliveryDate?: string;
  estimatedDeliveryDate?: string;
  expectedDeliveryAt?: string;
  statusHistories?: ShipmentStatusHistoryResponse[];
}

export interface PaymentOrderResponse {
  status?: string;
  paymentReference?: string;
  id?: string;
  orderId?: string;
  orderCode?: string;
  customerName?: string;
  amount?: number;
  grandTotal?: number;
  paymentMethod?: 1 | 2 | 'COD' | 'VNPAY' | string;
  paidAt?: string;
  createdAt?: string;
  payment?: {
    status?: string;
    paymentReference?: string;
  };
}

const withToken = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const isShipmentDetailsResponse = (value: object): value is ShipmentDetailsResponse =>
  'id' in value ||
  'provider' in value ||
  'trackingCode' in value ||
  'status' in value ||
  'expectedDeliveryDate' in value ||
  'estimatedDeliveryDate' in value ||
  'expectedDeliveryAt' in value ||
  'statusHistories' in value;

type ShipmentResponseData =
  | ShipmentDetailsResponse
  | ShipmentDetailsResponse[]
  | { items?: ShipmentDetailsResponse[]; shipment?: ShipmentDetailsResponse | null };

const normalizeShipmentResponse = (data: ShipmentResponseData): ShipmentDetailsResponse | null => {
  if (Array.isArray(data)) return data[0] ?? null;
  if ('items' in data) return data.items?.[0] ?? null;
  if ('shipment' in data) return data.shipment ?? null;
  if (isShipmentDetailsResponse(data)) return data;
  throw new Error('Dữ liệu vận chuyển từ API không hợp lệ.');
};

const unwrapList = <T,>(data: T[] | { items?: T[] }): T[] =>
  Array.isArray(data) ? data : data.items ?? [];

export const checkoutService = {
  getAddresses: async (token: string): Promise<ShippingAddress[]> => {
    const response = await axiosInstance.get<ShippingAddress[] | { items?: ShippingAddress[] }>(
      '/addresses',
      withToken(token),
    );
    return unwrapList(response.data);
  },

  createAddress: async (token: string, address: NewShippingAddress): Promise<ShippingAddress> => {
    const response = await axiosInstance.post<ShippingAddress>('/addresses', address, withToken(token));
    return response.data;
  },

  updateAddress: async (token: string, addressId: string, address: NewShippingAddress): Promise<void> => {
    await axiosInstance.put(`/addresses/${encodeURIComponent(addressId)}`, address, withToken(token));
  },

  deleteAddress: async (token: string, addressId: string): Promise<void> => {
    await axiosInstance.delete(`/addresses/${encodeURIComponent(addressId)}`, withToken(token));
  },

  checkout: async (token: string, data: CheckoutRequest): Promise<CheckoutResponse> => {
    const response = await axiosInstance.post<CheckoutResponse>('/orders/checkout', data, withToken(token));
    return response.data;
  },

  initiatePayment: async (token: string, orderId: string): Promise<PaymentInitiationResponse> => {
    const response = await axiosInstance.post<PaymentInitiationResponse>(
      '/payments/initiate',
      { orderId },
      withToken(token),
    );
    return response.data;
  },

  getPaymentByOrderId: async (token: string, orderId: string): Promise<PaymentOrderResponse> => {
    const response = await axiosInstance.get<PaymentOrderResponse>(
      `/payments/order/${encodeURIComponent(orderId)}`,
      withToken(token),
    );
    return response.data;
  },

  getOrderById: async (token: string, orderId: string): Promise<OrderDetailsResponse> => {
    const response = await axiosInstance.get<OrderDetailsResponse>(
      `/orders/${encodeURIComponent(orderId)}`,
      withToken(token),
    );
    return response.data;
  },

  cancelOrder: async (token: string, orderId: string, reason: string): Promise<void> => {
    await axiosInstance.post(
      `/orders/${encodeURIComponent(orderId)}/cancel`,
      { reason },
      withToken(token),
    );
  },

  getShipmentByOrderId: async (token: string, orderId: string): Promise<ShipmentDetailsResponse | null> => {
    const response = await axiosInstance.get<ShipmentResponseData>(
      `/shipments/order/${encodeURIComponent(orderId)}`,
      withToken(token),
    );
    return normalizeShipmentResponse(response.data);
  },

  getShipmentByTrackingCode: async (trackingCode: string): Promise<ShipmentDetailsResponse | null> => {
    const response = await axiosInstance.get<ShipmentResponseData>(
      `/shipments/tracking/${encodeURIComponent(trackingCode)}`,
    );
    return normalizeShipmentResponse(response.data);
  },

  getMyOrders: async (token: string, status?: string): Promise<OrderDetailsResponse[]> => {
    const response = await axiosInstance.get<
      OrderDetailsResponse[] | { items?: OrderDetailsResponse[]; orders?: OrderDetailsResponse[] }
    >('/orders/my-orders', {
      ...withToken(token),
      params: status ? { status } : undefined,
    });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.orders)) return data.orders;
    throw new Error('Dữ liệu danh sách đơn hàng từ API không hợp lệ.');
  },

  getAllOrders: async (token: string, status?: string): Promise<OrderDetailsResponse[]> => {
    const response = await axiosInstance.get<
      OrderDetailsResponse[] | { items?: OrderDetailsResponse[]; orders?: OrderDetailsResponse[] }
    >('/orders', {
      ...withToken(token),
      params: status ? { status } : undefined,
    });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.orders)) return data.orders;
    throw new Error('Dữ liệu danh sách đơn hàng từ API không hợp lệ.');
  },

  updateOrderStatus: async (token: string, orderId: string, status: string): Promise<void> => {
    await axiosInstance.put(
      `/orders/${encodeURIComponent(orderId)}/status`,
      { status },
      withToken(token),
    );
  },

  getPaymentById: async (token: string, paymentId: string): Promise<PaymentOrderResponse> => {
    const response = await axiosInstance.get<PaymentOrderResponse>(
      `/payments/${encodeURIComponent(paymentId)}`,
      withToken(token),
    );
    return response.data;
  },

  confirmCodPayment: async (token: string, paymentId: string): Promise<void> => {
    await axiosInstance.post(
      `/payments/${encodeURIComponent(paymentId)}/cod/confirm`,
      {},
      withToken(token),
    );
  },

  getAdminPayments: async (token: string): Promise<PaymentOrderResponse[]> => {
    const orders = await checkoutService.getAllOrders(token);
    const payments = await Promise.allSettled(
      orders.map((order) => checkoutService.getPaymentByOrderId(token, order.id)),
    );
    return payments.flatMap((result, index) => {
      if (result.status === 'rejected') return [];
      const order = orders[index];
      const payment = result.value;
      return [{
        ...payment,
        id: payment.paymentReference ?? payment.id ?? `PAY-${order.id}`,
        orderId: order.id,
        orderCode: order.orderCode,
        customerName: order.customerName ??
          (typeof order.shippingAddress === 'object' ? order.shippingAddress.recipientName : undefined),
        amount: order.grandTotal,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        status: payment.payment?.status ?? payment.status,
      }];
    });
  },

  createShipment: async (
    token: string,
    payload: { orderId: string; provider: string; trackingCode?: string; expectedDeliveryDate?: string },
  ): Promise<ShipmentDetailsResponse> => {
    const response = await axiosInstance.post<ShipmentDetailsResponse>('/shipments', payload, withToken(token));
    return response.data;
  },

  updateShipmentStatus: async (
    token: string,
    shipmentId: string,
    status: string,
  ): Promise<void> => {
    await axiosInstance.put(
      `/shipments/${encodeURIComponent(shipmentId)}/status`,
      { status },
      withToken(token),
    );
  },

  cancelShipment: async (token: string, shipmentId: string): Promise<void> => {
    await axiosInstance.post(
      `/shipments/${encodeURIComponent(shipmentId)}/cancel`,
      {},
      withToken(token),
    );
  },
};
