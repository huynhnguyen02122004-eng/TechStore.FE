import { httpClient as axiosInstance } from '../httpClient';
import type {
  CheckoutRequest,
  CheckoutResponse,
  LocationOption,
  NewShippingAddress,
  OrderDetailsResponse,
  PaymentInitiationResponse,
  PaymentOrderResponse,
  ShipmentDetailsResponse,
  ShippingAddress,
} from '../dto/checkout.dto';

export type {
  CheckoutRequest,
  CheckoutResponse,
  LocationOption,
  NewShippingAddress,
  OrderDetailsResponse,
  OrderItemResponse,
  PaymentInitiationResponse,
  PaymentOrderResponse,
  ShipmentDetailsResponse,
  ShipmentStatusHistoryResponse,
  ShippingAddress,
} from '../dto/checkout.dto';

const toAddressRequest = (address: NewShippingAddress) => ({
  receiverName: address.recipientName.trim(),
  receiverPhone: address.phone.trim(),
  province: address.province.trim(),
  provinceCode: address.provinceCode?.trim(),
  district: address.district.trim(),
  districtCode: address.districtCode?.trim(),
  ward: address.ward.trim(),
  wardCode: address.wardCode?.trim(),
  addressLine: address.streetAddress.trim(),
  isDefault: Boolean(address.isDefault),
});

type ApiAddress = Omit<ReturnType<typeof toAddressRequest>, 'provinceCode' | 'districtCode' | 'wardCode'> & {
  id: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
};

const fromAddressResponse = ({ receiverName, receiverPhone, addressLine, ...address }: ApiAddress): ShippingAddress => ({
  ...address,
  recipientName: receiverName,
  phone: receiverPhone,
  streetAddress: addressLine,
});

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
    const response = await axiosInstance.get<ApiAddress[] | { items?: ApiAddress[] }>(
      '/addresses',
      withToken(token),
    );
    return unwrapList(response.data).map(fromAddressResponse);
  },

  createAddress: async (token: string, address: NewShippingAddress): Promise<ShippingAddress> => {
    const response = await axiosInstance.post<ApiAddress>('/addresses', toAddressRequest(address), withToken(token));
    return fromAddressResponse(response.data);
  },

  updateAddress: async (token: string, addressId: string, address: NewShippingAddress): Promise<void> => {
    await axiosInstance.put(`/addresses/${encodeURIComponent(addressId)}`, toAddressRequest(address), withToken(token));
  },

  deleteAddress: async (token: string, addressId: string): Promise<void> => {
    await axiosInstance.delete(`/addresses/${encodeURIComponent(addressId)}`, withToken(token));
  },

  checkout: async (token: string, data: CheckoutRequest): Promise<CheckoutResponse> => {
    const payload = {
      addressId: data.shippingAddressId,
      shippingAddress: data.newShippingAddress ? toAddressRequest(data.newShippingAddress) : undefined,
      paymentMethod: data.paymentMethod,
    };
    const response = await axiosInstance.post<CheckoutResponse>('/orders/checkout', payload, withToken(token));
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

export const locationService = {
  getProvinces: async (): Promise<LocationOption[]> => {
    const response = await axiosInstance.get<LocationOption[]>('/locations/provinces');
    return response.data;
  },
  getDistricts: async (provinceId: number): Promise<LocationOption[]> => {
    const response = await axiosInstance.get<LocationOption[]>('/locations/districts', { params: { provinceId } });
    return response.data;
  },
  getWards: async (districtId: number): Promise<LocationOption[]> => {
    const response = await axiosInstance.get<LocationOption[]>('/locations/wards', { params: { districtId } });
    return response.data;
  },
};
