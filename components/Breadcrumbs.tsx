import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.label} className="flex items-center">
            {!isLast ? (
              <Link
                href={item.href || "#"}
                className="hover:text-foreground transition-colors font-lexend"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium font-lexend">
                {item.label}
              </span>
            )}

            {!isLast && (
              <ChevronRight className="mx-2 h-4 w-4" />
            )}
          </div>
        );
      })}
    </nav>
  );
}