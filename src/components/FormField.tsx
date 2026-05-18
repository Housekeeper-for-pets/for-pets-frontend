import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// 로그인/회원가입 폼에서 반복되는 라벨과 입력창을 묶은 컴포넌트입니다.
function FormField({ label, id, ...inputProps }: FormFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-semibold text-[#3E3730]">{label}</span>
      <input
        id={id}
        className="mt-2 w-full rounded-2xl border border-[#E7DCD1] bg-white px-4 py-3 text-sm text-[#2A2622] outline-none transition placeholder:text-[#B0A59A] focus:border-[#E26B4A] focus:ring-4 focus:ring-[#F7D8CC]"
        {...inputProps}
      />
    </label>
  );
}

export default FormField;
