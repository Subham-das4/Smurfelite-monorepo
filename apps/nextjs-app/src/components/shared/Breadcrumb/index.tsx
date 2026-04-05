import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      className="flex flex-wrap gap-2 mb-6 md:mb-10 text-sm md:text-base"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span className="material-symbols-outlined text-slate-400 text-sm pt-0.5">
              chevron_right
            </span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-slate-500 hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
