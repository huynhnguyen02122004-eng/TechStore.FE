import { httpClient as axiosInstance } from '../httpClient';
import type {
  CheckoutRequest,
  CheckoutResponse,
  LocationOption,
  NewShippingAddress,
  OrderDetailsResponse,
  PaymentMethod,
  PaymentInitiationResponse,
  PaymentOrderResponse,
  ShipmentDetailsResponse,
  ShippingFeeRequest,
  ShippingFeeResponse,
  ShippingAddress,
} from '../dto/checkout.dto';

export type {
  CheckoutRequest,
  CheckoutResponse,
  CheckoutShippingAddressRequest,
  PaymentMethod,
  LocationOption,
  NewShippingAddress,
  OrderDetailsResponse,
  OrderItemResponse,
  PaymentInitiationResponse,
  PaymentOrderResponse,
  ShipmentDetailsResponse,
  ShipmentStatusHistoryResponse,
  ShippingFeeAddressRequest,
  ShippingFeeRequest,
  ShippingFeeResponse,
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

const paymentMethodCodes: Record<PaymentMethod, 1 | 2> = { COD: 1, VNPAY: 2 };

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

type ApiOrderAddress = Partial<ShippingAddress> & {
  fullName?: string;
  receiverName?: string;
  receiverPhone?: string;
  street?: string;
  addressLine?: string;
};

type ApiOrderDetailsResponse = Omit<Partial<OrderDetailsResponse>, 'shippingAddress'> & {
  id?: string;
  orderId?: string;
  subTotal?: number;
  shippingAddress?: ApiOrderAddress | string;
};

const normalizeOrderDetails = (data: ApiOrderDetailsResponse): OrderDetailsResponse => {
  const id = data.id ?? data.orderId;
  if (!id) throw new Error('Dữ liệu đơn hàng từ API không có OrderId.');

  const rawAddress = data.shippingAddress;
  const shippingAddress = typeof rawAddress === 'string' || !rawAddress
    ? rawAddress
    : {
        id: rawAddress.id ?? data.shippingAddressId ?? '',
        recipientName: rawAddress.recipientName ?? rawAddress.fullName ?? rawAddress.receiverName ?? '',
        phone: rawAddress.phone ?? rawAddress.receiverPhone ?? '',
        email: rawAddress.email,
        province: rawAddress.province ?? '',
        provinceCode: rawAddress.provinceCode,
        district: rawAddress.district ?? '',
        districtCode: rawAddress.districtCode,
        ward: rawAddress.ward ?? '',
        wardCode: rawAddress.wardCode,
        streetAddress: rawAddress.streetAddress ?? rawAddress.street ?? rawAddress.addressLine ?? '',
        isDefault: rawAddress.isDefault,
      };

  return {
    ...data,
    id,
    subtotal: data.subtotal ?? data.subTotal,
    shippingAddress,
    items: data.items?.map((item) => ({
      ...item,
      id: item.id ?? item.variantId,
      productName: item.productName ?? item.name,
      lineTotal: item.lineTotal ?? item.totalPrice,
    })),
  };
};

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
      addressId: data.addressId,
      shippingAddress: data.shippingAddress,
      note: data.note?.trim() || null,
    };
    const response = await axiosInstance.post<CheckoutResponse>('/orders/checkout', payload, withToken(token));
    return response.data;
  },

  calculateShippingFee: async (token: string, data: ShippingFeeRequest): Promise<ShippingFeeResponse> => {
    const response = await axiosInstance.post<ShippingFeeResponse>(
      '/orders/shipping-fee',
      data,
      withToken(token),
    );
    return response.data;
  },

  initiatePayment: async (token: string, orderId: string, method: PaymentMethod): Promise<PaymentInitiationResponse> => {
    const response = await axiosInstance.post<PaymentInitiationResponse>(
      '/payments/initiate',
      { orderId, method: paymentMethodCodes[method] },
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
    const response = await axiosInstance.get<ApiOrderDetailsResponse>(
      `/orders/${encodeURIComponent(orderId)}`,
      withToken(token),
    );
    return normalizeOrderDetails(response.data);
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
      ApiOrderDetailsResponse[] | { items?: ApiOrderDetailsResponse[]; orders?: ApiOrderDetailsResponse[] }
    >('/orders/my-orders', {
      ...withToken(token),
      params: status ? { status } : undefined,
    });
    const data = response.data;
    if (Array.isArray(data)) return data.map(normalizeOrderDetails);
    if (Array.isArray(data.items)) return data.items.map(normalizeOrderDetails);
    if (Array.isArray(data.orders)) return data.orders.map(normalizeOrderDetails);
    throw new Error('Dữ liệu danh sách đơn hàng từ API không hợp lệ.');
  },

  getAllOrders: async (token: string, status?: string): Promise<OrderDetailsResponse[]> => {
    const response = await axiosInstance.get<
      ApiOrderDetailsResponse[] | { items?: ApiOrderDetailsResponse[]; orders?: ApiOrderDetailsResponse[] }
    >('/orders', {
      ...withToken(token),
      params: status ? { status } : undefined,
    });
    const data = response.data;
    if (Array.isArray(data)) return data.map(normalizeOrderDetails);
    if (Array.isArray(data.items)) return data.items.map(normalizeOrderDetails);
    if (Array.isArray(data.orders)) return data.orders.map(normalizeOrderDetails);
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

const normalizeLocationOptions = (data: unknown): LocationOption[] => {
  let values: unknown[];
  if (Array.isArray(data)) {
    values = data;
  } else if (
    data !== null &&
    typeof data === 'object' &&
    'value' in data &&
    Array.isArray(data.value)
  ) {
    values = data.value;
  } else {
    throw new Error('Dữ liệu danh mục địa chỉ từ API không đúng định dạng.');
  }

  return values.map((value) => {
    if (value === null || typeof value !== 'object') {
      throw new Error('Mục địa chỉ từ API không hợp lệ.');
    }
    const location = value as { code?: unknown; id?: unknown; name?: unknown };
    const code = location.code ?? location.id;
    if ((typeof code !== 'string' && typeof code !== 'number') || typeof location.name !== 'string') {
      throw new Error('Mục địa chỉ thiếu mã hoặc tên.');
    }
    return { code: String(code), name: location.name };
  });
};

export const locationService = {
  getProvinces: async (): Promise<LocationOption[]> => {
    const response = await axiosInstance.get<unknown>('/locations/provinces');
    return normalizeLocationOptions(response.data);
  },
  getDistricts: async (provinceId: string): Promise<LocationOption[]> => {
    const response = await axiosInstance.get<unknown>('/locations/districts', { params: { provinceId } });
    return normalizeLocationOptions(response.data);
  },
  getWards: async (districtId: string): Promise<LocationOption[]> => {
    const response = await axiosInstance.get<unknown>('/locations/wards', { params: { districtId } });
    return normalizeLocationOptions(response.data);
  },
};
