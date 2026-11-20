export interface ShippingAddress extends NewShippingAddress {
  id: string;
}

export interface NewShippingAddress {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  isDefault?: boolean;
}

export interface LocationOption {
  code: string;
  name: string;
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
