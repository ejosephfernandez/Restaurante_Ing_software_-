const iconPaths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.3" /><rect x="14" y="3" width="7" height="7" rx="1.3" /><rect x="3" y="14" width="7" height="7" rx="1.3" /><rect x="14" y="14" width="7" height="7" rx="1.3" /></>,
  tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  refresh: <><path d="M20 7v5h-5" /><path d="M4.5 9a7.8 7.8 0 0 1 13-2.5L20 12M4 17v-5h5" /><path d="M19.5 15a7.8 7.8 0 0 1-13 2.5L4 12" /></>,
  edit: <><path d="m15 5 4 4" /><path d="M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" /></>,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  utensils: <><path d="M7 3v7M4.5 3v4a2.5 2.5 0 0 0 5 0V3M7 9.5V21" /><path d="M16 3v18M16 3c3 2 4 5 4 8h-4" /></>,
  warning: <><path d="M12 3 22 20H2L12 3Z" /><path d="M12 9v4M12 16h.01" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.3 7.7 7.7 4.4 7.7-4.4M12 12.1V21" /></>,
  currency: <><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></>,
  clipboard: <><rect x="5" y="5" width="14" height="16" rx="2" /><path d="M9 5V3h6v2M8 10h8M8 14h8M8 18h5" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2" /></>,
  table: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M3 9h18M9 9v8M15 9v8M7 21h10M12 17v4" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  arrowRight: <><path d="M4 12h16M13 5l7 7-7 7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
  coffee: <><path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8ZM17 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2M16 3v2" /></>,
  logout: <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 16l4-4-4-4M8 12h10" /></>,
};

const namedSizes = {
  xs: "var(--siar-icon-xs, 14px)",
  sm: "var(--siar-icon-sm, 16px)",
  md: "var(--siar-icon-md, 18px)",
  lg: "var(--siar-icon-lg, 22px)",
  xl: "var(--siar-icon-xl, 24px)",
};

export default function SiarIcon({ name, size = "md", strokeWidth, className = "", title }) {
  const resolvedSize = typeof size === "number" ? `${size}px` : (namedSizes[size] || namedSizes.md);
  return (
    <svg
      className={`siar-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      style={{ width: resolvedSize, height: resolvedSize, flex: "0 0 auto", strokeWidth: strokeWidth ?? "var(--siar-icon-stroke, 1.8)" }}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {iconPaths[name] || iconPaths.grid}
    </svg>
  );
}
