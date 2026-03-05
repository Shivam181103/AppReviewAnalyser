import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Reviews", href: "/reviews", icon: MessageSquare },
  { name: "Insights", href: "/insights", icon: Lightbulb },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Competitors", href: "/competitors", icon: TrendingUp },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-muted/10 p-6 flex flex-col">
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <BarChart3 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">ReviewLens</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t">
          <UserButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
