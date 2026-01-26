"use client";

import { cn } from "@vision_dashboard/ui/cn";
import {
  LayoutDashboard,
  LineChart,
  History,
  Camera,
  Users,
  Settings,
  Utensils,
  DollarSign,
  Target,
  Package,
  BarChart3,
  CheckSquare,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  path: string;
  name: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  adminOnly?: boolean;
};

const items: NavItem[] = [
  {
    path: "/",
    name: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/executive",
    name: "Executive",
    icon: LineChart,
  },
  {
    path: "/history",
    name: "History",
    icon: History,
  },
  {
    path: "/cameras",
    name: "Cameras",
    icon: Camera,
  },
  {
    path: "/reviewed-detections",
    name: "Reviewed",
    icon: CheckSquare,
  },
  {
    path: "/menu-management",
    name: "Menu",
    icon: Utensils,
  },
  {
    path: "/pricing",
    name: "Pricing",
    icon: DollarSign,
  },
  {
    path: "/waste-targets",
    name: "Targets",
    icon: Target,
  },
  {
    path: "/trays",
    name: "Trays",
    icon: Package,
  },
  {
    path: "/restaurant-metrics",
    name: "Metrics",
    icon: BarChart3,
  },
  {
    path: "/users",
    name: "Users",
    icon: Users,
    adminOnly: true,
  },
  {
    path: "/settings",
    name: "Settings",
    icon: Settings,
  },
  {
    path: "/account",
    name: "Account",
    icon: User,
  },
];

interface ItemProps {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
  onSelect?: () => void;
  userRole?: string;
}

const Item = ({
  item,
  isActive,
  isExpanded,
  onSelect,
  userRole,
}: ItemProps) => {
  const Icon = item.icon;

  // Hide admin-only items from non-admin users
  if (item.adminOnly && userRole !== "admin") {
    return null;
  }

  return (
    <Link
      prefetch
      href={item.path}
      onClick={() => onSelect?.()}
      className="group block"
    >
      <div
        className={cn(
          "relative flex items-center h-[32px] mx-3 rounded-md transition-all duration-150",
          isActive
            ? "bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a]"
            : "border border-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a]",
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-[32px] h-[32px] flex-shrink-0",
            isActive
              ? "text-black dark:text-white"
              : "text-[#878787] group-hover:text-black dark:group-hover:text-white",
          )}
        >
          <Icon size={15} />
        </div>

        {/* Label */}
        {isExpanded && (
          <span
            className={cn(
              "text-xs font-medium whitespace-nowrap overflow-hidden pr-3 transition-colors duration-150",
              isActive
                ? "text-black dark:text-white"
                : "text-[#878787] group-hover:text-black dark:group-hover:text-white",
            )}
          >
            {item.name}
          </span>
        )}
      </div>
    </Link>
  );
};

type Props = {
  onSelectAction?: () => void;
  isExpanded?: boolean;
  userRole?: string;
};

export function MainMenu({ onSelectAction, isExpanded = false, userRole }: Props) {
  const pathname = usePathname();

  // Remove locale prefix for matching
  const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const normalizedPath = pathWithoutLocale === "" ? "/" : pathWithoutLocale;

  return (
    <nav className="mt-4 w-full">
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive =
            (normalizedPath === "/" && item.path === "/") ||
            (normalizedPath !== "/" &&
              item.path !== "/" &&
              normalizedPath.startsWith(item.path));

          return (
            <Item
              key={item.path}
              item={item}
              isActive={isActive}
              isExpanded={isExpanded}
              onSelect={onSelectAction}
              userRole={userRole}
            />
          );
        })}
      </div>
    </nav>
  );
}
