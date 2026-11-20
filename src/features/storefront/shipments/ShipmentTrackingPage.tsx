import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  PackageCheck,
  Search,
  Truck,
} from 'lucide-react';
import {
  checkoutService,
  type ShipmentDetailsResponse,
  type ShipmentStatusHistoryResponse,
} from '../../../services/checkoutService';

const DEMO_TRACKING_CODE = 'DEMO-TRK-2026-001';

const shipmentStatusLabels: Record<string, string> = {
  CREATED: 'Đã tạo vận đơn',
  PENDING: 'Chờ lấy hàng',
  PICKEDUP: 'Shipper đã lấy hàng',
  INTRANSIT: 'Đang trên đường giao',
  DELIVERING: 'Đang phát hàng',
  DELIVERED: 'Giao hàng thành công',
  CANCELLED: 'Đã hủy vận đơn',
};

const demoShipment: ShipmentDetailsResponse = {
  id: 'demo-shipment-001',
  provider: 'GHN',
  trackingCode: DEMO_TRACKING_CODE,
  status: 'INTRANSIT',
  expectedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  statusHistories: [
    {
      id: 'demo-history-created',
      status: 'CREATED',
      description: 'Đơn vị vận chuyển đã tiếp nhận thông tin đơn hàng',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdByName: 'TechStore',
    },
    {
      id: 'demo-history-picked-up',
      status: 'PICKEDUP',
      description: 'Shipper đã lấy hàng tại cửa hàng',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      createdByName: 'Nhân viên giao hàng',
    },
    {
      id: 'demo-history-in-transit',
      status: 'INTRANSIT',
      description: 'Đơn hàng đang trên đường đến bưu cục khu vực',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdByName: 'GHN',
    },
  ],
};

const statusKey = (status?: string) => status?.toUpperCase().replaceAll('_', '').replaceAll(' ', '') ?? '';

const formatStatus = (status?: string) =>
  status ? shipmentStatusLabels[statusKey(status)] ?? status.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ') : 'Chưa cập nhật';

const formatDate = (value?: string) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Chưa cập nhật'
    : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const getApiError = (error: unknown) => {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.message || 'Không thể tra cứu vận đơn. Vui lòng thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể tra cứu vận đơn. Vui lòng thử lại.';
};

const getShipmentError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return 'Không tìm thấy mã vận đơn. Vui lòng kiểm tra lại mã và thử lại.';
  }
  return getApiError(error);
};

const shipmentDate = (shipment: ShipmentDetailsResponse) =>
  shipment.expectedDeliveryDate ??
  shipment.estimatedDeliveryDate ??
  shipment.expectedDeliveryAt;

const historyDate = (history: ShipmentStatusHistoryResponse) => history.createdAt ?? history.timestamp;

