import {
  LayoutDashboard,
  BookOpen,
  Users,
  BookCopy,
  History,
  ClipboardList,
  BarChart3,
  LogOut,
} from 'lucide-react';
import logoImage from '../../imports/logoperpus.png';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'books', icon: BookOpen, label: 'Data Buku' },
    { id: 'members', icon: Users, label: 'Data Anggota' },
    { id: 'transactions', icon: BookCopy, label: 'Peminjaman' },
    { id: 'history', icon: History, label: 'Riwayat' },
    { id: 'visitors', icon: ClipboardList, label: 'Kunjungan' },
    { id: 'reports', icon: BarChart3, label: 'Laporan' },
  ];

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-border h-screen flex-col shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
              <img
                src={logoImage}
                alt="Logo SMAN Bernas"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-sm leading-tight">
                Perpustakaan Betuah
              </h2>
              <p className="text-xs text-primary font-medium">
                SMAN Bernas Binsus
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img
                src={logoImage}
                alt="Logo SMAN Bernas"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold text-foreground text-sm leading-tight truncate">
                Perpustakaan Betuah
              </h2>
              <p className="text-xs text-primary font-medium truncate">
                SMAN Bernas Binsus
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-medium">Keluar</span>
          </button>
        </div>
      </header>

      {/* Bottom Navigation Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center overflow-x-auto px-2 py-2 gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`min-w-[78px] flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
