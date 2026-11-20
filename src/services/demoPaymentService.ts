import type { PaymentOrderResponse } from './checkoutService';
import { demoOrderService } from './demoOrderService';

const STORAGE_KEY = 'techstore-demo-payments';

export const demoPaymentService = {
  getAll(): PaymentOrderResponse[] {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as PaymentOrderResponse[];
    }
    const payments = demoOrderService.getAll().map((result) => {
      const order = result.order;
      const cod = String(order.paymentMethod).toUpperCase() === 'COD';
      return {
        id: result.payment.paymentReference,
        orderId: order.id,
        orderCode: order.orderCode,
        customerName: order.customerName,
        amount: order.grandTotal,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentReference: result.payment.paymentReference,
        status: cod ? (result.payment.status === 'PAID' ? 'PAID' : 'PENDING') : result.payment.status,
        createdAt: order.createdAt,
        paidAt: result.payment.status === 'PAID' ? order.createdAt : undefined,
      } satisfies PaymentOrderResponse;
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
    return payments;
  },

  confirmCod(paymentId: string): PaymentOrderResponse[] {
    const payments = demoPaymentService.getAll();
    const target = payments.find((payment) => payment.id === paymentId);
    if (!target) throw new Error('Không tìm thấy giao dịch thanh toán.');
    if (String(target.paymentMethod).toUpperCase() !== 'COD') {
      throw new Error('Chỉ có thể xác nhận thu tiền đối với đơn COD.');
    }
    if (target.status?.toUpperCase() === 'PAID') {
      throw new Error('Giao dịch này đã được xác nhận thu tiền, không thể thu trùng.');
    }
    const updated = payments.map((payment) =>
      payment.id === paymentId
        ? { ...payment, status: 'PAID', paidAt: new Date().toISOString() }
        : payment,
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },
};
