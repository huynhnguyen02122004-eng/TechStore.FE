import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Minus, PackageCheck, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { CartItemResponse } from '../../../shared/api/endpoints/cartApi';
import {
  getAccountCart,
  getCartApiErrorMessage,
  getCurrentAccessToken,
  removeAccountCartItem,
  updateAccountCartItem,
  cartUpdatedEvent,
} from '../../../services/cartService';

type CartLine = {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  imageUrl: string;
  quantity: number;
  totalPrice: number | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const toAmount = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const fromAccountCartItem = (item: CartItemResponse): CartLine => {
  const quantity = toAmount(item.quantity) ?? 0;
  const unitPrice = toAmount(item.price);
  return {
    id: item.id ?? '',
    variantId: item.variantId ?? '',
    productName: item.productName ?? '',
    variantName: item.variantName ?? '',
    sku: item.sku ?? '',
    imageUrl: item.imageUrl ?? '',
    quantity,
    totalPrice: toAmount(item.lineTotal) ?? (unitPrice === null ? null : unitPrice * quantity),
  };
};

const totalLineAmounts = (lines: CartLine[]): number | null =>
  lines.every((line) => line.totalPrice !== null)
    ? lines.reduce((total, line) => total + (line.totalPrice ?? 0), 0)
    : null;

export function CartPage() {
  const token = getCurrentAccessToken();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CartLine[]>([]);
  const [subtotal, setSubtotal] = useState<number | null>(0);
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [grandTotal, setGrandTotal] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addFailureNotice = searchParams.get('cartError') === 'add'
    ? 'Đăng nhập thành công nhưng không thể thêm cấu hình này vào giỏ. Vui lòng thử lại.'
    : null;

  const refreshCart = useCallback(async () => {
    if (!token) {
      setItems([]);
      setSubtotal(0);
      setShippingFee(null);
      setGrandTotal(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const cart = await getAccountCart(token);
      const lines = (cart.items ?? []).map(fromAccountCartItem);
      const lineTotal = totalLineAmounts(lines);
      const cartSubtotal = toAmount(cart.subtotal) ?? lineTotal;
      setItems(lines);
      setSubtotal(cartSubtotal);
      setShippingFee(null);
      setGrandTotal(cartSubtotal);
      setError(lines.some((line) => !line.variantId)
        ? 'API giỏ hàng không trả mã variantId cho mặt hàng; chưa thể sửa hoặc xóa mặt hàng này.'
        : lines.some((line) => line.totalPrice === null)
          ? 'API giỏ hàng chưa trả giá hợp lệ cho một hoặc nhiều mặt hàng.'
          : null);
    } catch (requestError) {
      setError(getCartApiErrorMessage(requestError, 'Không thể tải giỏ hàng. Vui lòng thử lại.'));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshCart();
    window.addEventListener(cartUpdatedEvent, refreshCart);
    return () => window.removeEventListener(cartUpdatedEvent, refreshCart);
  }, [refreshCart]);

  const changeQuantity = async (item: CartLine, quantity: number) => {
    setBusyItemId(item.id);
    setError(null);
    try {
      if (!token) return;
      if (!item.variantId) {
        setError('API giỏ hàng không trả mã variantId cho mặt hàng; chưa thể cập nhật mặt hàng này.');
        return;
      }
      if (quantity < 1) await removeAccountCartItem(token, item.variantId);
      else await updateAccountCartItem(token, item.variantId, quantity);
      await refreshCart();
    } catch (requestError) {
      setError(getCartApiErrorMessage(requestError, 'Không thể cập nhật giỏ hàng. Vui lòng thử lại.'));
    } finally {
      setBusyItemId(null);
    }
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

        {!token ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold">Đăng nhập để xem giỏ hàng</h2>
            <p className="mt-2 text-sm text-slate-500">Giỏ hàng được lưu theo tài khoản. Hãy đăng nhập để tải giỏ hàng thực tế của bạn.</p>
            <Link to="/login?returnUrl=%2Fcart" className="mt-5 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
              Đăng nhập
            </Link>
          </section>
        ) : (
        <>
        {addFailureNotice && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{addFailureNotice}
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" aria-label="Đang tải giỏ hàng" />
        ) : items.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold">Giỏ hàng đang trống</h2>
            <p className="mt-2 text-sm text-slate-500">Khám phá sản phẩm và thêm cấu hình bạn yêu thích vào giỏ.</p>
            <Link to="/" className="mt-5 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
              Tiếp tục mua sắm
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
                  <li key={item.id || item.variantId || item.sku} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    {item.imageUrl ? (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2">
                        <img src={item.imageUrl} alt={item.productName || item.variantName} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-600">
                        <PackageCheck className="h-10 w-10" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800">{item.productName || item.variantName || item.sku}</p>
                      {item.productName && item.variantName && <p className="mt-1 text-sm text-slate-500">{item.variantName}</p>}
                      <p className="mt-1 text-xs text-slate-400">SKU: {item.sku}</p>
                      <div className="mt-3 flex items-center justify-between gap-3 sm:justify-start sm:gap-6">
                        <div className="flex h-9 items-center rounded-lg border border-slate-200">
                          <button type="button" disabled={busyItemId === item.id} onClick={() => void changeQuantity(item, item.quantity - 1)} className="flex h-full w-9 items-center justify-center text-slate-500 hover:text-blue-600 disabled:opacity-50" aria-label="Giảm số lượng">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button type="button" disabled={busyItemId === item.id} onClick={() => void changeQuantity(item, item.quantity + 1)} className="flex h-full w-9 items-center justify-center text-slate-500 hover:text-blue-600 disabled:opacity-50" aria-label="Tăng số lượng">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <strong className="text-sm text-red-600">{item.totalPrice === null ? '—' : formatCurrency(item.totalPrice)}</strong>
                        <button type="button" disabled={busyItemId === item.id} onClick={() => void changeQuantity(item, 0)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label={`Xóa ${item.productName || item.variantName} khỏi giỏ`}>
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
              <div className="mt-4 flex justify-between text-sm text-slate-600"><span>Tạm tính</span><span>{subtotal === null ? '—' : formatCurrency(subtotal)}</span></div>
              <div className="mt-3 flex justify-between text-sm text-slate-600"><span>Phí vận chuyển</span><span>{shippingFee === null || shippingFee <= 0 ? 'Tính khi đặt hàng' : formatCurrency(shippingFee)}</span></div>
              <div className="mt-3 flex justify-between border-t border-slate-100 pt-4">
                <strong>Tổng cộng hiện tại</strong>
                <strong className="text-lg text-red-600">{grandTotal === null ? '—' : formatCurrency(grandTotal)}</strong>
              </div>
              <Link to="/checkout" className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#1b64c7] text-sm font-bold text-white transition hover:bg-blue-700">
                Tiếp tục đặt hàng
              </Link>
            </aside>
          </div>
        )}
        </>
        )}
      </div>
    </main>
  );
}