export function ShipmentTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeCode = searchParams.get('trackingCode')?.trim() ?? '';
  const [draft, setDraft] = useState({ routeCode, value: routeCode });
  const [lookupVersion, setLookupVersion] = useState(0);
  const [lookupResult, setLookupResult] = useState<{
    key: string;
    shipment: ShipmentDetailsResponse | null;
    error: string | null;
  } | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const trackingCode = draft.routeCode === routeCode ? draft.value : routeCode;
  const requestKey = `${routeCode}:${lookupVersion}`;
  const currentResult = lookupResult?.key === requestKey ? lookupResult : null;
  const shipment = currentResult?.shipment ?? null;
  const error = currentResult?.error ?? null;
  const isLoading = Boolean(routeCode) && currentResult === null;
  const isDemoResult = routeCode.toUpperCase() === DEMO_TRACKING_CODE;

  useEffect(() => {
    if (!routeCode) return;

    let active = true;

    const request = isDemoResult
      ? Promise.resolve(demoShipment)
      : checkoutService.getShipmentByTrackingCode(routeCode);

    request
      .then((result) => {
        if (!active) return;
        if (!result) {
          setLookupResult({
            key: requestKey,
            shipment: null,
            error: 'Không tìm thấy mã vận đơn. Vui lòng kiểm tra lại mã và thử lại.',
          });
          return;
        }
        setLookupResult({ key: requestKey, shipment: result, error: null });
      })
      .catch((requestError: unknown) => {
        if (active) {
          setLookupResult({
            key: requestKey,
            shipment: null,
            error: getShipmentError(requestError),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [routeCode, lookupVersion, isDemoResult, requestKey]);

  const sortedHistory = useMemo(
    () =>
      [...(shipment?.statusHistories ?? [])].sort((a, b) => {
        const aTime = new Date(historyDate(a) ?? 0).getTime();
        const bTime = new Date(historyDate(b) ?? 0).getTime();
        return aTime - bTime;
      }),
    [shipment?.statusHistories],
  );

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = trackingCode.trim();
    if (!code) {
      setInputError('Vui lòng nhập mã vận đơn.');
      return;
    }
    setInputError(null);
    setDraft({ routeCode: code, value: code });
    setSearchParams({ trackingCode: code }, { replace: true });
    setLookupVersion((version) => version + 1);
  };

  const currentStatus = shipment?.status ?? sortedHistory.at(-1)?.status;
  const currentStatusKey = statusKey(currentStatus);
  const providerName = shipment?.provider?.toUpperCase() === 'MANUAL'
    ? 'Nội bộ'
    : shipment?.provider || 'Chưa cập nhật';

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-[#f5f7fb] px-4 py-8 pb-12 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f56bd] via-[#1459bd] to-[#173d8d] px-5 py-8 text-white shadow-lg sm:px-9 sm:py-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Truck className="h-7 w-7" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">TechStore · Theo dõi đơn hàng</p>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Tra cứu vận đơn</h1>
            <p className="mt-2 text-sm leading-6 text-blue-100">Nhập mã vận đơn để xem trạng thái giao hàng mới nhất.</p>

            <form onSubmit={submitSearch} className="mt-6 flex flex-col gap-2 rounded-2xl bg-white p-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Mã vận đơn</span>
                <PackageCheck className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={trackingCode}
                  onChange={(event) => {
                    setDraft({ routeCode, value: event.target.value });
                    if (inputError) setInputError(null);
                  }}
                  placeholder="Ví dụ: GHN123456789"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border-0 bg-white pl-11 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <button type="submit" disabled={isLoading} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f56bd] px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
                {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Search className="h-4 w-4" />}
                Tra cứu
              </button>
            </form>
            {inputError && <p role="alert" className="mt-2 text-left text-sm text-amber-100">{inputError}</p>}
          </div>
        </section>

        {!routeCode && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <MapPin className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-bold">Bạn có thể tìm mã vận đơn trong chi tiết đơn hàng</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Mã vận đơn được cung cấp sau khi đơn hàng được bàn giao cho đơn vị vận chuyển.</p>
              <Link to="/profile/orders" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 px-4 text-sm font-bold text-blue-700 hover:bg-blue-50">
                Đến danh sách đơn hàng
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-500">Muốn xem thử giao diện? Dùng mã demo</p>
                <button type="button" onClick={() => setDraft({ routeCode, value: DEMO_TRACKING_CODE })} className="mt-2 rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-200">
                  {DEMO_TRACKING_CODE}
                </button>
              </div>
            </div>
          </section>
        )}

        {error && (
          <section role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Không tìm thấy thông tin vận đơn</p>
              <p className="mt-1 leading-6">{error}</p>
            </div>
          </section>
        )}

        {isLoading && (
          <section className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="Đang tra cứu vận đơn">
            <div className="h-6 w-48 rounded bg-slate-200" />
            <div className="mt-5 h-24 rounded-xl bg-slate-100" />
            <div className="mt-5 h-44 rounded-xl bg-slate-100" />
          </section>
        )}

        {shipment && !isLoading && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Thông tin vận đơn</p>
                  <h2 className="mt-1 break-all text-xl font-extrabold">{shipment.trackingCode || routeCode}</h2>
                </div>
                <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                  currentStatusKey === 'DELIVERED'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : currentStatusKey === 'CANCELLED'
                      ? 'bg-red-50 text-red-700 ring-red-200'
                      : 'bg-blue-50 text-blue-700 ring-blue-200'
                }`}>
                  {formatStatus(currentStatus)}
                </span>
              </div>
              {isDemoResult && <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">Dữ liệu minh họa, không phải trạng thái giao hàng thực tế.</p>}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Đơn vị vận chuyển</p>
                  <p className="mt-1 text-sm font-bold">{providerName}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Ngày dự kiến giao</p>
                  <p className="mt-1 text-sm font-bold">{formatDate(shipmentDate(shipment))}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Cập nhật mới nhất</p>
                  <p className="mt-1 text-sm font-bold">{formatDate(historyDate(sortedHistory.at(-1) ?? {}))}</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-6 sm:px-7">
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold">Hành trình đơn hàng</h3>
              </div>
              {sortedHistory.length > 0 ? (
                <ol className="mt-5">
                  {sortedHistory.map((history, index) => {
                    const isLatest = index === sortedHistory.length - 1;
                    const isTerminal = ['DELIVERED', 'CANCELLED'].includes(statusKey(history.status));
                    return (
                      <li key={history.id ?? `${history.status}-${historyDate(history) ?? index}`} className="relative flex gap-4 pb-6 last:pb-0">
                        {!isLatest && <span aria-hidden="true" className="absolute left-[11px] top-6 h-full w-px bg-slate-200" />}
                        <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          isLatest && isTerminal
                            ? statusKey(history.status) === 'DELIVERED' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                            : isLatest ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isLatest ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                        </span>
                        <div className="min-w-0 flex-1 sm:flex sm:items-start sm:justify-between sm:gap-6">
                          <div>
                            <p className="text-sm font-bold">{history.description || formatStatus(history.status)}</p>
                            {history.status && <p className="mt-1 text-xs text-slate-500">{formatStatus(history.status)}</p>}
                            {history.createdByName && <p className="mt-1 text-xs text-slate-400">Cập nhật bởi {history.createdByName}</p>}
                          </div>
                          <time className="mt-1 block shrink-0 text-xs text-slate-500 sm:mt-0">{formatDate(historyDate(history))}</time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Đơn vị vận chuyển chưa cập nhật các mốc hành trình.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
