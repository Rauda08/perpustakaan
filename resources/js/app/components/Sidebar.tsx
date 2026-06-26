import {
  LayoutDashboard,
  BookOpen,
  Users,
  BookCopy,
  BookCheck,
  History,
  ClipboardList,
  BarChart3,
  LogOut
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
    <div className="w-64 bg-white border-r border-border h-screen flex flex-col shadow-sm">
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
            <h2 className="font-semibold text-foreground text-sm leading-tight">Sistem Perpustakaan</h2>
            <p className="text-xs text-primary font-medium">SMAN Bernas Binsus</p>
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
    </div>
  );
}
