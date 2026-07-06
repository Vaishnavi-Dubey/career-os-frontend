'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, FileText, GitBranch, GraduationCap, Activity } from 'lucide-react';

const links = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/jobs',      label: 'Jobs',       icon: Briefcase },
  { href: '/resume',    label: 'Resume',     icon: FileText },
  { href: '/github',    label: 'GitHub',     icon: GitBranch },
  { href: '/learning',  label: 'Learning',   icon: GraduationCap },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-slate-800 border-r border-slate-700 flex flex-col z-10">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Activity className="text-indigo-400" size={22} />
          <div>
            <p className="text-sm font-bold text-white leading-tight">Career OS</p>
            <p className="text-xs text-slate-400">100% Free · Local AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">
        <p>Ollama · MongoDB · ChromaDB</p>
        <p className="mt-0.5">No cloud. No cost.</p>
      </div>
    </aside>
  );
}
