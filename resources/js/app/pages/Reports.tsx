import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  TrendingUp,
  Calendar,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Modal } from '../components/Modal';
import { SuccessModal } from '../components/SuccessModal';
import logoPelalawan from '../../imports/image-3.png';
import logoRiau from '../../imports/logoperpus.png';

interface ReportsProps {
  penaltyRecords?: Penalty[];
}

interface Borrowing {
  id: number;
  memberId?: number;
  memberName: string;
  bookTitle: string;
  bookNumber: string;
  borrowDate: string;
  dueDate?: string;
  returnDate?: string;
  status: string;
  loanType?: string;
}

interface Visitor {
  id: number;
  visitDate: string;
  name?: string;
  type?: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  number: string;
  shelf: string;
  status: string;
}

interface Member {
  id: number;
  name: string;
  type: string;
}

interface Penalty {
  id: number;
  borrowingId?: number;
  memberId: number;
  memberName: string;
  bookNumber: string;
  bookTitle: string;
  loanType?: string;
  date: string;
  reason: string;
  penaltyType: string;
  penaltyBookTitle: string;
  notes?: string;
}

const COLORS = ['#7ba7d6', '#9bc4e8', '#f5c842', '#6bbf8d', '#ffd24d'];
const PENALTY_ITEMS_PER_PAGE = 10;

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

const shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const extractArray = (payload: any): any[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.borrowings)) return data.borrowings;
  if (Array.isArray(data?.visitors)) return data.visitors;
  if (Array.isArray(data?.books)) return data.books;
  if (Array.isArray(data?.bookCopies)) return data.bookCopies;
  if (Array.isArray(data?.book_copies)) return data.book_copies;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.penalties)) return data.penalties;

  return [];
};

const fetchApiArray = async (urls: string[]) => {
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        continue;
      }

      const result = await response.json();
      const data = extractArray(result);

      if (Array.isArray(data)) {
        return data;
      }
    } catch {
      continue;
    }
  }

  return [];
};

const normalizeBorrowing = (item: any): Borrowing => ({
  id: Number(item.id),
  memberId: item.memberId ?? item.member_id ?? item.member?.id,
  memberName:
    item.memberName ??
    item.member_name ??
    item.member?.name ??
    '-',
  bookTitle:
    item.bookTitle ??
    item.book_title ??
    item.bookCopy?.bookMaster?.title ??
    item.book_copy?.book_master?.title ??
    item.bookCopy?.title ??
    item.book_copy?.title ??
    '-',
  bookNumber:
    item.bookNumber ??
    item.book_number ??
    item.bookCopy?.number ??
    item.book_copy?.number ??
    '-',
  borrowDate: item.borrowDate ?? item.borrow_date ?? '',
  dueDate: item.dueDate ?? item.due_date ?? '',
  returnDate: item.returnDate ?? item.return_date ?? '',
  status: item.status ?? 'Aktif',
  loanType: item.loanType ?? item.loan_type ?? '',
});

const normalizeVisitor = (item: any): Visitor => ({
  id: Number(item.id),
  name: item.name ?? item.member?.name ?? '',
  type: item.type ?? '',
  visitDate: item.visitDate ?? item.visit_date ?? '',
});

const normalizeBook = (item: any): Book => {
  const bookMaster =
    item.bookMaster ??
    item.book_master ??
    item.master ??
    item.book ??
    null;

  return {
    id: Number(item.id),
    number: item.number ?? item.book_number ?? item.code ?? '-',
    title:
      item.title ??
      item.bookTitle ??
      item.book_title ??
      bookMaster?.title ??
      '-',
    author:
      item.author ??
      item.bookAuthor ??
      item.book_author ??
      bookMaster?.author ??
      '-',
    category:
      item.category ??
      item.bookCategory ??
      item.book_category ??
      bookMaster?.category ??
      '-',
    shelf:
      item.shelf ??
      item.rack ??
      item.location ??
      bookMaster?.shelf ??
      bookMaster?.rack ??
      '-',
    status: item.status ?? 'Tersedia',
  };
};

