type IconProps = {
  className?: string;
};

const base = "w-[18px] h-[18px]";

export function IconInstagram({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className={className}
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFacebook({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className={className}
      aria-hidden
    >
      <path d="M14 8.5h2.5V5.5h-2.5c-2.5 0-4 1.5-4 4.2V12H7.5v3h2V21h3v-6h2.6l.4-3H12.5v-2.1c0-.8.2-1.4 1.5-1.4Z" />
    </svg>
  );
}

export function IconWhatsApp({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className={className}
      aria-hidden
    >
      <path d="M22 11.08c0-4.05-3.3-7.33-7.37-7.33-4.05 0-7.35 3.28-7.35 7.33 0 1.63.53 3.12 1.43 4.34l-1 3.66 3.75-1a7.3 7.3 0 0 0 3.17.73H15c4.05 0 7-3.3 7-7.33z" />
      <path d="M17.5 14c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1-.2.2-.6.7-.8.9-.1.1-.3.1-.5 0-1-.5-1.7-1-2.4-2.2-.2-.3 0-.6.2-.8.1-.1.3-.3.4-.5.1-.1.2-.3.1-.5-.1-.2-.5-1.2-.6-1.6-.1-.4-.3-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.2-.5 1.4-1 .2-.5.2-1 .1-1.1-.1-.2-.3-.3-.6-.4z" />
    </svg>
  );
}

export function IconMail({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className={className}
      aria-hidden
    >
      <rect x="3.5" y="6" width="17" height="12" rx="1.5" />
      <path d="M4 7.5 12 13l8-5.5" />
    </svg>
  );
}

export function IconMapPin({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className={className}
      aria-hidden
    >
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}
