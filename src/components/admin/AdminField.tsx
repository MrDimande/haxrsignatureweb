import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const labelClass =
  "block font-mono text-[9px] tracking-[0.35em] uppercase text-grey/70 mb-2";

export const adminInputClass =
  "w-full bg-black-soft border border-grey-dark/80 focus:border-admin-gold/50 text-white font-sans text-sm px-4 py-3 outline-none placeholder:text-grey/40 transition-colors duration-300 rounded-sm";

export const adminSelectClass = `${adminInputClass} admin-select`;

type AdminFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function AdminField({ label, children, className = "" }: AdminFieldProps) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

type AdminInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function AdminInput({ label, className = "", ...props }: AdminInputProps) {
  return (
    <AdminField label={label}>
      <input className={`${adminInputClass} ${className}`} {...props} />
    </AdminField>
  );
}

type AdminSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function AdminSelect({
  label,
  className = "",
  children,
  ...props
}: AdminSelectProps) {
  return (
    <AdminField label={label}>
      <select className={`${adminSelectClass} ${className}`} {...props}>
        {children}
      </select>
    </AdminField>
  );
}

export function AdminTextarea({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <AdminField label={label}>
      <textarea
        className={`${adminInputClass} min-h-[100px] resize-y ${className}`}
        {...props}
      />
    </AdminField>
  );
}
