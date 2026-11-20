import type { OrderDetailsResponse, ShipmentDetailsResponse } from './checkoutService';

const STORAGE_KEY = 'techstore-demo-shipments';

export interface DemoShipment extends ShipmentDetailsResponse {
  orderId: string;
  orderCode?: string;
  customerName?: string;
  shippingAddress?: OrderDetailsResponse['shippingAddress'];
  createdAt: string;
}

export const demoShipmentService = {
  getAll(): DemoShipment[] {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as DemoShipment[];
    }
    return [];
  },

  create(order: OrderDetailsResponse, provider: string, trackingCode?: string): DemoShipment[] {
    const shipments = demoShipmentService.getAll();
    const code = trackingCode?.trim() || `TS-${Date.now()}`;
    if (!provider.trim()) throw new Error('Vui lòng chọn đơn vị vận chuyển.');
    if (shipments.some((shipment) => shipment.trackingCode?.toUpperCase() === code.toUpperCase())) {
      throw new Error('Mã vận đơn đã tồn tại.');
    }
    const shipment: DemoShipment = {
      id: `demo-shipment-${Date.now()}`,
      orderId: order.id,
      orderCode: order.orderCode,
      customerName: order.customerName ??
        (typeof order.shippingAddress === 'object' ? order.shippingAddress.recipientName : undefined),
      shippingAddress: order.shippingAddress,
      provider,
      trackingCode: code,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
    };
    const updated = [shipment, ...shipments];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  updateStatus(shipmentId: string, status: string): DemoShipment[] {
    const shipments = demoShipmentService.getAll();
    if (!shipments.some((shipment) => shipment.id === shipmentId)) {
      throw new Error('Không tìm thấy vận đơn.');
    }
    const updated = shipments.map((shipment) =>
      shipment.id === shipmentId ? { ...shipment, status } : shipment,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  cancel(shipmentId: string): DemoShipment[] {
    const shipments = demoShipmentService.getAll();
    if (!shipments.some((shipment) => shipment.id === shipmentId)) {
      throw new Error('Không tìm thấy vận đơn.');
    }
    const updated = shipments.map((shipment) =>
      shipment.id === shipmentId ? { ...shipment, status: 'CANCELLED' } : shipment,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },
};
