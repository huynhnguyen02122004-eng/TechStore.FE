import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { demoCartService, type DemoCartItem } from '../../../services/demoCartService';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export function CartPage() {
  const [items, setItems] = useState<DemoCartItem[]>(() => demoCartService.getItems());
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const updateQuantity = (variantId: string, quantity: number) => {
    demoCartService.setQuantity(variantId, quantity);
    setItems(demoCartService.getItems());
  };

  const removeItem = (variantId: string) => {
    demoCartService.removeItem(variantId);
    setItems(demoCartService.getItems());
  };

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">TechStore</p>
            <h1 className="mt-1 text-2xl font-extrabold">Giỏ hàng</h1>
          </div>
          <Link to="/" className="hidden items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 sm:flex">
            <ArrowLeft className="h-4 w-4" />
            Tiếp tục mua sắm
          </Link>
        </div>

        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          Đây là giỏ hàng demo được lưu trên trình duyệt để kiểm tra giao diện. Dữ liệu không gửi lên máy chủ.
        </p>

        {items.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold">Giỏ hàng đang trống</h2>
            <p className="mt-2 text-sm text-slate-500">Chọn cấu hình sản phẩm mẫu rồi thêm vào giỏ để xem thử.</p>
            <Link to="/product/mock-iphone" className="mt-5 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
              Xem sản phẩm mẫu
            </Link>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-bold">Sản phẩm ({items.reduce((count, item) => count + item.quantity, 0)})</h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li key={item.variantId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <Link to={`/product/${item.productId}`} className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2">
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/product/${item.productId}`} className="font-bold text-slate-800 hover:text-blue-600">
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">{item.variantLabel}</p>
                      <p className="mt-1 text-xs text-slate-400">SKU: {item.sku}</p>
                      <div className="mt-3 flex items-center justify-between sm:justify-start sm:gap-6">
                        <div className="flex h-9 items-center rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="flex h-full w-9 items-center justify-center text-slate-500 hover:text-blue-600"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="flex h-full w-9 items-center justify-center text-slate-500 hover:text-blue-600"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <strong className="text-sm text-red-600">{formatCurrency(item.unitPrice * item.quantity)}</strong>
                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Xóa ${item.productName} khỏi giỏ`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold">Tóm tắt đơn hàng</h2>
              <div className="mt-4 flex justify-between text-sm text-slate-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-100 pt-4">
                <strong>Tổng cộng</strong>
                <strong className="text-lg text-red-600">{formatCurrency(total)}</strong>
              </div>
              <Link to="/checkout" className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#1b64c7] text-sm font-bold text-white transition hover:bg-blue-700">
                Tiếp tục đặt hàng
              </Link>
              <p className="mt-3 text-center text-xs text-slate-400">Thanh toán demo hoặc kết nối API đặt hàng.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
