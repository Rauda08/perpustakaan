import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  BookCopy,
  Calendar,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';
import { Modal } from '../components/Modal';

type BorrowType = 'Harian' | 'Mingguan' | 'Tahunan' | 'Guru';
type PenaltyType = 'Buku Donasi' | 'Buku Pengganti';

interface Member {
  id: number;
  name: string;
  type: string;
  classNip: string;
}

interface Book {
  id: number;
  number: string;
  title: string;
  category: string;
  status: string;
}

interface BorrowingItem {
  id: number;
  memberId?: number;
  memberName: string;
  memberType?: string;
  memberClassNip?: string;
  bookCopyId?: number;
  bookNumber: string;
  bookTitle: string;
  bookCategory?: string;
  bookStatus?: string;
  borrowDate: string;
  dueDate: string;
  status: string;
  loanType?: string;
}

const ITEMS_PER_PAGE = 10;
const LOAN_TYPES: BorrowType[] = ['Harian', 'Mingguan', 'Tahunan', 'Guru'];

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const calculateReturnDateByType = (borrowDate: string, type: BorrowType) => {
  const date = new Date(`${borrowDate}T00:00:00`);

  switch (type) {
    case 'Harian':
      date.setDate(date.getDate() + 1);
      break;
    case 'Mingguan':
      date.setDate(date.getDate() + 7);
      break;
    case 'Tahunan':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'Guru':
      date.setDate(date.getDate() + 30);
      break;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getInitialFormData = () => {
  const today = getTodayDate();

  return {
    borrowDate: today,
    returnDate: calculateReturnDateByType(today, 'Mingguan'),
    borrowType: 'Mingguan' as BorrowType,
  };
};

const extractArray = (payload: any): any[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.borrowings)) return data.borrowings;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.books)) return data.books;
  if (Array.isArray(data?.bookMasters)) return data.bookMasters;
  if (Array.isArray(data?.book_masters)) return data.book_masters;
  if (Array.isArray(data?.bookCopies)) return data.bookCopies;
  if (Array.isArray(data?.book_copies)) return data.book_copies;

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
      return extractArray(result);
    } catch {
      continue;
    }
  }

  return [];
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
  const result = await response.json().catch(() => null);

  return (
    result?.message ||
    result?.errors?.member_id?.[0] ||
    result?.errors?.book_copy_id?.[0] ||
    result?.errors?.borrow_date?.[0] ||
    result?.errors?.due_date?.[0] ||
    result?.errors?.loan_type?.[0] ||
    result?.errors?.status?.[0] ||
    result?.errors?.return_date?.[0] ||
    result?.errors?.penalty_type?.[0] ||
    result?.errors?.penalty_book_title?.[0] ||
    result?.errors?.notes?.[0] ||
    fallback
  );
};

const normalizeMember = (item: any): Member => {
  return {
    id: Number(item.id),
    name: item.name ?? '-',
    type: item.type ?? 'Siswa',
    classNip: String(
      item.classNip ?? item.class_nip ?? item.nis ?? item.nip ?? '-'
    ),
  };
};

const normalizeBorrowing = (item: any): BorrowingItem => {
  return {
    id: Number(item.id),
    memberId: item.memberId ?? item.member_id ?? item.member?.id,
    memberName:
      item.memberName ??
      item.member_name ??
      item.member?.name ??
      '-',
    memberType:
      item.memberType ??
      item.member_type ??
      item.member?.type ??
      '-',
    memberClassNip:
      item.memberClassNip ??
      item.member_class_nip ??
      item.member?.classNip ??
      item.member?.class_nip ??
      item.member?.nis ??
      item.member?.nip ??
      '-',
    bookCopyId:
      item.bookCopyId ??
      item.book_copy_id ??
      item.bookCopy?.id ??
      item.book_copy?.id,
    bookNumber:
      item.bookNumber ??
      item.book_number ??
      item.bookCopy?.number ??
      item.book_copy?.number ??
      '-',
    bookTitle:
      item.bookTitle ??
      item.book_title ??
      item.bookCopy?.title ??
      item.book_copy?.title ??
      item.bookCopy?.bookMaster?.title ??
      item.bookCopy?.book_master?.title ??
      item.book_copy?.bookMaster?.title ??
      item.book_copy?.book_master?.title ??
      item.book_master?.title ??
      '-',
    bookCategory:
      item.bookCategory ??
      item.book_category ??
      item.bookCopy?.category ??
      item.book_copy?.category ??
      item.bookCopy?.bookMaster?.category ??
      item.bookCopy?.book_master?.category ??
      item.book_copy?.bookMaster?.category ??
      item.book_copy?.book_master?.category ??
      item.book_master?.category ??
      '-',
    bookStatus:
      item.bookStatus ??
      item.book_status ??
      item.bookCopy?.status ??
      item.book_copy?.status ??
      'Dipinjam',
    borrowDate:
      item.borrowDate ??
      item.borrow_date ??
      '-',
    dueDate:
      item.dueDate ??
      item.due_date ??
      '-',
    status: item.status ?? 'Aktif',
    loanType:
      item.loanType ??
      item.loan_type ??
      item.borrowType ??
      item.borrow_type ??
      'Mingguan',
  };
};

