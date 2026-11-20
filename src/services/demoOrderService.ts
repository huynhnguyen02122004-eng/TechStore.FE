import type { OrderDetailsResponse } from './checkoutService';

export interface DemoPaymentResult {
  status: string;
  paymentReference: string;
}

export interface DemoOrderResult {
  payment: DemoPaymentResult;
  order: OrderDetailsResponse;
}

const DEMO_ORDER_PREFIX = 'techstore-demo-order:';

const initialAdminOrders: DemoOrderResult[] = [
  {
    payment: { status: 'PENDING', paymentReference: 'DEMO-PAY-001' },
    order: {
      id: 'DEMO-ORD-001',
      orderCode: 'TS-2026-001',
      customerName: 'Nguyễn Minh Anh',
      customerPhone: '0901 234 567',
      paymentMethod: 'COD',
      status: 'CONFIRMED',
      createdAt: '2026-11-19T08:30:00.000Z',
      grandTotal: 25990000,
      subtotal: 25990000,
      shippingFee: 0,
      discount: 0,
      shippingAddress: {
        id: 'demo-address-1',
        recipientName: 'Nguyễn Minh Anh',
        phone: '0901 234 567',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        streetAddress: '123 Nguyễn Trãi',
        isDefault: true,
      },
      items: [{
        id: 'demo-item-1',
        productName: 'TechPhone Pro',
        sku: 'TP-PRO-256-BLK',
        unitPrice: 25990000,
        quantity: 1,
        lineTotal: 25990000,
        imageUrl: '/mock-phone-front.svg',
      }],
    },
  },
  {
    payment: { status: 'PAID', paymentReference: 'DEMO-PAY-002' },
    order: {
      id: 'DEMO-ORD-002',
      orderCode: 'TS-2026-002',
      customerName: 'Trần Gia Huy',
      customerPhone: '0912 345 678',
      paymentMethod: 'VNPAY',
      status: 'SHIPPED',
      createdAt: '2026-11-18T14:15:00.000Z',
      grandTotal: 28990000,
      subtotal: 28990000,
      shippingFee: 0,
      discount: 0,
      shippingAddress: {
        id: 'demo-address-2',
        recipientName: 'Trần Gia Huy',
        phone: '0912 345 678',
        province: 'TP Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Bến Nghé',
        streetAddress: '45 Lê Lợi',
      },
      items: [{
        id: 'demo-item-2',
        productName: 'Laptop Pro 14',
        sku: 'LP-14-DEMO',
        unitPrice: 28990000,
        quantity: 1,
        lineTotal: 28990000,
      }],
    },
  },
  {
    payment: { status: 'PAID', paymentReference: 'DEMO-PAY-003' },
    order: {
      id: 'DEMO-ORD-003',
      orderCode: 'TS-2026-003',
      customerName: 'Lê Thanh Hà',
      customerPhone: '0987 654 321',
      paymentMethod: 'COD',
      status: 'DELIVERED',
      createdAt: '2026-11-17T09:00:00.000Z',
      grandTotal: 51980000,
      subtotal: 51980000,
      shippingFee: 0,
      discount: 0,
      shippingAddress: {
        id: 'demo-address-3',
        recipientName: 'Lê Thanh Hà',
        phone: '0987 654 321',
        province: 'Đà Nẵng',
        district: 'Thanh Khê',
        ward: 'Tân Chính',
        streetAddress: '78 Trưng Nữ Vương',
      },
      items: [{
        id: 'demo-item-3',
        productName: 'Tai nghe không dây',
        sku: 'HEAD-SONY-DEMO',
        unitPrice: 25990000,
        quantity: 2,
        lineTotal: 51980000,
      }],
    },
  },
];

const ensureInitialAdminOrders = () => {
  if (window.sessionStorage.length === 0) {
    initialAdminOrders.forEach((result) => demoOrderService.save(result));
  }
};

const isDemoOrderResult = (value: unknown): value is DemoOrderResult => {
  if (typeof value !== 'object' || value === null || !('payment' in value) || !('order' in value)) {
    return false;
  }
  const payment = value.payment;
  const order = value.order;
  return (
    typeof payment === 'object' &&
    payment !== null &&
    'status' in payment &&
    typeof payment.status === 'string' &&
    'paymentReference' in payment &&
    typeof payment.paymentReference === 'string' &&
    typeof order === 'object' &&
    order !== null &&
    'id' in order &&
    typeof order.id === 'string'
  );
};

export const demoOrderService = {
  save: (result: DemoOrderResult) => {
    window.sessionStorage.setItem(`${DEMO_ORDER_PREFIX}${result.order.id}`, JSON.stringify(result));
  },

  get: (orderId: string): DemoOrderResult | null => {
    const savedResult = window.sessionStorage.getItem(`${DEMO_ORDER_PREFIX}${orderId}`);
    if (!savedResult) return null;

    const result: unknown = JSON.parse(savedResult);
    if (!isDemoOrderResult(result)) {
      throw new Error('Dữ liệu đơn hàng demo không hợp lệ.');
    }
    const timestamp = /^DEMO-(\d{13})$/.exec(orderId)?.[1];
    if (!result.order.createdAt && timestamp) {
      return {
        ...result,
        order: { ...result.order, createdAt: new Date(Number(timestamp)).toISOString() },
      };
    }
    return result;
  },

  getAll: (): DemoOrderResult[] => {
    ensureInitialAdminOrders();
    const results: DemoOrderResult[] = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (!key?.startsWith(DEMO_ORDER_PREFIX)) continue;
      const result = demoOrderService.get(key.slice(DEMO_ORDER_PREFIX.length));
      if (result) results.push(result);
    }
    return results.sort(
      (a, b) => new Date(b.order.createdAt ?? 0).getTime() - new Date(a.order.createdAt ?? 0).getTime(),
    );
  },

  cancel: (orderId: string, reason: string): DemoOrderResult => {
    const result = demoOrderService.get(orderId);
    if (!result) throw new Error('Không tìm thấy đơn hàng demo trong phiên hiện tại.');
    if (!['PENDING_PAYMENT', 'CONFIRMED'].includes(result.order.status?.toUpperCase() ?? '')) {
      throw new Error('Đơn hàng này không thể hủy ở trạng thái hiện tại.');
    }

    const cancelled = {
      ...result,
      order: { ...result.order, status: 'CANCELLED', cancelReason: reason },
    };
    demoOrderService.save(cancelled);
    return cancelled;
  },

  updateStatus: (orderId: string, status: string): DemoOrderResult => {
    const result = demoOrderService.get(orderId);
    if (!result) throw new Error('Không tìm thấy đơn hàng demo trong phiên hiện tại.');
    const allowedStatuses = [
      'PENDING_PAYMENT',
      'CONFIRMED',
      'PACKING',
      'READY_TO_SHIP',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    if (!allowedStatuses.includes(status)) {
      throw new Error('Trạng thái đơn hàng không hợp lệ.');
    }
    const updated = { ...result, order: { ...result.order, status } };
    demoOrderService.save(updated);
    return updated;
  },
};