const normalizeBooks = (items: any[]): Book[] => {
  const books: Book[] = [];

  items.forEach((item) => {
    const copies =
      item.copies ??
      item.bookCopies ??
      item.book_copies ??
      null;

    if (Array.isArray(copies)) {
      copies.forEach((copy: any) => {
        books.push({
          id: Number(copy.id),
          number: copy.number ?? copy.book_number ?? copy.code ?? '-',
          title:
            item.title ??
            copy.title ??
            copy.bookMaster?.title ??
            copy.book_master?.title ??
            '-',
          author:
            item.author ??
            copy.author ??
            copy.bookMaster?.author ??
            copy.book_master?.author ??
            '-',
          category:
            item.category ??
            copy.category ??
            copy.bookMaster?.category ??
            copy.book_master?.category ??
            '-',
          shelf:
            item.shelf ??
            copy.shelf ??
            copy.rack ??
            copy.bookMaster?.shelf ??
            copy.book_master?.shelf ??
            '-',
          status: copy.status ?? 'Tersedia',
        });
      });
    } else {
      books.push(normalizeBook(item));
    }
  });

  return books.filter((book) => book.title !== '-');
};

const normalizeMember = (item: any): Member => ({
  id: Number(item.id),
  name: item.name ?? item.memberName ?? item.member_name ?? '-',
  type: item.type ?? item.memberType ?? item.member_type ?? 'Siswa',
});

const normalizePenalty = (item: any): Penalty => ({
  id: Number(item.id),
  borrowingId: item.borrowingId ?? item.borrowing_id,
  memberId: Number(item.memberId ?? item.member_id ?? item.member?.id ?? 0),
  memberName:
    item.memberName ??
    item.member_name ??
    item.member?.name ??
    '-',
  bookNumber:
    item.bookNumber ??
    item.book_number ??
    item.bookCopy?.number ??
    item.book_copy?.number ??
    '-',
  bookTitle:
    item.bookTitle ??
    item.book_title ??
    item.bookCopy?.bookMaster?.title ??
    item.book_copy?.book_master?.title ??
    '-',
  loanType: item.loanType ?? item.loan_type ?? '',
  date: item.date ?? item.penaltyDate ?? item.penalty_date ?? '',
  reason: item.reason ?? '-',
  penaltyType:
    item.penaltyType ??
    item.penalty_type ??
    '-',
  penaltyBookTitle:
    item.penaltyBookTitle ??
    item.penalty_book_title ??
    '-',
  notes:
    item.notes ??
    item.note ??
    item.catatan ??
    item.description ??
    '-',

});

