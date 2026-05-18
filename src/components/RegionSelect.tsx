import { useEffect, useState } from 'react';
import { regionGroups } from '../constants/options';
import type { Region } from '../types';

interface RegionSelectProps {
  value?: Region;
  onChange: (value: Region | undefined) => void;
  selectClassName: string;
  idPrefix: string;
  emptyValue?: Region;
  allLabel?: string;
}

const findSelectedGroup = (value?: Region) =>
  regionGroups.find((group) =>
    group.options.some((option) => option.value === value),
  );

// 전국 지역을 시·도 선택 후 시·군·구 선택으로 나누어 입력받는 컴포넌트입니다.
function RegionSelect({
  value,
  onChange,
  selectClassName,
  idPrefix,
  emptyValue,
  allLabel = '지역 선택',
}: RegionSelectProps) {
  const selectedGroup = findSelectedGroup(value);
  const [selectedGroupLabel, setSelectedGroupLabel] = useState(
    selectedGroup?.label ?? '',
  );
  const currentGroup =
    regionGroups.find((group) => group.label === selectedGroupLabel) ?? selectedGroup;

  useEffect(() => {
    setSelectedGroupLabel(selectedGroup?.label ?? '');
  }, [selectedGroup?.label]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block" htmlFor={`${idPrefix}-province`}>
        <span className="text-sm font-semibold text-[#3E3730]">시·도</span>
        <select
          id={`${idPrefix}-province`}
          className={selectClassName}
          value={selectedGroupLabel}
          onChange={(event) => {
            setSelectedGroupLabel(event.target.value);

            if (!event.target.value) {
              onChange(emptyValue);
              return;
            }

            onChange(emptyValue);
          }}
        >
          <option value="">{allLabel}</option>
          {regionGroups.map((group) => (
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
            onChange(event.target.value ? event.target.value : emptyValue);
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
    </div>
  );
}

export default RegionSelect;
