import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Filter, Search } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface HistoryItem {
  id: number;
  memberName: string;
  bookTitle: string;
  bookNumber: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string;
  duration: string;
  status: 'Tepat waktu' | 'Terlambat';
  loanType: string;
}

const extractArray = (payload: any): any[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.borrowings)) return data.borrowings;

  return [];
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
  const result = await response.json().catch(() => null);

  return result?.message || fallback;
};

const isThisMonth = (dateText: string) => {
  if (!dateText) return false;

  const date = new Date(`${dateText}T00:00:00`);
  const today = new Date();

  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const formatMonthLabel = (value: string) => {
  const [year, month] = value.split('-').map(Number);

  const monthNames = [
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

  return `${monthNames[month - 1]} ${year}`;
};

const calculateDuration = (borrowDateText: string, returnDateText: string) => {
  if (!borrowDateText || !returnDateText) {
    return '-';
  }

  const borrowDate = new Date(`${borrowDateText}T00:00:00`);
  const returnDate = new Date(`${returnDateText}T00:00:00`);

  if (Number.isNaN(borrowDate.getTime()) || Number.isNaN(returnDate.getTime())) {
    return '-';
  }

  const durationDays = Math.max(
    0,
    Math.ceil(
      (returnDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return `${durationDays} hari`;
};

const normalizeHistoryItem = (item: any): HistoryItem => {
  const member = item.member ?? {};
  const bookCopy = item.bookCopy ?? item.book_copy ?? {};
  const bookMaster =
    bookCopy.bookMaster ??
    bookCopy.book_master ??
    item.bookMaster ??
    item.book_master ??
    {};

  const borrowDate = item.borrowDate ?? item.borrow_date ?? '';
  const dueDate = item.dueDate ?? item.due_date ?? '';
  const returnDate = item.returnDate ?? item.return_date ?? '';
  const loanType = item.loanType ?? item.loan_type ?? '-';

  const due = dueDate ? new Date(`${dueDate}T00:00:00`) : null;
  const returned = returnDate ? new Date(`${returnDate}T00:00:00`) : null;

  // Peminjaman Guru dianggap tidak terlambat di riwayat karena sifatnya
  // "sampai dikembalikan", walaupun backend tetap menyimpan due_date teknis.
  const isLate =
    loanType !== 'Guru' &&
    !!due &&
    !!returned &&
    !Number.isNaN(due.getTime()) &&
    !Number.isNaN(returned.getTime()) &&
    returned.getTime() > due.getTime();

  return {
    id: Number(item.id),
    memberName:
      item.memberName ??
      item.member_name ??
      member.name ??
      '-',
    bookTitle:
      item.bookTitle ??
      item.book_title ??
      bookCopy.title ??
      bookCopy.bookTitle ??
      bookCopy.book_title ??
      bookMaster.title ??
      '-',
    bookNumber:
      item.bookNumber ??
      item.book_number ??
      bookCopy.number ??
      '-',
    borrowDate,
    dueDate,
    returnDate,
    duration: calculateDuration(borrowDate, returnDate),
    status: isLate ? 'Terlambat' : 'Tepat waktu',
    loanType,
  };
};

export function History() {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [loanTypeFilter, setLoanTypeFilter] = useState('Semua');
  const [filterMonth, setFilterMonth] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadHistory = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/borrowings/history', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Gagal memuat riwayat peminjaman.')
        );
      }

      const result = await response.json();
      const items = extractArray(result)
        .map(normalizeHistoryItem)
        .filter((item) => item.returnDate);

      setHistoryData(items);
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal memuat riwayat peminjaman.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const monthOptions = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(
        historyData
          .filter((item) => item.returnDate)
          .map((item) => {
            const date = new Date(`${item.returnDate}T00:00:00`);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            return `${year}-${month}`;
          })
      )
    );

    return uniqueMonths.sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);

      return (
        new Date(yearB, monthB - 1).getTime() -
        new Date(yearA, monthA - 1).getTime()
      );
    });
  }, [historyData]);

  const statistics = useMemo(() => {
    const monthlyTransactions = historyData.filter((item) =>
      isThisMonth(item.returnDate)
    );

    const onTimeThisMonth = monthlyTransactions.filter(
      (item) => item.status === 'Tepat waktu'
    );

    const lateThisMonth = monthlyTransactions.filter(
      (item) => item.status === 'Terlambat'
    );

    return {
      monthly: monthlyTransactions.length,
      onTime: onTimeThisMonth.length,
      late: lateThisMonth.length,
    };
  }, [historyData]);

  const filteredHistory = useMemo(() => {
    return historyData
      .filter((item) => {
        const keyword = searchTerm.toLowerCase();

        const matchesSearch =
          item.memberName.toLowerCase().includes(keyword) ||
          item.bookTitle.toLowerCase().includes(keyword) ||
          item.bookNumber.toLowerCase().includes(keyword);

        const matchesFilter =
          filterStatus === 'Semua' || item.status === filterStatus;

        const matchesLoanType =
          loanTypeFilter === 'Semua' || item.loanType === loanTypeFilter;

        let matchesMonth = true;

        if (filterMonth !== 'Semua') {
          const returnDate = new Date(`${item.returnDate}T00:00:00`);
          const month = returnDate.getMonth() + 1;
          const year = returnDate.getFullYear();
          const [filterYear, filterMonthNum] = filterMonth
            .split('-')
            .map(Number);

          matchesMonth = year === filterYear && month === filterMonthNum;
        }

        return matchesSearch && matchesFilter && matchesLoanType && matchesMonth;
      })
      .sort((a, b) => {
        if (a.status === 'Terlambat' && b.status !== 'Terlambat') return -1;
        if (a.status !== 'Terlambat' && b.status === 'Terlambat') return 1;

        return (
          new Date(`${b.returnDate}T00:00:00`).getTime() -
          new Date(`${a.returnDate}T00:00:00`).getTime()
        );
      });
  }, [historyData, searchTerm, filterStatus, loanTypeFilter, filterMonth]);

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

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
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

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground mb-1">Bulan Ini</p>
          <p className="text-3xl font-semibold text-foreground">
            {statistics.monthly}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Transaksi kembali bulan ini
          </p>
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

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border">
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari berdasarkan nama anggota, judul buku, atau nomor buku..."
              className="w-full pl-11 pr-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={filterMonth}
              onChange={(event) => setFilterMonth(event.target.value)}
              className="px-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium flex-1"
            >
              <option value="Semua">Semua Bulan</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="w-full pl-11 pr-8 py-3 bg-accent/50 border border-border rounded-lg hover:bg-accent transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Semua">Semua</option>
                <option value="Tepat waktu">Tepat waktu</option>
                <option value="Terlambat">Terlambat</option>
              </select>
            </div>

            <select
              value={loanTypeFilter}
              onChange={(event) => setLoanTypeFilter(event.target.value)}
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
          <table className="w-full min-w-[900px]">
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
              {paginatedHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {isLoading
                      ? 'Memuat data riwayat...'
                      : searchTerm ||
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
                    <div>
                      <p>{item.bookTitle}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.bookNumber}
                      </p>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.loanType === 'Harian'
                          ? 'bg-[#fff3cc] text-[#9d7a2f]'
                          : item.loanType === 'Mingguan'
                          ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                          : item.loanType === 'Tahunan'
                          ? 'bg-[#f5c842]/20 text-[#9d7a2f]'
                          : 'bg-[#d4f1e3] text-[#2d8659]'
                      }`}
                    >
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
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'Tepat waktu'
                          ? 'bg-[#d4f1e3] text-[#2d8659]'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
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
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
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

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
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
                )
              )}

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
