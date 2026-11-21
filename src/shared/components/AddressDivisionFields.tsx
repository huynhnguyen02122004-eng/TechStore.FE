import { useEffect, useState } from 'react';
import axios from 'axios';
import { locationService, type LocationOption } from '../../services/checkoutService';
import type { NewShippingAddress } from '../../services/checkoutService';

type Division = LocationOption;
type AddressDivisions = Pick<NewShippingAddress, 'province' | 'provinceCode' | 'district' | 'districtCode' | 'ward' | 'wardCode'>;

const savedOption = '__saved';
const selectClassName = 'mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500';

function DivisionSelect({ label, options, selected, savedName, disabled, onChange }: {
  label: string;
  options: Division[];
  selected?: Division;
  savedName: string;
  disabled?: boolean;
  onChange: (division?: Division) => void;
}) {
  return (
    <label className="min-w-0 text-sm font-semibold">
      {label}
      <select
        required
        disabled={disabled}
        value={selected?.code ?? (savedName ? savedOption : '')}
        onChange={(event) => onChange(options.find((option) => option.code === event.target.value))}
        className={selectClassName}
      >
        <option value="">Chọn {label.toLocaleLowerCase('vi')}</option>
        {savedName && !selected && <option value={savedOption} disabled>{savedName} (đã lưu)</option>}
        {options.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
      </select>
    </label>
  );
}

export function AddressDivisionFields({ address, onChange }: {
  address: AddressDivisions;
  onChange: (divisions: AddressDivisions) => void;
}) {
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    locationService.getProvinces().then((items) => {
      if (active) setProvinces(items);
    }).catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, []);

  const province = provinces.find((item) => item.code === address.provinceCode);
  const district = districts.find((item) => item.code === address.districtCode);
  const ward = wards.find((item) => item.code === address.wardCode);

  useEffect(() => {
    if (!province?.code) { setDistricts([]); return; }
    let active = true;
    setDistricts([]);
    locationService.getDistricts(province.code).then((items) => {
      if (active) setDistricts(items);
    }).catch((error: unknown) => {
      if (active && (!axios.isAxiosError(error) || error.response?.status !== 401)) setLoadFailed(true);
    });
    return () => { active = false; };
  }, [province?.code]);

  useEffect(() => {
    if (!district?.code) { setWards([]); return; }
    let active = true;
    setWards([]);
    locationService.getWards(district.code).then((items) => {
      if (active) setWards(items);
    }).catch((error: unknown) => {
      if (active && (!axios.isAxiosError(error) || error.response?.status !== 401)) setLoadFailed(true);
    });
    return () => { active = false; };
  }, [district?.code]);

  return (
    <>
      <DivisionSelect
        label="Tỉnh / Thành phố"
        options={provinces}
        selected={province}
        savedName={address.province}
        onChange={(next) => onChange({
          province: next?.name ?? '', provinceCode: next?.code,
          district: '', districtCode: undefined, ward: '', wardCode: undefined,
        })}
      />
      <DivisionSelect
        label="Quận / Huyện"
        options={districts}
        selected={district}
        savedName={address.district}
        disabled={!province || districts.length === 0}
        onChange={(next) => onChange({
          province: province?.name ?? '', provinceCode: province?.code,
          district: next?.name ?? '', districtCode: next?.code, ward: '', wardCode: undefined,
        })}
      />
      <DivisionSelect
        label="Phường / Xã"
        options={wards}
        selected={ward}
        savedName={address.ward}
        disabled={!district || wards.length === 0}
        onChange={(next) => onChange({
          province: province?.name ?? '', provinceCode: province?.code,
          district: district?.name ?? '', districtCode: district?.code,
          ward: next?.name ?? '', wardCode: next?.code,
        })}
      />
      {loadFailed && <p role="alert" className="text-sm text-red-700 sm:col-span-2">Không tải được danh mục địa chỉ. Vui lòng tải lại trang.</p>}
      {!loadFailed && provinces.length === 0 && <p role="status" className="text-sm text-slate-500 sm:col-span-2">Đang tải danh mục địa chỉ…</p>}
    </>
  );
}