const normalizeBooks = (items: any[]): Book[] => {
  const books: Book[] = [];

  items.forEach((item) => {
    const copies = item.copies ?? item.bookCopies ?? item.book_copies;

    const masterTitle =
      item.title ??
      item.bookTitle ??
      item.book_title ??
      item.bookMaster?.title ??
      item.book_master?.title ??
      '-';

    const masterCategory =
      item.category ??
      item.bookCategory ??
      item.book_category ??
      item.bookMaster?.category ??
      item.book_master?.category ??
      '-';

    if (Array.isArray(copies)) {
      copies.forEach((copy: any) => {
        books.push({
          id: Number(copy.id),
          number: String(copy.number ?? copy.book_number ?? '-'),
          title:
            item.title ??
            copy.title ??
            copy.bookTitle ??
            copy.book_title ??
            copy.bookMaster?.title ??
            copy.book_master?.title ??
            masterTitle,
          category:
            item.category ??
            copy.category ??
            copy.bookCategory ??
            copy.book_category ??
            copy.bookMaster?.category ??
            copy.book_master?.category ??
            masterCategory,
          status: copy.status ?? 'Tersedia',
        });
      });

      return;
    }

    if (item.number || item.bookNumber || item.book_number) {
      books.push({
        id: Number(item.id),
        number: String(item.number ?? item.bookNumber ?? item.book_number ?? '-'),
        title: masterTitle,
        category: masterCategory,
        status: item.status ?? 'Tersedia',
      });
    }
  });

  return books.filter((book) => book.id && book.number !== '-');
};

