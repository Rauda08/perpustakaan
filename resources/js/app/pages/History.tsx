import { useState, useMemo, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { borrowingData } from '../data/mockData';
import { isThisMonth } from '../utils/dateUtils';

const ITEMS_PER_PAGE = 10;

// Gunakan data dari mockData yang sudah dikembalikan
const historyData = borrowingData
  .filter(b => b.status === 'Dikembalikan' && b.returnDate)
  .map((b) => {
    const borrowDate = new Date(b.borrowDate);
    const returnDate = new Date(b.returnDate!);
    const dueDate = new Date(b.dueDate);

    const durationDays = Math.ceil(
      (returnDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isLate = returnDate > dueDate;

    return {
      id: b.id,
      memberName: b.memberName,
      bookTitle: b.bookTitle,
      borrowDate: b.borrowDate,
      returnDate: b.returnDate!,
      duration: `${durationDays} hari`,
      status: isLate ? 'Terlambat' : 'Tepat waktu',
      loanType: b.loanType,
    };
  });

export function History() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [loanTypeFilter, setLoanTypeFilter] = useState('Semua');
  const [filterMonth, setFilterMonth] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);

  const statistics = useMemo(() => {
    const monthlyTransactions = historyData.filter(item =>
      isThisMonth(item.returnDate)
    );

    const onTimeThisMonth = monthlyTransactions.filter(item =>
      item.status === 'Tepat waktu'
    );

    const lateThisMonth = monthlyTransactions.filter(item =>
      item.status === 'Terlambat'
    );

    return {
      monthly: monthlyTransactions.length,
      onTime: onTimeThisMonth.length,
      late: lateThisMonth.length,
    };
  }, []);

  const filteredHistory = useMemo(() => {
    return historyData
      .filter(item => {
        const matchesSearch =
          item.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.bookTitle.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
          filterStatus === 'Semua' || item.status === filterStatus;

        const matchesLoanType =
          loanTypeFilter === 'Semua' || item.loanType === loanTypeFilter;

        let matchesMonth = true;

        if (filterMonth !== 'Semua') {
          const returnDate = new Date(item.returnDate);
          const month = returnDate.getMonth() + 1;
          const year = returnDate.getFullYear();
          const [filterYear, filterMonthNum] = filterMonth.split('-').map(Number);

          matchesMonth = year === filterYear && month === filterMonthNum;
        }

        return matchesSearch && matchesFilter && matchesLoanType && matchesMonth;
      })
      .sort((a, b) => {
        if (a.status === 'Terlambat' && b.status !== 'Terlambat') return -1;
        if (a.status !== 'Terlambat' && b.status === 'Terlambat') return 1;

        return new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime();
      });
  }, [searchTerm, filterStatus, loanTypeFilter, filterMonth]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, currentPage]);

  const startItem =
    filteredHistory.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, loanTypeFilter, filterMonth]);

  const goToPreviousPage = () => {
    setCurrentPage(page => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(page => Math.min(page + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Riwayat Peminjaman
        </h1>
        <p className="text-muted-foreground">
          Data riwayat peminjaman dan pengembalian buku bulan ini
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground mb-1">Bulan Ini</p>
          <p className="text-3xl font-semibold text-foreground">
            {statistics.monthly}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground mb-1">Tepat Waktu</p>
          <p className="text-3xl font-semibold text-[#6bbf8d]">
            {statistics.onTime}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground mb-1">Terlambat</p>
          <p className="text-3xl font-semibold text-red-600">
            {statistics.late}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama anggota atau judul buku..."
              className="w-full pl-11 pr-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium flex-1"
            >
              <option value="Semua">Semua Bulan</option>
              <option value="2026-6">Juni 2026</option>
              <option value="2026-5">Mei 2026</option>
              <option value="2026-4">April 2026</option>
              <option value="2026-3">Maret 2026</option>
              <option value="2026-2">Februari 2026</option>
              <option value="2026-1">Januari 2026</option>
              <option value="2025-12">Desember 2025</option>
              <option value="2025-11">November 2025</option>
              <option value="2025-10">Oktober 2025</option>
            </select>

            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-11 pr-8 py-3 bg-accent/50 border border-border rounded-lg hover:bg-accent transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>Semua</option>
                <option>Tepat waktu</option>
                <option>Terlambat</option>
              </select>
            </div>

            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              className="px-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium flex-1"
            >
              <option value="Semua">Semua Jenis</option>
              <option value="Harian">Harian</option>
              <option value="Mingguan">Mingguan</option>
              <option value="Tahunan">Tahunan</option>
              <option value="Guru">Guru</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Nama Anggota
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Judul Buku
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Jenis Peminjaman
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Tanggal Pinjam
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Tanggal Kembali
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Durasi
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    {searchTerm ||
                    filterStatus !== 'Semua' ||
                    loanTypeFilter !== 'Semua' ||
                    filterMonth !== 'Semua'
                      ? 'Tidak ada hasil yang sesuai dengan filter'
                      : 'Belum ada riwayat peminjaman'}
                  </td>
                </tr>
              )}

              {paginatedHistory.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="font-medium text-foreground">
                      {item.memberName}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-foreground">
                    {item.bookTitle}
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.loanType === 'Harian'
                        ? 'bg-[#fff3cc] text-[#9d7a2f]'
                        : item.loanType === 'Mingguan'
                        ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                        : item.loanType === 'Tahunan'
                        ? 'bg-[#f5c842]/20 text-[#9d7a2f]'
                        : 'bg-[#d4f1e3] text-[#2d8659]'
                    }`}>
                      {item.loanType}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {item.borrowDate}
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {item.returnDate}
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {item.duration}
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'Tepat waktu'
                        ? 'bg-[#d4f1e3] text-[#2d8659]'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
          <p>
            {filteredHistory.length === 0
              ? 'Menampilkan 0 dari 0 transaksi'
              : `Menampilkan ${startItem}-${endItem} dari ${filteredHistory.length} transaksi`}
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
