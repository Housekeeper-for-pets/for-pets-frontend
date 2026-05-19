import { useState } from 'react';
import { regionGroups } from '../constants/options';
import type { Region } from '../types';

interface RegionSelectProps {
  value?: Region;
  onChange: (value: Region | undefined) => void;
  selectClassName: string;
  idPrefix: string;
  emptyValue?: Region;
  allLabel?: string;
  helperText?: string;
}

// 현재 백엔드 Region enum은 서울 25개 구만 지원하므로, 전송 가능한 지역만 노출합니다.
const selectableRegionGroups = regionGroups.filter(
  (group) => group.label === '서울특별시',
);

const findSelectedGroup = (value?: Region) =>
  selectableRegionGroups.find((group) =>
    group.options.some((option) => option.value === value),
  );

// 지역을 시·도 선택 후 시·군·구 선택으로 나누어 입력받는 컴포넌트입니다.
function RegionSelect({
  value,
  onChange,
  selectClassName,
  idPrefix,
  emptyValue,
  allLabel = '지역 선택',
  helperText = '현재 백엔드 지원 지역은 서울특별시 25개 구입니다.',
}: RegionSelectProps) {
  const selectedGroup = findSelectedGroup(value);
  const [pendingGroupLabel, setPendingGroupLabel] = useState('');
  const selectedGroupLabel = selectedGroup?.label ?? pendingGroupLabel;
  const currentGroup =
    selectableRegionGroups.find((group) => group.label === selectedGroupLabel) ??
    selectedGroup;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block" htmlFor={`${idPrefix}-province`}>
        <span className="text-sm font-semibold text-[#3E3730]">시·도</span>
        <select
          id={`${idPrefix}-province`}
          className={selectClassName}
          value={selectedGroupLabel}
          onChange={(event) => {
            setPendingGroupLabel(event.target.value);

            if (!event.target.value) {
              onChange(emptyValue);
              return;
            }

            onChange(emptyValue);
          }}
        >
          <option value="">{allLabel}</option>
          {selectableRegionGroups.map((group) => (
            <option key={group.label} value={group.label}>
              {group.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block" htmlFor={`${idPrefix}-district`}>
        <span className="text-sm font-semibold text-[#3E3730]">시·군·구</span>
        <select
          id={`${idPrefix}-district`}
          className={selectClassName}
          disabled={!selectedGroupLabel}
          value={value && value !== emptyValue ? value : ''}
          onChange={(event) => {
            onChange(event.target.value ? (event.target.value as Region) : emptyValue);
          }}
        >
          <option value="">시·군·구 선택</option>
          {(currentGroup?.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {helperText && (
        <p className="text-xs font-medium leading-5 text-[#8A8178] md:col-span-2">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default RegionSelect;
