export interface ShippingAddress extends NewShippingAddress {
  id: string;
}

export interface NewShippingAddress {
  recipientName: string;
  phone: string;
  email?: string;
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

export type PaymentMethod = 'COD' | 'VNPAY';

export interface CheckoutShippingAddressRequest {
  receiverName: string;
  receiverPhone: string;
  province: string;
  provinceCode: string;
  district: string;
  districtCode: string;
  ward: string;
  wardCode: string;
  addressLine: string;
}

export interface CheckoutRequest {
  addressId: string | null;
  shippingAddress: CheckoutShippingAddressRequest | null;
  note: string | null;
}

export interface ShippingFeeAddressRequest {
  receiverName: string;
  receiverPhone: string;
  province: string;
  provinceCode: string;
  district: string;
  districtCode: string;
  ward: string;
  wardCode: string;
  addressLine: string;
}

export interface ShippingFeeRequest {
  addressId?: string | null;
  shippingAddress?: ShippingFeeAddressRequest | null;
  note?: string;
}

export interface ShippingFeeResponse {
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  includesCodFee: boolean;
}

export interface CheckoutResponse {
  id: string;
  orderId?: string;
  userId?: string;
  subtotal?: number;
  subTotal?: number;
  shippingFee: number;
  grandTotal: number;
  shippingAddressId?: string;
  createdAt: string;
  status?: string;
  items?: OrderItemResponse[];
}

export interface PaymentInitiationResponse {
  paymentUrl?: string;
  paymentReference?: string;
}

export interface OrderItemResponse {
  id?: string;
  variantId?: string;
  productName?: string;
  name?: string;
  sku?: string;
  imageUrl?: string;
  unitPrice?: number;
  quantity?: number;
  lineTotal?: number;
  totalPrice?: number;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface OrderDetailsResponse {
  id: string;
  orderId?: string;
  userId?: string;
  orderCode?: string;
  status?: string;
  createdAt?: string;
  cancelReason?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: 1 | 2 | 'COD' | 'VNPAY' | string;
  paymentStatus?: string;
  subtotal?: number;
  subTotal?: number;
  shippingFee?: number;
  discount?: number;
  grandTotal?: number;
  paymentExpiresAt?: string;
  shippingAddress?: ShippingAddress | string;
  shippingAddressId?: string;
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
