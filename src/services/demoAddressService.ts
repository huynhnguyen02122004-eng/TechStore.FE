import type { NewShippingAddress, ShippingAddress } from './checkoutService';

const STORAGE_KEY = 'techstore-demo-addresses';

const demoAddresses: ShippingAddress[] = [
  {
    id: 'demo-address-home',
    recipientName: 'Nguyễn Minh Anh',
    phone: '0912345678',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    streetAddress: '123 Nguyễn Huệ',
    isDefault: true,
  },
  {
    id: 'demo-address-office',
    recipientName: 'Nguyễn Minh Anh',
    phone: '0912345678',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường Võ Thị Sáu',
    streetAddress: '45 Nguyễn Đình Chiểu',
  },
];

const isShippingAddress = (value: unknown): value is ShippingAddress =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  'recipientName' in value &&
  typeof value.recipientName === 'string' &&
  'phone' in value &&
  typeof value.phone === 'string' &&
  'province' in value &&
  typeof value.province === 'string' &&
  'district' in value &&
  typeof value.district === 'string' &&
  'ward' in value &&
  typeof value.ward === 'string' &&
  'streetAddress' in value &&
  typeof value.streetAddress === 'string';

const store = (addresses: ShippingAddress[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  return addresses;
};

const applyDefaultAddress = (addresses: ShippingAddress[], addressId: string, isDefault: boolean) =>
  addresses.map((address) => ({
    ...address,
    isDefault: address.id === addressId ? isDefault : isDefault ? false : address.isDefault,
  }));

export const demoAddressService = {
  getAll: (): ShippingAddress[] => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return store(demoAddresses.map((address) => ({ ...address })));

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isShippingAddress)) {
      throw new Error('Dữ liệu sổ địa chỉ demo không hợp lệ.');
    }
    return parsed;
  },

  create: (address: NewShippingAddress): ShippingAddress[] => {
    const current = demoAddressService.getAll();
    const id = `demo-address-${Date.now()}`;
    const created: ShippingAddress = { ...address, id };
    const updated = applyDefaultAddress([...current, created], id, Boolean(address.isDefault));
    if (!updated.some((item) => item.isDefault) && updated[0]) updated[0].isDefault = true;
    store(updated);
    return updated;
  },

  update: (addressId: string, address: NewShippingAddress): ShippingAddress[] => {
    const current = demoAddressService.getAll();
    if (!current.some((item) => item.id === addressId)) {
      throw new Error('Không tìm thấy địa chỉ demo cần cập nhật.');
    }
    const updated = applyDefaultAddress(
      current.map((item) => item.id === addressId ? { ...address, id: addressId } : item),
      addressId,
      Boolean(address.isDefault),
    );
    if (!updated.some((item) => item.isDefault) && updated[0]) updated[0].isDefault = true;
    store(updated);
    return updated;
  },

  delete: (addressId: string): ShippingAddress[] => {
    const current = demoAddressService.getAll();
    if (!current.some((item) => item.id === addressId)) {
      throw new Error('Không tìm thấy địa chỉ demo cần xóa.');
    }
    const updated = current.filter((item) => item.id !== addressId);
    if (!updated.some((item) => item.isDefault) && updated[0]) updated[0].isDefault = true;
    store(updated);
    return updated;
  },
};
