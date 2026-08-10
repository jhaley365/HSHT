import {
  Home,
  Activity,
  Users,
  Building2,
  Network,
  BarChart3,
  ClipboardList,
  Upload,
  Settings,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  expandable?: boolean;
  adminOnly?: boolean;
  children?: { label: string; href: string }[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  {
    label: "Activity",
    href: "/activity",
    icon: Activity,
    expandable: true,
    children: [
      { label: "New", href: "/activity/new" },
      { label: "List", href: "/activity/list" },
      { label: "Items", href: "/activity/items" },
      { label: "Funding Source", href: "/activity/funding-source" },
    ],
  },
  { label: "Students", href: "/students", icon: Users },
  { label: "Schools", href: "/schools", icon: Building2 },
  { label: "School Districts", href: "/districts", icon: Network },
  { label: "Reports", href: "/reports", icon: BarChart3, expandable: true },
  { label: "Enrollment Forms", href: "/enrollment-forms", icon: ClipboardList },
  { label: "Exports", href: "/exports", icon: Upload, expandable: true },
  { label: "Utility", href: "/utility", icon: Settings, expandable: true },
  { label: "Users", href: "/users", icon: UserCog, adminOnly: true },
];