export function Borrowing() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedBorrowingForReturn, setSelectedBorrowingForReturn] =
    useState<BorrowingItem | null>(null);

  const [borrowings, setBorrowings] = useState<BorrowingItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showBookDropdown, setShowBookDropdown] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const [penaltyData, setPenaltyData] = useState({
    type: 'Buku Donasi' as PenaltyType,
    bookTitle: '',
    notes: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const [borrowingsResponse, membersResponse, booksResponse] =
        await Promise.all([
          fetchApiArray(['/api/borrowings/active', '/api/borrowings']),
          fetchApiArray(['/api/members']),
          fetchApiArray(['/api/books']),
        ]);

      setBorrowings(borrowingsResponse.map(normalizeBorrowing));
      setMembers(membersResponse.map(normalizeMember));
      setBooks(normalizeBooks(booksResponse));
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal mengambil data peminjaman.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeBorrowings = useMemo(() => {
    return borrowings.filter((item) => {
      return item.status === 'Aktif' || item.status === 'Terlambat';
    });
  }, [borrowings]);

  const filteredBorrowing = useMemo(() => {
    return activeBorrowings.filter((item) => {
      const keyword = searchTerm.toLowerCase();

      const matchesSearch =
        item.memberName.toLowerCase().includes(keyword) ||
        item.bookTitle.toLowerCase().includes(keyword) ||
        item.bookNumber.toLowerCase().includes(keyword);

      const matchesLoanType =
        loanTypeFilter === 'Semua' || item.loanType === loanTypeFilter;

      return matchesSearch && matchesLoanType;
    });
  }, [activeBorrowings, searchTerm, loanTypeFilter]);

  const totalPages = Math.ceil(filteredBorrowing.length / ITEMS_PER_PAGE);

  const paginatedBorrowing = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredBorrowing.slice(startIndex, endIndex);
  }, [filteredBorrowing, currentPage]);

  const startItem =
    filteredBorrowing.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredBorrowing.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, loanTypeFilter]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const filteredMembers = members.filter((member) => {
    const keyword = memberSearch.toLowerCase();

    return (
      member.name.toLowerCase().includes(keyword) ||
      member.classNip.toLowerCase().includes(keyword)
    );
  });

  const filteredBooks = books.filter((book) => {
    const keyword = bookSearch.toLowerCase();

    return (
      book.title.toLowerCase().includes(keyword) ||
      book.number.toLowerCase().includes(keyword)
    );
  });

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setMemberSearch(member.name);
    setShowMemberDropdown(false);
  };

  const handleBookSelect = (book: Book) => {
    if (book.status !== 'Tersedia') {
      return;
    }

    setSelectedBook(book);
    setBookSearch(`${book.title} (${book.number})`);
    setShowBookDropdown(false);
  };

  const handleBorrowTypeChange = (type: BorrowType) => {
    setFormData({
      ...formData,
      borrowType: type,
      returnDate: calculateReturnDateByType(formData.borrowDate, type),
    });
  };

  const handleBorrowDateChange = (date: string) => {
    setFormData({
      ...formData,
      borrowDate: date,
      returnDate: calculateReturnDateByType(date, formData.borrowType),
    });
  };

  const handleReset = () => {
    setSelectedMember(null);
    setSelectedBook(null);
    setMemberSearch('');
    setBookSearch('');
    setShowMemberDropdown(false);
    setShowBookDropdown(false);
    setFormData(getInitialFormData());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedMember || !selectedBook) {
      alert('Pilih anggota dan buku terlebih dahulu.');
      return;
    }

    const payload = {
      member_id: selectedMember.id,
      book_copy_id: selectedBook.id,
      borrow_date: formData.borrowDate,
      due_date: formData.returnDate,
      loan_type: formData.borrowType,
      status: 'Aktif',
    };

    setIsSaving(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/borrowings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Gagal menyimpan peminjaman.')
        );
      }

      alert(
        `Peminjaman berhasil dibuat!\nAnggota: ${selectedMember.name}\nBuku: ${selectedBook.title}`
      );

      handleReset();
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan saat menyimpan peminjaman.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReturn = (borrowing: BorrowingItem) => {
    setSelectedBorrowingForReturn(borrowing);
    setPenaltyData({
      type: 'Buku Donasi',
      bookTitle: '',
      notes: '',
    });
    setShowPenaltyModal(true);
  };

  const handlePenaltySubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedBorrowingForReturn) {
      return;
    }

    const payload = {
      return_date: getTodayDate(),
      penalty_type: penaltyData.type,
      penalty_book_title: penaltyData.bookTitle,
      notes: penaltyData.notes,
    };

    setIsSaving(true);
    setErrorMsg('');

    try {
      const response = await fetch(
        `/api/borrowings/${selectedBorrowingForReturn.id}/return`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Gagal memproses pengembalian.')
        );
      }

      alert(
        `Pengembalian berhasil!\nAnggota: ${selectedBorrowingForReturn.memberName}\nBuku: ${selectedBorrowingForReturn.bookTitle}\nSanksi: ${penaltyData.type} (${penaltyData.bookTitle || '-'})\nCatatan: ${penaltyData.notes || '-'}`
      );

      setShowPenaltyModal(false);
      setSelectedBorrowingForReturn(null);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan saat memproses pengembalian.');
    } finally {
      setIsSaving(false);
    }
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Peminjaman Buku
          </h1>
          <p className="text-muted-foreground">
            Proses peminjaman buku perpustakaan
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Peminjaman Baru
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border">
        <h3 className="font-semibold text-foreground mb-5">
          Daftar Peminjaman Aktif
        </h3>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari berdasarkan nama anggota, judul buku, atau nomor buku..."
              className="w-full pl-11 pr-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <select
            value={loanTypeFilter}
            onChange={(event) => setLoanTypeFilter(event.target.value)}
            className="w-full md:w-52 px-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Harian">Harian</option>
            <option value="Mingguan">Mingguan</option>
            <option value="Tahunan">Tahunan</option>
            <option value="Guru">Guru</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  No
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Nama Anggota
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Buku
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Jenis Peminjaman
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Tanggal Pinjam
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Jatuh Tempo
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Status
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedBorrowing.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {isLoading
                      ? 'Memuat data peminjaman...'
                      : searchTerm || loanTypeFilter !== 'Semua'
                      ? 'Tidak ada hasil yang sesuai'
                      : 'Belum ada peminjaman aktif'}
                  </td>
                </tr>
              )}

              {paginatedBorrowing.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="py-4 px-4 text-muted-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>

                  <td className="py-4 px-4">
                    <span className="font-medium text-foreground">
                      {item.memberName}
                    </span>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.memberClassNip}
                    </p>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <BookCopy className="w-4 h-4 text-primary" />
                      <div>
                        <span className="text-foreground">
                          {item.bookTitle}
                        </span>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.bookNumber}
                        </p>
                      </div>
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
                      {item.loanType ?? '-'}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {item.borrowDate}
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {item.dueDate}
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'Aktif'
                          ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleReturn(item)}
                      className="px-4 py-2 bg-[#a8d5ba] hover:bg-[#8fc5a4] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Kembalikan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
          <p>
            {filteredBorrowing.length === 0
              ? 'Menampilkan 0 peminjaman aktif'
              : `Menampilkan ${startItem}-${endItem} dari ${filteredBorrowing.length} peminjaman aktif`}
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

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          handleReset();
        }}
        title="Peminjaman Buku Baru"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Data Anggota
            </h3>

            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              <div className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cari Anggota
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(event) => {
                      setMemberSearch(event.target.value);
                      setShowMemberDropdown(true);
                      setSelectedMember(null);
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                    className="w-full pl-11 pr-10 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Ketik nama atau NIS/NIP anggota..."
                    required
                  />

                  {memberSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(null);
                        setMemberSearch('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {showMemberDropdown && memberSearch && filteredMembers.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleMemberSelect(member)}
                        className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-0"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {member.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.classNip}
                            </p>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              member.type === 'Guru'
                                ? 'bg-[#fff3cc] text-[#9d7a2f]'
                                : 'bg-[#e8f3ff] text-[#5a7ba0]'
                            }`}
                          >
                            {member.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedMember && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      No Anggota
                    </p>
                    <p className="font-medium text-foreground">
                      #{selectedMember.id.toString().padStart(4, '0')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Nama Anggota
                    </p>
                    <p className="font-medium text-foreground">
                      {selectedMember.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Jenis Anggota
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedMember.type === 'Guru'
                          ? 'bg-[#fff3cc] text-[#9d7a2f]'
                          : 'bg-[#e8f3ff] text-[#5a7ba0]'
                      }`}
                    >
                      {selectedMember.type}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {selectedMember.type === 'Siswa' ? 'NIS' : 'NIP'}
                    </p>
                    <p className="font-medium text-foreground font-mono">
                      {selectedMember.classNip}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookCopy className="w-5 h-5 text-primary" />
              Data Buku
            </h3>

            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              <div className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cari Buku
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(event) => {
                      setBookSearch(event.target.value);
                      setShowBookDropdown(true);
                      setSelectedBook(null);
                    }}
                    onFocus={() => setShowBookDropdown(true)}
                    className="w-full pl-11 pr-10 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Ketik judul atau nomor buku..."
                    required
                  />

                  {bookSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBook(null);
                        setBookSearch('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {showBookDropdown && bookSearch && filteredBooks.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    {filteredBooks.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleBookSelect(book)}
                        disabled={book.status !== 'Tersedia'}
                        className={`w-full px-4 py-3 text-left border-b border-border last:border-0 ${
                          book.status === 'Tersedia'
                            ? 'hover:bg-accent transition-colors'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {book.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {book.number} • {book.category}
                            </p>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              book.status === 'Tersedia'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {book.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedBook && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Nomor Buku
                    </p>
                    <p className="font-medium text-foreground font-mono">
                      {selectedBook.number}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Judul Buku
                    </p>
                    <p className="font-medium text-foreground">
                      {selectedBook.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Kategori
                    </p>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {selectedBook.category}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Status Buku
                    </p>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {selectedBook.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Data Peminjaman
            </h3>

            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tanggal Peminjaman
                  </label>
                  <input
                    type="date"
                    value={formData.borrowDate}
                    onChange={(event) =>
                      handleBorrowDateChange(event.target.value)
                    }
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tanggal Pengembalian
                  </label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    readOnly
                    className="w-full px-4 py-3 bg-accent/50 border border-border rounded-lg cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Jenis Peminjaman
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {LOAN_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleBorrowTypeChange(type)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        formData.borrowType === type
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-input-background border border-border hover:bg-accent'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  Durasi:{' '}
                  {formData.borrowType === 'Harian'
                    ? '1 hari'
                    : formData.borrowType === 'Mingguan'
                    ? '7 hari'
                    : formData.borrowType === 'Tahunan'
                    ? '1 tahun'
                    : '30 hari'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                handleReset();
              }}
              disabled={isSaving}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={!selectedMember || !selectedBook || isSaving}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        title="Pengembalian Buku"
      >
        {selectedBorrowingForReturn && (
          <form onSubmit={handlePenaltySubmit} className="space-y-5">
            <div className="bg-muted/40 border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Anggota</span>
                <p className="font-semibold text-foreground">
                  {selectedBorrowingForReturn.memberName}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">
                  {selectedBorrowingForReturn.memberType === 'Siswa'
                    ? 'NIS'
                    : 'NIP'}
                </span>
                <p className="font-semibold text-foreground font-mono">
                  {selectedBorrowingForReturn.memberClassNip}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">Buku</span>
                <p className="font-semibold text-foreground">
                  {selectedBorrowingForReturn.bookTitle}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">No. Buku</span>
                <p className="font-semibold text-foreground font-mono">
                  {selectedBorrowingForReturn.bookNumber}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">Jatuh Tempo</span>
                <p className="font-semibold text-foreground">
                  {selectedBorrowingForReturn.dueDate}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
                    selectedBorrowingForReturn.status === 'Terlambat'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-[#e8f3ff] text-[#5a7ba0]'
                  }`}
                >
                  {selectedBorrowingForReturn.status}
                </span>
              </div>
            </div>

            {selectedBorrowingForReturn.status === 'Terlambat' && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  ⚠ Buku terlambat dikembalikan
                </p>
                <ul className="text-sm text-red-700 list-disc ml-4 space-y-0.5">
                  <li>
                    <strong>Buku Donasi</strong> — terlambat: bawa 1 buku bebas
                    untuk perpustakaan
                  </li>
                  <li>
                    <strong>Buku Pengganti</strong> — hilang/rusak: ganti buku
                    yang sama persis
                  </li>
                </ul>
              </div>
            )}

            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-accent/60 px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm">
                  Sanksi / Kondisi Pengembalian
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Jenis Sanksi
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPenaltyData({
                          ...penaltyData,
                          type: 'Buku Donasi',
                        })
                      }
                      className={`px-4 py-3 rounded-lg text-left transition-all border ${
                        penaltyData.type === 'Buku Donasi'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white border-border hover:bg-accent'
                      }`}
                    >
                      <p className="font-semibold text-sm">Buku Donasi</p>
                      <p
                        className={`text-xs mt-0.5 ${
                          penaltyData.type === 'Buku Donasi'
                            ? 'opacity-80'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Terlambat mengembalikan
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPenaltyData({
                          ...penaltyData,
                          type: 'Buku Pengganti',
                        })
                      }
                      className={`px-4 py-3 rounded-lg text-left transition-all border ${
                        penaltyData.type === 'Buku Pengganti'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white border-border hover:bg-accent'
                      }`}
                    >
                      <p className="font-semibold text-sm">Buku Pengganti</p>
                      <p
                        className={`text-xs mt-0.5 ${
                          penaltyData.type === 'Buku Pengganti'
                            ? 'opacity-80'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Buku hilang / rusak
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Judul Buku{' '}
                    {penaltyData.type === 'Buku Donasi'
                      ? 'Donasi'
                      : 'Pengganti'}
                  </label>

                  <input
                    type="text"
                    value={penaltyData.bookTitle}
                    onChange={(event) =>
                      setPenaltyData({
                        ...penaltyData,
                        bookTitle: event.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder={
                      penaltyData.type === 'Buku Donasi'
                        ? 'Contoh: Kamus Bahasa Indonesia'
                        : `Contoh: ${selectedBorrowingForReturn.bookTitle}`
                    }
                  />

                  <p className="text-xs text-muted-foreground mt-1">
                    {penaltyData.type === 'Buku Donasi'
                      ? 'Buku bebas apa saja untuk disumbangkan ke perpustakaan'
                      : 'Harus buku yang sama persis dengan yang hilang/rusak'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Catatan
                  </label>

                  <textarea
                    value={penaltyData.notes}
                    onChange={(event) =>
                      setPenaltyData({
                        ...penaltyData,
                        notes: event.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                    placeholder="Contoh: Buku dalam kondisi baik, sampul masih lengkap..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowPenaltyModal(false)}
                disabled={isSaving}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Memproses...' : 'Proses Pengembalian'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
