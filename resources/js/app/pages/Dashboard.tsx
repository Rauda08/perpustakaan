import { useMemo, useEffect, useState } from 'react';
import { BookOpen, Users, UserCheck, Plus, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { booksData, membersData, visitorsData, type Visitor } from '../data/mockData';
import { isThisMonth } from '../utils/dateUtils';

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDateIndonesian = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getDaysLate = (dueDate: string, todayDate: string) => {
  const today = new Date(`${todayDate}T00:00:00`);
  const due = new Date(`${dueDate}T00:00:00`);

  const diff = today.getTime() - due.getTime();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const TODAY = getTodayDate();

const loanTypes = [
  {
    type: 'Harian',
    desc: 'Kembali hari yang sama',
    color: 'bg-[#fff3cc] text-[#9d7a2f] hover:bg-[#ffe999]',
    dot: 'bg-[#f5c842]',
  },
  {
    type: 'Mingguan',
    desc: 'Durasi 7 hari, maks 2 buku',
    color: 'bg-[#e8f3ff] text-[#5a7ba0] hover:bg-[#d6ebff]',
    dot: 'bg-[#7ba7d6]',
  },
  {
    type: 'Tahunan',
    desc: 'Buku pelajaran siswa',
    color: 'bg-[#f5c842]/15 text-[#9d7a2f] hover:bg-[#f5c842]/25',
    dot: 'bg-[#e6b800]',
  },
  {
    type: 'Guru',
    desc: 'Tanpa batas waktu',
    color: 'bg-[#d4f1e3] text-[#2d8659] hover:bg-[#bce8d0]',
    dot: 'bg-[#6bbf8d]',
  },
];

export function Dashboard({ onQuickBorrow }: { onQuickBorrow: (type: string) => void }) {
  const [customVisitors, setCustomVisitors] = useState<Visitor[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('customVisitors');
    if (stored) {
      setCustomVisitors(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((result) => {
        setDashboardData(result.data);
      })
      .catch((error) => {
        console.error('Gagal mengambil data dashboard:', error);
      });
  }, []);

  const fallbackStats = useMemo(() => {
    const allVisitors = [...visitorsData, ...customVisitors];

    return {
      totalBooks: booksData.length,
      totalMembers: membersData.length,
      monthlyVisits: allVisitors.filter(v => isThisMonth(v.visitDate)).length,
    };
  }, [customVisitors]);

  const dashboardDate = dashboardData?.date ?? TODAY;
  const dashboardStats = dashboardData?.stats;

  const dueToday = dashboardData?.dueToday ?? [];
  const lateReturns = dashboardData?.lateReturnsTimeline ?? [];

  const getLoanTypeClass = (loanType: string) => {
    if (loanType === 'Harian') return 'bg-[#fff3cc] text-[#9d7a2f]';
    if (loanType === 'Mingguan') return 'bg-[#e8f3ff] text-[#5a7ba0]';
    if (loanType === 'Guru') return 'bg-[#d4f1e3] text-[#2d8659]';

    return 'bg-[#f5c842]/20 text-[#9d7a2f]';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground capitalize">
          {formatDateIndonesian(dashboardDate)}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Buku"
          value={(dashboardStats?.totalBooks ?? fallbackStats.totalBooks).toString()}
          icon={BookOpen}
          trend="Eksemplar tersedia"
          color="bg-[#7ba7d6]"
        />

        <StatCard
          title="Total Anggota"
          value={(dashboardStats?.totalMembers ?? fallbackStats.totalMembers).toString()}
          icon={Users}
          trend="Anggota terdaftar"
          color="bg-[#9bc4e8]"
        />

        <StatCard
          title="Kunjungan Bulan Ini"
          value={(dashboardStats?.visitorsThisMonth ?? fallbackStats.monthlyVisits).toString()}
          icon={UserCheck}
          trend="Pengunjung"
          color="bg-[#6bbf8d]"
        />
      </div>

      {/* Tambah Peminjaman */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            Tambah Peminjaman
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {loanTypes.map(({ type, desc, color, dot }) => (
            <button
              key={type}
              onClick={() => onQuickBorrow(type)}
              className={`flex flex-col items-start gap-2 px-4 py-4 rounded-xl font-medium transition-all border border-transparent hover:border-current/20 ${color}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="font-semibold text-sm">{type}</span>
              </div>

              <span className="text-xs opacity-70 text-left leading-snug">
                {desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Jatuh Tempo Hari Ini + Terlambat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Timeline Jatuh Tempo Hari Ini */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border h-[520px] flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#f5c842]" />
              <h3 className="font-semibold text-foreground">
                Jatuh Tempo Hari Ini
              </h3>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              dueToday.length === 0
                ? 'bg-[#d4f1e3] text-[#2d8659]'
                : 'bg-[#fff3cc] text-[#9d7a2f]'
            }`}>
              {dueToday.length} buku
            </span>
          </div>

          {dueToday.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <CheckCircle className="w-10 h-10 text-[#6bbf8d]" />
              <p className="text-sm text-muted-foreground">
                Tidak ada yang jatuh tempo hari ini
              </p>
            </div>
          ) : (
            <div className="relative flex-1 min-h-0 overflow-y-auto pr-2">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />

              <div className="space-y-4">
                {dueToday.map((b: any) => (
                  <div key={b.id} className="flex gap-4 relative">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10 mt-0.5 bg-[#fff3cc]">
                      <Clock className="w-3.5 h-3.5 text-[#9d7a2f]" />
                    </div>

                    <div className="flex-1 rounded-xl px-4 py-3 border bg-[#fffdf5] border-[#f5e199]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {b.memberName}
                          </p>

                          <p className="text-xs text-muted-foreground truncate">
                            {b.bookTitle}
                          </p>

                          <p className="text-xs font-mono text-muted-foreground mt-0.5">
                            {b.bookNumber}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#fff3cc] text-[#9d7a2f]">
                            Hari ini
                          </span>

                          {b.returnTime && (
                            <span className="text-xs text-muted-foreground">
                              s/d {b.returnTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLoanTypeClass(b.loanType)}`}>
                          {b.loanType}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          Pinjam: {b.borrowDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Terlambat */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border h-[520px] flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-foreground">
                Terlambat
              </h3>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              lateReturns.length === 0
                ? 'bg-[#d4f1e3] text-[#2d8659]'
                : 'bg-red-100 text-red-700'
            }`}>
              {lateReturns.length} buku
            </span>
          </div>

          {lateReturns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <CheckCircle className="w-10 h-10 text-[#6bbf8d]" />
              <p className="text-sm text-muted-foreground">
                Tidak ada pengembalian terlambat
              </p>
            </div>
          ) : (
            <div className="relative flex-1 min-h-0 overflow-y-auto pr-2">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-red-100" />

              <div className="space-y-4">
                {lateReturns.map((b: any) => (
                  <div key={b.id} className="flex gap-4 relative">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10 mt-0.5 bg-red-100">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    </div>

                    <div className="flex-1 rounded-xl px-4 py-3 border bg-red-50 border-red-200">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {b.memberName}
                          </p>

                          <p className="text-xs text-muted-foreground truncate">
                            {b.bookTitle}
                          </p>

                          <p className="text-xs font-mono text-muted-foreground mt-0.5">
                            {b.bookNumber}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            {b.daysLate ?? getDaysLate(b.dueDate, dashboardDate)} hari
                          </span>

                          <span className="text-xs text-muted-foreground">
                            Terlambat
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLoanTypeClass(b.loanType)}`}>
                          {b.loanType}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          Jatuh tempo: {b.dueDate}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          Pinjam: {b.borrowDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