const parseDate = (dateText?: string) => {
  if (!dateText) return null;

  const date = new Date(`${dateText}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatDate = (dateText?: string) => {
  const date = parseDate(dateText);

  if (!date) return dateText || '-';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isInPeriod = (dateText: string | undefined, month: number, year: number) => {
  const date = parseDate(dateText);

  if (!date) return false;

  return date.getMonth() === month && date.getFullYear() === year;
};

const getLastDateOfMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0);
};

const getPeriodEndDate = (month: number, year: number) => {
  const now = new Date();

  if (month === now.getMonth() && year === now.getFullYear()) {
    return now;
  }

  return getLastDateOfMonth(month, year);
};

export function Reports({ penaltyRecords = [] }: ReportsProps) {
  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [draftMonth, setDraftMonth] = useState(currentDate.getMonth());
  const [draftYear, setDraftYear] = useState(currentDate.getFullYear());

  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodError, setPeriodError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>(penaltyRecords);

  const [loading, setLoading] = useState(false);
  const [penaltyPage, setPenaltyPage] = useState(1);

  const years = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => currentDate.getFullYear() - index);
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);

    try {
      const [
        borrowingResponse,
        visitorResponse,
        bookResponse,
        memberResponse,
        penaltyResponse,
      ] = await Promise.all([
        fetchApiArray(['/api/borrowings']),
        fetchApiArray(['/api/visitors']),
        fetchApiArray(['/api/book-copies', '/api/books']),
        fetchApiArray(['/api/members']),
        fetchApiArray(['/api/penalties']),
      ]);

      setBorrowings(borrowingResponse.map(normalizeBorrowing));
      setVisitors(visitorResponse.map(normalizeVisitor));
      setBooks(normalizeBooks(bookResponse));
      setMembers(memberResponse.map(normalizeMember));

      if (penaltyResponse.length > 0) {
        setPenalties(penaltyResponse.map(normalizePenalty));
      } else {
        setPenalties(penaltyRecords.map(normalizePenalty));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (penaltyRecords.length > 0 && penalties.length === 0) {
      setPenalties(penaltyRecords.map(normalizePenalty));
    }
  }, [penaltyRecords]);

  const monthlyBorrowings = useMemo(() => {
    return borrowings.filter((borrowing) =>
      isInPeriod(borrowing.borrowDate, selectedMonth, selectedYear)
    );
  }, [borrowings, selectedMonth, selectedYear]);

  const monthlyVisitors = useMemo(() => {
    return visitors.filter((visitor) =>
      isInPeriod(visitor.visitDate, selectedMonth, selectedYear)
    );
  }, [visitors, selectedMonth, selectedYear]);

  const monthlyPenalties = useMemo(() => {
    return penalties.filter((penalty) =>
      isInPeriod(penalty.date, selectedMonth, selectedYear)
    );
  }, [penalties, selectedMonth, selectedYear]);

  const activeBorrowings = useMemo(() => {
    return borrowings.filter(
      (borrowing) => borrowing.status === 'Aktif' || borrowing.status === 'Terlambat'
    );
  }, [borrowings]);

  const monthlyLatePenalties = useMemo(() => {
    return monthlyPenalties.filter((penalty) => penalty.reason === 'Terlambat');
  }, [monthlyPenalties]);

  const borrowingChartData = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(selectedYear, selectedMonth - (4 - index), 1);
      const month = date.getMonth();
      const year = date.getFullYear();

      const count = borrowings.filter((borrowing) =>
        isInPeriod(borrowing.borrowDate, month, year)
      ).length;

      return {
        id: `borrow-${year}-${month}`,
        month: `${shortMonths[month]} ${String(year).slice(-2)}`,
        peminjaman: count,
      };
    });
  }, [borrowings, selectedMonth, selectedYear]);

  const visitChartData = useMemo(() => {
    const endDate = getPeriodEndDate(selectedMonth, selectedYear);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - (6 - index));

      const dateString = date.toISOString().split('T')[0];

      return {
        id: `visit-${dateString}`,
        day: dayNames[date.getDay()],
        tanggal: formatDate(dateString),
        kunjungan: visitors.filter((visitor) => visitor.visitDate === dateString).length,
      };
    });
  }, [visitors, selectedMonth, selectedYear]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();

    books.forEach((book) => {
      map.set(book.category || 'Lainnya', (map.get(book.category || 'Lainnya') || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [books]);

  const popularBooks = useMemo(() => {
    const map = new Map<string, { title: string; author: string; count: number }>();

    monthlyBorrowings.forEach((borrowing) => {
      const key = borrowing.bookTitle;

      if (map.has(key)) {
        map.get(key)!.count += 1;
      } else {
        const book = books.find((bookItem) => bookItem.title === borrowing.bookTitle);

        map.set(key, {
          title: borrowing.bookTitle,
          author: book?.author || '-',
          count: 1,
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [monthlyBorrowings, books]);

  const totalPenaltyPages = Math.ceil(monthlyPenalties.length / PENALTY_ITEMS_PER_PAGE);

  const paginatedPenalties = monthlyPenalties.slice(
    (penaltyPage - 1) * PENALTY_ITEMS_PER_PAGE,
    penaltyPage * PENALTY_ITEMS_PER_PAGE
  );

  const penaltyStartItem =
    monthlyPenalties.length === 0
      ? 0
      : (penaltyPage - 1) * PENALTY_ITEMS_PER_PAGE + 1;

  const penaltyEndItem = Math.min(
    penaltyPage * PENALTY_ITEMS_PER_PAGE,
    monthlyPenalties.length
  );

  useEffect(() => {
    setPenaltyPage(1);
  }, [selectedMonth, selectedYear, monthlyPenalties.length]);

  useEffect(() => {
    if (totalPenaltyPages > 0 && penaltyPage > totalPenaltyPages) {
      setPenaltyPage(totalPenaltyPages);
    }

    if (totalPenaltyPages === 0 && penaltyPage !== 1) {
      setPenaltyPage(1);
    }
  }, [totalPenaltyPages, penaltyPage]);

  const isFuturePeriod = (month: number, year: number) => {
    if (year > currentDate.getFullYear()) {
      return true;
    }

    if (year === currentDate.getFullYear() && month > currentDate.getMonth()) {
      return true;
    }

    return false;
  };

  const handleOpenPeriodModal = () => {
    setDraftMonth(selectedMonth);
    setDraftYear(selectedYear);
    setPeriodError('');
    setShowPeriodModal(true);
  };

  const handleApplyPeriod = () => {
    if (isFuturePeriod(draftMonth, draftYear)) {
      setPeriodError('Periode laporan tidak boleh melebihi bulan berjalan.');
      return;
    }

    setSelectedMonth(draftMonth);
    setSelectedYear(draftYear);
    setShowPeriodModal(false);
    setPeriodError('');
    setSuccessMsg(`Laporan diperbarui untuk ${months[draftMonth]} ${draftYear}`);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const goToPreviousPenaltyPage = () => {
    setPenaltyPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPenaltyPage = () => {
    setPenaltyPage((page) => Math.min(page + 1, totalPenaltyPages));
  };

  return (
    <div className="space-y-6" id="report-content">
      <div className="hidden print:block mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="w-20 h-24 flex items-center justify-center">
            <img
              src={logoPelalawan}
              alt="Logo Kabupaten Pelalawan"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 text-center px-4">
            <h1 className="text-base font-semibold text-gray-700 mb-0.5">
              PEMERINTAH PROVINSI RIAU
            </h1>
            <h2 className="text-base font-semibold text-gray-700 mb-0.5">
              DINAS PENDIDIKAN
            </h2>
            <h3 className="text-lg font-bold text-gray-900 mb-0.5">
              PERPUSTAKAAN BETUAH SMA NEGERI BERNAS
            </h3>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              KABUPATEN PELALAWAN PROVINSI RIAU
            </p>
            <p className="text-xs text-gray-600">
              Alamat: Jl. H. Abdul Jalil Pangkalan Kerinci, Telp. 0813-5065-4210, KodePos 28300
            </p>
            <p className="text-xs text-gray-600">
              NPP 1404011E0100002 email: smanbernas1@gmail.com
            </p>
          </div>

          <div className="w-20 h-24 flex items-center justify-center">
            <img
              src={logoRiau}
              alt="Logo Provinsi Riau"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="border-t-4 border-black mb-0.5" />
        <div className="border-t border-black mb-6" />

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground mb-2">
            LAPORAN PERPUSTAKAAN
          </h1>
          <p className="text-base font-semibold text-muted-foreground">
            Periode: {months[selectedMonth]} {selectedYear}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Tanggal Cetak:{' '}
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Laporan
          </h1>
          <p className="text-muted-foreground">
            Laporan statistik perpustakaan - {months[selectedMonth]} {selectedYear}
          </p>
        </div>

        <div className="flex gap-3 print:hidden">
          <button
            onClick={handleOpenPeriodModal}
            className="flex items-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Pilih Periode</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Printer className="w-5 h-5" />
            Export PDF
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border print:hidden text-sm text-muted-foreground">
          Memuat data laporan dari database...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Peminjaman</span>
            <FileText className="w-5 h-5 text-[#7ba7d6]" />
          </div>
          <p className="text-3xl font-semibold text-foreground mb-1">
            {monthlyBorrowings.length}
          </p>
          <p className="text-sm text-muted-foreground">transaksi periode ini</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Sanksi</span>
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-semibold text-foreground mb-1">
            {monthlyPenalties.length}
          </p>
          <p className="text-sm text-muted-foreground">kasus periode ini</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Kunjungan Periode Ini
            </span>
            <TrendingUp className="w-5 h-5 text-[#f5c842]" />
          </div>
          <p className="text-3xl font-semibold text-foreground mb-1">
            {monthlyVisitors.length}
          </p>
          <p className="text-sm text-muted-foreground">kunjungan</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Koleksi</span>
            <FileText className="w-5 h-5 text-[#6bbf8d]" />
          </div>
          <p className="text-3xl font-semibold text-foreground mb-1">
            {books.length}
          </p>
          <p className="text-sm text-muted-foreground">eksemplar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-1">
              Tren Peminjaman
            </h3>
            <p className="text-sm text-muted-foreground">
              5 bulan terakhir sampai periode dipilih
            </p>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={borrowingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6e8f7" />
              <XAxis dataKey="month" stroke="#5a7ba0" />
              <YAxis stroke="#5a7ba0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d6e8f7',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="peminjaman"
                fill="#7ba7d6"
                radius={[6, 6, 0, 0]}
                name="Peminjaman"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-1">
              Kunjungan 7 Hari Terakhir
            </h3>
            <p className="text-sm text-muted-foreground">
              Sampai akhir periode yang dipilih
            </p>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={visitChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6e8f7" />
              <XAxis dataKey="day" stroke="#5a7ba0" />
              <YAxis stroke="#5a7ba0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #d6e8f7',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="kunjungan"
                stroke="#f5c842"
                strokeWidth={3}
                dot={{ fill: '#f5c842', r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-1">
              Distribusi Koleksi per Kategori
            </h3>
            <p className="text-sm text-muted-foreground">
              Jumlah eksemplar per kategori
            </p>
          </div>

          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground">
              Belum ada data koleksi
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="mb-6">
            <h3 className="font-semibold text-foreground mb-1">
              Buku Paling Populer
            </h3>
            <p className="text-sm text-muted-foreground">
              Berdasarkan peminjaman pada periode dipilih
            </p>
          </div>

          <div className="space-y-3">
            {popularBooks.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                Belum ada peminjaman pada periode ini
              </div>
            ) : (
              popularBooks.slice(0, 5).map((book, index) => (
                <div key={book.title} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {book.author}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold flex-shrink-0">
                    {book.count}x
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="hidden print:block">
        <div className="mb-6">
          <p
            className="text-sm leading-relaxed text-justify mb-4"
            style={{ textIndent: '2.5rem' }}
          >
            Berdasarkan data perpustakaan SMA Negeri Bernas untuk periode{' '}
            {months[selectedMonth]} {selectedYear}, berikut kami laporkan
            rekapitulasi kegiatan perpustakaan sebagai berikut:
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm">A. STATISTIK PERPUSTAKAAN</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="border border-black">
                <th className="border border-black py-2 px-3 text-center">No</th>
                <th className="border border-black py-2 px-3 text-left">
                  Keterangan
                </th>
                <th className="border border-black py-2 px-3 text-center">
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: 'Total Transaksi Peminjaman Periode Ini',
                  value: `${monthlyBorrowings.length} transaksi`,
                },
                {
                  label: 'Buku Belum Dikembalikan',
                  value: `${activeBorrowings.length} buku`,
                },
                {
                  label: 'Total Keterlambatan Periode Ini',
                  value: `${monthlyLatePenalties.length} kasus`,
                },
                {
                  label: 'Total Sanksi Periode Ini',
                  value: `${monthlyPenalties.length} kasus`,
                },
                {
                  label: 'Total Kunjungan Periode Ini',
                  value: `${monthlyVisitors.length} kunjungan`,
                },
                {
                  label: 'Total Anggota Terdaftar',
                  value: `${members.length} anggota`,
                },
                {
                  label: 'Total Koleksi Buku',
                  value: `${books.length} eksemplar`,
                },
              ].map((row, index) => (
                <tr key={row.label} className="border border-black">
                  <td className="border border-black py-2 px-3 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-black py-2 px-3">{row.label}</td>
                  <td className="border border-black py-2 px-3 text-center">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm">
            B. DISTRIBUSI KOLEKSI PER KATEGORI
          </h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="border border-black">
                <th className="border border-black py-2 px-3 text-center">No</th>
                <th className="border border-black py-2 px-3 text-left">
                  Kategori
                </th>
                <th className="border border-black py-2 px-3 text-center">
                  Jumlah Eksemplar
                </th>
                <th className="border border-black py-2 px-3 text-center">
                  Persentase
                </th>
              </tr>
            </thead>
            <tbody>
              {categoryData.map((category, index) => (
                <tr key={category.name} className="border border-black">
                  <td className="border border-black py-2 px-3 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-black py-2 px-3">
                    {category.name}
                  </td>
                  <td className="border border-black py-2 px-3 text-center">
                    {category.value}
                  </td>
                  <td className="border border-black py-2 px-3 text-center">
                    {books.length > 0
                      ? `${((category.value / books.length) * 100).toFixed(0)}%`
                      : '0%'}
                  </td>
                </tr>
              ))}
              <tr className="border border-black font-semibold">
                <td className="border border-black py-2 px-3 text-center" colSpan={2}>
                  TOTAL
                </td>
                <td className="border border-black py-2 px-3 text-center">
                  {books.length}
                </td>
                <td className="border border-black py-2 px-3 text-center">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm">C. BUKU PALING POPULER</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="border border-black">
                <th className="border border-black py-2 px-3 text-center">No</th>
                <th className="border border-black py-2 px-3 text-left">
                  Judul Buku
                </th>
                <th className="border border-black py-2 px-3 text-left">
                  Pengarang
                </th>
                <th className="border border-black py-2 px-3 text-center">
                  Total Dipinjam
                </th>
              </tr>
            </thead>
            <tbody>
              {popularBooks.length === 0 ? (
                <tr className="border border-black">
                  <td
                    colSpan={4}
                    className="border border-black py-2 px-3 text-center"
                  >
                    Belum ada data peminjaman pada periode ini
                  </td>
                </tr>
              ) : (
                popularBooks.map((book, index) => (
                  <tr key={book.title} className="border border-black">
                    <td className="border border-black py-2 px-3 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-black py-2 px-3">
                      {book.title}
                    </td>
                    <td className="border border-black py-2 px-3">
                      {book.author}
                    </td>
                    <td className="border border-black py-2 px-3 text-center">
                      {book.count} kali
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {monthlyPenalties.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm">D. LAPORAN SANKSI</h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="border border-black">
                  <th className="border border-black py-2 px-3 text-center">No</th>
                  <th className="border border-black py-2 px-3 text-center">
                    Tanggal
                  </th>
                  <th className="border border-black py-2 px-3 text-left">No. Anggota</th>
                  <th className="border border-black py-2 px-3 text-left">
                    Nama Anggota
                  </th>
                  <th className="border border-black py-2 px-3 text-left">
                    Buku Dipinjam
                  </th>
                  <th className="border border-black py-2 px-3 text-center">
                    Alasan
                  </th>
                  <th className="border border-black py-2 px-3 text-center">
                    Jenis Sanksi
                  </th>
                  <th className="border border-black py-2 px-3 text-left">
                    Buku Sanksi
                  </th>
                  <th className="border border-black py-2 px-3 text-left">
                    Catatan
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyPenalties.map((record, index) => (
                  <tr key={record.id} className="border border-black">
                    <td className="border border-black py-2 px-3 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-black py-2 px-3 text-center">
                      {formatDate(record.date)}
                    </td>
                    <td className="border border-black py-2 px-3 font-mono">
                      {String(record.memberId || 0).padStart(4, '0')}
                    </td>
                    <td className="border border-black py-2 px-3">
                      {record.memberName}
                    </td>
                    <td className="border border-black py-2 px-3">
                      {record.bookTitle} ({record.bookNumber})
                    </td>
                    <td className="border border-black py-2 px-3 text-center">
                      {record.reason}
                    </td>
                    <td className="border border-black py-2 px-3 text-center">
                      {record.penaltyType}
                    </td>
                    <td className="border border-black py-2 px-3">
                      {record.penaltyBookTitle || '-'}
                    </td>
                    <td className="border border-black py-2 px-3">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <p
            className="text-sm leading-relaxed text-justify"
            style={{ textIndent: '2.5rem' }}
          >
            Demikian laporan ini kami sampaikan sebagai bahan evaluasi dan
            pertanggungjawaban kegiatan perpustakaan periode {months[selectedMonth]}{' '}
            {selectedYear}. Atas perhatiannya kami ucapkan terima kasih.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border print:hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Laporan Sanksi</h3>
            <p className="text-sm text-muted-foreground">
              Riwayat pengembalian buku dengan sanksi pada periode dipilih
            </p>
          </div>

          <span className="ml-auto px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
            {monthlyPenalties.length} kasus
          </span>
        </div>

        {monthlyPenalties.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground border border-dashed border-border rounded-xl">
            Belum ada data keterlambatan atau sanksi pada periode ini
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-3 font-semibold text-foreground">
                      No
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">
                      Tanggal
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">
                      No. Anggota
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">
                      Nama Anggota
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">
                      Buku Dipinjam
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">
                      Alasan
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">
                      Jenis Sanksi
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">
                      Buku Sanksi
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground">
                      Catatan
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPenalties.map((record, index) => (
                    <tr
                      key={record.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="py-3 px-3 text-muted-foreground">
                        {(penaltyPage - 1) * PENALTY_ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {formatDate(record.date)}
                      </td>
                      <td className="py-3 px-3 font-mono text-sm font-semibold text-primary">
                        {String(record.memberId || 0).padStart(4, '0')}
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">
                        {record.memberName}
                      </td>
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {record.bookTitle}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {record.bookNumber}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          record.reason === 'Terlambat'
                            ? 'bg-yellow-100 text-yellow-700'
                            : record.reason === 'Rusak'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {record.reason}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          record.penaltyType === 'Buku Donasi'
                            ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                            : 'bg-[#d4f1e3] text-[#2d8659]'
                        }`}>
                          {record.penaltyType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-foreground">
                        {record.penaltyBookTitle || '-'}
                      </td>
                      <td className="py-3 px-3 text-sm text-muted-foreground min-w-[220px]">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
              <p>
                Menampilkan {penaltyStartItem}-{penaltyEndItem} dari{' '}
                {monthlyPenalties.length} kasus
              </p>

              {totalPenaltyPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousPenaltyPage}
                    disabled={penaltyPage === 1}
                    className={`px-4 py-2 border border-border rounded-lg transition-colors ${
                      penaltyPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-accent'
                    }`}
                  >
                    Sebelumnya
                  </button>

                  {Array.from({ length: totalPenaltyPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setPenaltyPage(page)}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        penaltyPage === page
                          ? 'bg-primary text-white border-primary'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={goToNextPenaltyPage}
                    disabled={penaltyPage === totalPenaltyPages}
                    className={`px-4 py-2 border border-border rounded-lg transition-colors ${
                      penaltyPage === totalPenaltyPages
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-accent'
                    }`}
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border print:hidden">
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-1">
            Ringkasan Laporan Bulanan
          </h3>
          <p className="text-sm text-muted-foreground">
            Periode: {months[selectedMonth]} {selectedYear}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Total Peminjaman</span>
              <span className="font-semibold text-foreground">
                {monthlyBorrowings.length} transaksi
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">
                Buku Belum Dikembalikan
              </span>
              <span className="font-semibold text-foreground">
                {activeBorrowings.length} buku
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Total Keterlambatan</span>
              <span className="font-semibold text-red-600">
                {monthlyLatePenalties.length} kasus
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Total Sanksi</span>
              <span className="font-semibold text-foreground">
                {monthlyPenalties.length} kasus
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Total Anggota</span>
              <span className="font-semibold text-foreground">
                {members.length} anggota
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Total Koleksi Buku</span>
              <span className="font-semibold text-foreground">
                {books.length} eksemplar
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Kunjungan Periode Ini</span>
              <span className="font-semibold text-foreground">
                {monthlyVisitors.length} kunjungan
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Buku Populer Periode Ini</span>
              <span className="font-semibold text-foreground">
                {popularBooks[0]?.title || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden print:block mt-12">
        <div className="flex justify-end">
          <div className="text-center w-64">
            <p className="text-sm mb-1">
              Pangkalan Kerinci,{' '}
              {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm font-semibold mb-16">Petugas Perpustakaan</p>
            <div className="border-t border-black pt-1">
              <p className="text-sm font-semibold">(...........................)</p>
              <p className="text-xs">NIP. ...........................</p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        title="Pilih Periode Laporan"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bulan
            </label>
            <select
              value={draftMonth}
              onChange={(event) => {
                setDraftMonth(Number(event.target.value));
                setPeriodError('');
              }}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {months.map((month, index) => (
                <option
                  key={month}
                  value={index}
                  disabled={isFuturePeriod(index, draftYear)}
                >
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tahun
            </label>
            <select
              value={draftYear}
              onChange={(event) => {
                const newYear = Number(event.target.value);

                setDraftYear(newYear);
                setPeriodError('');

                if (isFuturePeriod(draftMonth, newYear)) {
                  setDraftMonth(currentDate.getMonth());
                }
              }}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {periodError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {periodError}
            </div>
          )}

          <div className="bg-[#e8f3ff] p-4 rounded-lg border border-[#7ba7d6]/30">
            <p className="text-sm text-[#5a7ba0]">
              Laporan akan ditampilkan untuk periode:{' '}
              <span className="font-semibold">
                {months[draftMonth]} {draftYear}
              </span>
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowPeriodModal(false)}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
            >
              Batal
            </button>

            <button
              onClick={handleApplyPeriod}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              Terapkan
            </button>
          </div>
        </div>
      </Modal>

      <SuccessModal
        isOpen={!!successMsg}
        message={successMsg}
        onClose={() => setSuccessMsg('')}
      />
    </div>
  );
}
