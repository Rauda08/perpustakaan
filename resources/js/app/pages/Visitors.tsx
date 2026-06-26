import { useState, useMemo, useEffect } from 'react';
import { Search, UserCheck, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { visitorsData as allVisitorsData, type Visitor } from '../data/mockData';
import { isThisMonth } from '../utils/dateUtils';

const ITEMS_PER_PAGE = 10;

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const TODAY = getTodayDate();

export function Visitors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [customVisitors, setCustomVisitors] = useState<Visitor[]>([]);
  const [apiVisitors, setApiVisitors] = useState<Visitor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem('customVisitors');

    if (stored) {
      setCustomVisitors(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    fetch('/api/visitors')
      .then((res) => res.json())
      .then((result) => {
        const data = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.items)
          ? result.data.items
          : Array.isArray(result.data?.visitors)
          ? result.data.visitors
          : [];

        setApiVisitors(data);
      })
      .catch((error) => {
        console.error('Gagal mengambil data kunjungan:', error);
        setApiVisitors([]);
      });
  }, []);

  const combinedVisitorsData = useMemo(() => {
    if (apiVisitors.length > 0) {
      return apiVisitors;
    }

    return [...allVisitorsData, ...customVisitors];
  }, [apiVisitors, customVisitors]);

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);

    const days = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];

    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const statistics = useMemo(() => {
    const todayVisits = combinedVisitorsData.filter((visitor) => {
      return visitor.visitDate === TODAY;
    });

    const monthlyVisits = combinedVisitorsData.filter((visitor) => {
      return isThisMonth(visitor.visitDate);
    });

    const daysInMonth = new Date(`${TODAY}T00:00:00`).getDate();
    const averagePerDay = Math.round(monthlyVisits.length / daysInMonth);

    return {
      today: todayVisits.length,
      monthly: monthlyVisits.length,
      average: averagePerDay,
    };
  }, [combinedVisitorsData]);

  const filteredVisitors = useMemo(() => {
    return combinedVisitorsData
      .filter((visitor) => {
        const matchesSearch =
          visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          visitor.classNip.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate = visitor.visitDate === selectedDate;

        return matchesSearch && matchesDate;
      })
      .sort((a, b) => {
        return (a.visitTime || '').localeCompare(b.visitTime || '');
      });
  }, [combinedVisitorsData, searchTerm, selectedDate]);

  const totalPages = Math.ceil(filteredVisitors.length / ITEMS_PER_PAGE);

  const paginatedVisitors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredVisitors.slice(startIndex, endIndex);
  }, [filteredVisitors, currentPage]);

  const startItem =
    filteredVisitors.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredVisitors.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate]);

  const goToPreviousDay = () => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() - 1);

    setSelectedDate(formatInputDate(date));
  };

  const goToNextDay = () => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + 1);

    const nextDate = formatInputDate(date);

    if (nextDate <= TODAY) {
      setSelectedDate(nextDate);
    }
  };

  const goToToday = () => {
    setSelectedDate(TODAY);
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  const isToday = selectedDate === TODAY;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Data Kunjungan
        </h1>
        <p className="text-muted-foreground">
          Monitoring kunjungan perpustakaan bulan ini
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Kunjungan Hari Ini</span>
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-semibold text-foreground">
            {statistics.today}
          </p>
          <p className="text-sm text-[#6bbf8d] mt-1">
            {formatDate(TODAY)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Bulan Ini</span>
            <UserCheck className="w-5 h-5 text-[#9bc4e8]" />
          </div>
          <p className="text-3xl font-semibold text-foreground">
            {statistics.monthly}
          </p>
          <p className="text-sm text-[#6bbf8d] mt-1">Bulan ini</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Rata-rata per Hari</span>
            <Clock className="w-5 h-5 text-[#f5c842]" />
          </div>
          <p className="text-3xl font-semibold text-foreground">
            {statistics.average}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Bulan ini</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h3 className="font-semibold text-foreground">Daftar Kunjungan</h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-accent/50 rounded-lg">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">
                {formatDate(selectedDate)}
              </span>
            </div>

            <button
              onClick={goToNextDay}
              disabled={isToday}
              className={`p-2 rounded-lg transition-colors ${
                isToday
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-accent'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {!isToday && (
              <button
                onClick={goToToday}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
              >
                Hari Ini
              </button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari pengunjung berdasarkan nama atau NIS/NIP..."
              className="w-full pl-11 pr-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  No
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Nama
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  NIS / NIP
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Jenis
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Tujuan
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Waktu
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Tanggal
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredVisitors.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    {searchTerm
                      ? 'Tidak ada hasil pencarian'
                      : `Tidak ada kunjungan pada ${formatDate(selectedDate)}`}
                  </td>
                </tr>
              )}

              {paginatedVisitors.map((visitor, index) => (
                <tr
                  key={visitor.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="py-4 px-4 text-muted-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>

                  <td className="py-4 px-4">
                    <span className="font-medium text-foreground">
                      {visitor.name}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-muted-foreground font-mono text-sm">
                    {visitor.classNip}
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      visitor.type === 'Guru'
                        ? 'bg-[#fff3cc] text-[#9d7a2f]'
                        : 'bg-[#e8f3ff] text-[#5a7ba0]'
                    }`}>
                      {visitor.type}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {visitor.purpose}
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {visitor.visitTime}
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {visitor.visitDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
          <p>
            {filteredVisitors.length === 0
              ? 'Menampilkan 0 kunjungan'
              : `Menampilkan ${startItem}-${endItem} dari ${filteredVisitors.length} kunjungan`}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 border border-border rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-accent'
                }`}
              >
                Sebelumnya
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 border border-border rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-accent'
                }`}
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
