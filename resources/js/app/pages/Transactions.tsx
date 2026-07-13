import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  BookCopy,
  Calendar,
  Edit2,
  Eye,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

const ITEMS_PER_PAGE = 10;

type LoanType = 'Harian' | 'Mingguan' | 'Tahunan' | 'Guru';
type LoanSubType = 'Pribadi' | 'Kelas' | '';
type BookCondition = 'Bagus' | 'Rusak' | 'Hilang';
type PenaltyType = 'Buku Donasi' | 'Buku Pengganti';

interface Penalty {
  id: number;
  borrowingId: number;
  date: string;
  memberId?: number;
  memberName: string;
  bookNumber: string;
  bookTitle: string;
  loanType: string;
  reason: string;
  penaltyType: string;
  penaltyBookTitle: string;
  notes?: string;
}

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
  batchId: string;
  memberId?: number;
  memberName: string;
  memberType?: string;
  memberClassNip?: string;
  bookCopyId?: number;
  bookTitle: string;
  bookNumber: string;
  bookCategory?: string;
  borrowDate: string;
  dueDate: string;
  returnTime: string;
  status: string;
  loanType: LoanType;
  loanSubType: LoanSubType;
  quantity: number;
  className: string;
}

interface BatchItem {
  batchId: string;
  items: BorrowingItem[];
  memberName: string;
  memberId?: number;
  loanType: LoanType;
  loanSubType: LoanSubType;
  className: string;
  quantity: number;
  borrowDate: string;
  dueDate: string;
  returnTime: string;
  status: string;
  bookCount: number;
}

interface PenaltyBookInput {
  id: string;
  title: string;
}

interface ReturnBookState {
  condition: BookCondition;
  penaltyType: PenaltyType;
  penaltyBookTitles: PenaltyBookInput[];
  notes: string;
}

const createPenaltyBookInput = (): PenaltyBookInput => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: '',
});

const createReturnBookState = (
  item: BorrowingItem,
  batchStatus: string
): ReturnBookState => ({
  condition: 'Bagus',
  penaltyType: batchStatus === 'Terlambat' ? 'Buku Donasi' : 'Buku Pengganti',
  penaltyBookTitles: [createPenaltyBookInput()],
  notes: '',
});

const createInitialReturnBookStates = (batch: BatchItem) => {
  const result: Record<number, ReturnBookState> = {};

  batch.items.forEach((item) => {
    result[item.id] = createReturnBookState(item, batch.status);
  });

  return result;
};

interface TransactionsProps {
  onAddPenalty?: (record: Penalty) => void;
  quickLoanType?: string | null;
  onQuickLoanConsumed?: () => void;
}

const todayDate = () => new Date().toISOString().split('T')[0];

const nowTime = () => {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
};

const addDays = (dateText: string, days: number) => {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);

  return date.toISOString().split('T')[0];
};

const addYears = (dateText: string, years: number) => {
  const date = new Date(`${dateText}T00:00:00`);
  date.setFullYear(date.getFullYear() + years);

  return date.toISOString().split('T')[0];
};

const calculateReturnDate = (borrowDate: string, type: LoanType) => {
  if (!borrowDate) {
    return todayDate();
  }

  if (type === 'Harian') {
    return borrowDate;
  }

  if (type === 'Mingguan') {
    return addDays(borrowDate, 7);
  }

  if (type === 'Tahunan') {
    return addYears(borrowDate, 1);
  }

  // Backend masih mewajibkan due_date untuk tipe Guru.
  // Jadi dikirim +30 hari agar tidak terkena validasi 422.
  return addDays(borrowDate, 30);
};

const isLessonBook = (book: Book) => {
  return (
    book.category === 'Pelajaran' ||
    book.category === 'Pendidikan' ||
    book.category?.toLowerCase().includes('pelajaran') ||
    book.category?.toLowerCase().includes('pendidikan')
  );
};

const getInitialFormData = () => {
  const borrowDate = todayDate();
  const borrowType: LoanType = 'Harian';

  return {
    borrowDate,
    borrowTime: nowTime(),
    returnDate: calculateReturnDate(borrowDate, borrowType),
    returnTime: '17:00',
    borrowType,
    loanSubType: 'Pribadi' as LoanSubType,
    className: '',
    quantity: 1,
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

const getApiErrorMessage = async (response: Response, fallback: string) => {
  const result = await response.json().catch(() => null);

  return (
    result?.message ||
    result?.errors?.memberId?.[0] ||
    result?.errors?.member_id?.[0] ||
    result?.errors?.bookCopyId?.[0] ||
    result?.errors?.book_copy_id?.[0] ||
    result?.errors?.bookCopyIds?.[0] ||
    result?.errors?.bookNumbers?.[0] ||
    result?.errors?.borrowDate?.[0] ||
    result?.errors?.borrow_date?.[0] ||
    result?.errors?.dueDate?.[0] ||
    result?.errors?.due_date?.[0] ||
    result?.errors?.returnTime?.[0] ||
    result?.errors?.return_time?.[0] ||
    result?.errors?.loanType?.[0] ||
    result?.errors?.loan_type?.[0] ||
    result?.errors?.loanSubType?.[0] ||
    result?.errors?.loan_sub_type?.[0] ||
    result?.errors?.quantity?.[0] ||
    result?.errors?.className?.[0] ||
    result?.errors?.class_name?.[0] ||
    result?.errors?.returnDate?.[0] ||
    result?.errors?.return_date?.[0] ||
    result?.errors?.reason?.[0] ||
    result?.errors?.penaltyType?.[0] ||
    result?.errors?.penalty_type?.[0] ||
    result?.errors?.penaltyBookTitle?.[0] ||
    result?.errors?.penalty_book_title?.[0] ||
    result?.errors?.notes?.[0] ||
    fallback
  );
};

const apiGetArray = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, `Gagal memuat ${url}`));
  }

  const result = await response.json();
  return extractArray(result);
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
            copy.title ??
            copy.bookTitle ??
            copy.book_title ??
            copy.bookMaster?.title ??
            copy.book_master?.title ??
            masterTitle,
          category:
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

const normalizeBorrowing = (item: any): BorrowingItem => {
  const member = item.member ?? {};
  const bookCopy = item.bookCopy ?? item.book_copy ?? {};
  const bookMaster =
    bookCopy.bookMaster ??
    bookCopy.book_master ??
    item.bookMaster ??
    item.book_master ??
    {};

  return {
    id: Number(item.id),
    batchId: String(item.batchId ?? item.batch_id ?? `BATCH-${item.id}`),
    memberId: item.memberId ?? item.member_id ?? member.id,
    memberName:
      item.memberName ??
      item.member_name ??
      member.name ??
      '-',
    memberType:
      item.memberType ??
      item.member_type ??
      member.type ??
      '-',
    memberClassNip:
      item.memberClassNip ??
      item.member_class_nip ??
      member.classNip ??
      member.class_nip ??
      member.nis ??
      member.nip ??
      '-',
    bookCopyId:
      item.bookCopyId ??
      item.book_copy_id ??
      bookCopy.id,
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
    bookCategory:
      item.bookCategory ??
      item.book_category ??
      bookCopy.category ??
      bookMaster.category ??
      '-',
    borrowDate:
      item.borrowDate ??
      item.borrow_date ??
      '-',
    dueDate:
      item.dueDate ??
      item.due_date ??
      '-',
    returnTime:
      item.returnTime ??
      item.return_time ??
      '',
    status: item.status ?? 'Aktif',
    loanType:
      (item.loanType ??
        item.loan_type ??
        'Mingguan') as LoanType,
    loanSubType:
      (item.loanSubType ??
        item.loan_sub_type ??
        '') as LoanSubType,
    quantity: Number(item.quantity ?? 1),
    className: item.className ?? item.class_name ?? '',
  };
};

export function Transactions({
  onAddPenalty,
  quickLoanType,
  onQuickLoanConsumed,
}: TransactionsProps) {
  const [borrowingData, setBorrowingData] = useState<BorrowingItem[]>([]);
  const [membersData, setMembersData] = useState<Member[]>([]);
  const [booksData, setBooksData] = useState<Book[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    batchId: string | null;
    memberName?: string;
  }>({
    isOpen: false,
    batchId: null,
  });

  const [returnConfirmDialog, setReturnConfirmDialog] = useState({
    isOpen: false,
  });

  const [selectedBatchForReturn, setSelectedBatchForReturn] =
    useState<BatchItem | null>(null);
  const [returnBookStates, setReturnBookStates] = useState<
    Record<number, ReturnBookState>
  >({});

  const [editMode, setEditMode] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [bookInputs, setBookInputs] = useState<
    { id: string; search: string; selected: Book | null }[]
  >([{ id: '1', search: '', selected: null }]);

  const [showBookDropdownId, setShowBookDropdownId] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState(getInitialFormData());

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const [borrowings, members, books] = await Promise.all([
        apiGetArray('/api/borrowings/active'),
        apiGetArray('/api/members'),
        apiGetArray('/api/books'),
      ]);

      setBorrowingData(borrowings.map(normalizeBorrowing));
      setMembersData(members.map(normalizeMember));
      setBooksData(normalizeBooks(books));
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal memuat data transaksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupedBorrowing = useMemo(() => {
    return borrowingData.reduce((acc, item) => {
      if (!acc[item.batchId]) {
        acc[item.batchId] = [];
      }

      acc[item.batchId].push(item);

      return acc;
    }, {} as Record<string, BorrowingItem[]>);
  }, [borrowingData]);

  const allBatches = useMemo<BatchItem[]>(() => {
    return Object.entries(groupedBorrowing).map(([batchId, items]) => ({
      batchId,
      items,
      memberName: items[0].memberName,
      memberId: items[0].memberId,
      loanType: items[0].loanType,
      loanSubType: items[0].loanSubType,
      className: items[0].className,
      quantity: items[0].quantity,
      borrowDate: items[0].borrowDate,
      dueDate: items[0].dueDate,
      returnTime: items[0].returnTime,
      status: items.some((item) => item.status === 'Terlambat')
        ? 'Terlambat'
        : items[0].status,
      bookCount: items.length,
    }));
  }, [groupedBorrowing]);

  const filteredBatches = useMemo(() => {
    return allBatches
      .filter((batch) => {
        const lowerSearch = searchTerm.toLowerCase();

        const matchesSearch =
          batch.memberName.toLowerCase().includes(lowerSearch) ||
          batch.items.some((item) =>
            item.bookTitle.toLowerCase().includes(lowerSearch)
          ) ||
          batch.items.some((item) =>
            item.bookNumber.toLowerCase().includes(lowerSearch)
          );

        const matchesLoanType =
          loanTypeFilter === 'Semua' || batch.loanType === loanTypeFilter;

        return matchesSearch && matchesLoanType;
      })
      .sort((a, b) => {
        if (a.status === 'Terlambat' && b.status !== 'Terlambat') return -1;
        if (a.status !== 'Terlambat' && b.status === 'Terlambat') return 1;

        return b.batchId.localeCompare(a.batchId);
      });
  }, [allBatches, searchTerm, loanTypeFilter]);

  const totalPages = Math.ceil(filteredBatches.length / ITEMS_PER_PAGE);

  const paginatedBatches = useMemo(() => {
    return filteredBatches.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredBatches, currentPage]);

  const startItem =
    filteredBatches.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredBatches.length);

  const filteredBookCount = filteredBatches.reduce(
    (acc, batch) => acc + batch.bookCount,
    0
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

  const detailBatch = useMemo(() => {
    return allBatches.find((batch) => batch.batchId === detailBatchId) ?? null;
  }, [allBatches, detailBatchId]);

  const filteredMembersForModal = membersData.filter((member) => {
    const keyword = memberSearch.toLowerCase();

    return (
      member.name.toLowerCase().includes(keyword) ||
      member.classNip.toLowerCase().includes(keyword)
    );
  });

  const getFilteredBooksForInput = (searchText: string) => {
    const selectedIds = bookInputs
      .filter((input) => input.selected)
      .map((input) => input.selected!.id);

    return booksData.filter((book) => {
      const keyword = searchText.toLowerCase();

      return (
        book.status === 'Tersedia' &&
        !selectedIds.includes(book.id) &&
        (book.title.toLowerCase().includes(keyword) ||
          book.number.toLowerCase().includes(keyword))
      );
    });
  };

  const getActiveBorrowingsByType = (
    memberId: number | undefined,
    loanType: string
  ) => {
    return borrowingData.filter((item) => {
      return (
        item.memberId === memberId &&
        item.loanType === loanType &&
        (item.status === 'Aktif' || item.status === 'Terlambat')
      );
    });
  };

  const handleReset = () => {
    setSelectedMember(null);
    setMemberSearch('');
    setBookInputs([{ id: '1', search: '', selected: null }]);
    setShowMemberDropdown(false);
    setShowBookDropdownId(null);
    setFormData(getInitialFormData());
    setEditMode(false);
    setEditingBatchId(null);
  };

  useEffect(() => {
    if (quickLoanType) {
      const safeLoanType = quickLoanType as LoanType;
      const borrowDate = todayDate();

      handleReset();

      setFormData({
        borrowDate,
        borrowType: safeLoanType,
        loanSubType: safeLoanType === 'Harian' ? 'Pribadi' : '',
        returnDate: calculateReturnDate(borrowDate, safeLoanType),
        borrowTime: safeLoanType === 'Harian' ? nowTime() : '',
        returnTime: safeLoanType === 'Harian' ? '17:00' : '',
        className: '',
        quantity: 1,
      });

      setEditMode(false);
      setShowModal(true);
      onQuickLoanConsumed?.();
    }
  }, [quickLoanType]);

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setMemberSearch(member.name);
    setShowMemberDropdown(false);
  };

  const updateBookInput = (id: string, search: string, selected: Book | null) => {
    setBookInputs((previous) =>
      previous.map((input) =>
        input.id === id
          ? {
              ...input,
              search,
              selected,
            }
          : input
      )
    );
  };

  const handleBookSelect = (inputId: string, book: Book) => {
    updateBookInput(inputId, `${book.title} (${book.number})`, book);
    setShowBookDropdownId(null);
  };

  const addBookInput = () => {
    setBookInputs((previous) => [
      ...previous,
      {
        id: String(Date.now()),
        search: '',
        selected: null,
      },
    ]);
  };

  const removeBookInput = (id: string) => {
    if (bookInputs.length > 1) {
      setBookInputs((previous) => previous.filter((input) => input.id !== id));
    }
  };

  const handleBorrowTypeChange = (type: LoanType) => {
    const borrowDate = formData.borrowDate || todayDate();

    setFormData({
      ...formData,
      borrowType: type,
      loanSubType: type === 'Harian' ? 'Pribadi' : '',
      borrowDate,
      borrowTime: type === 'Harian' ? nowTime() : '',
      returnTime: type === 'Harian' ? '17:00' : '',
      returnDate: calculateReturnDate(borrowDate, type),
      className: '',
      quantity: 1,
    });

    setBookInputs([{ id: String(Date.now()), search: '', selected: null }]);
    setShowBookDropdownId(null);
  };

  const handleLoanSubTypeChange = (subType: LoanSubType) => {
    setFormData({
      ...formData,
      loanSubType: subType,
      className: '',
      quantity: 1,
    });

    setBookInputs([{ id: String(Date.now()), search: '', selected: null }]);
    setShowBookDropdownId(null);
  };

  const handleBorrowDateChange = (date: string) => {
    setFormData({
      ...formData,
      borrowDate: date,
      returnDate: calculateReturnDate(date, formData.borrowType),
    });
  };

  const validateBorrowing = (selectedBooks: Book[]) => {
    if (!selectedMember) {
      setToast({ message: 'Pilih anggota terlebih dahulu!', type: 'error' });
      return false;
    }

    if (selectedBooks.length === 0) {
      setToast({ message: 'Pilih minimal 1 buku!', type: 'error' });
      return false;
    }

    if (formData.borrowType === 'Harian' && formData.loanSubType === 'Pribadi') {
      if (selectedBooks.length > 1) {
        setToast({
          message: 'Peminjaman harian pribadi maksimal 1 buku!',
          type: 'error',
        });
        return false;
      }
    }

    if (formData.borrowType === 'Harian' && formData.loanSubType === 'Kelas') {
      if (!formData.className.trim()) {
        setToast({ message: 'Isi nama kelas terlebih dahulu!', type: 'error' });
        return false;
      }

      if (formData.quantity < 1) {
        setToast({ message: 'Jumlah buku minimal 1!', type: 'error' });
        return false;
      }

      const nonLesson = selectedBooks.filter((book) => !isLessonBook(book));
      if (nonLesson.length > 0) {
        setToast({
          message: 'Peminjaman kelas hanya untuk buku Pelajaran/Pendidikan!',
          type: 'error',
        });
        return false;
      }
    }

    if (formData.borrowType === 'Tahunan') {
      const nonLesson = selectedBooks.filter((book) => !isLessonBook(book));
      if (nonLesson.length > 0) {
        setToast({
          message: 'Peminjaman tahunan hanya untuk buku Pelajaran/Pendidikan!',
          type: 'error',
        });
        return false;
      }
    }

    if (formData.borrowType === 'Mingguan') {
      if (selectedBooks.length > 2) {
        setToast({
          message: 'Peminjaman mingguan maksimal 2 buku!',
          type: 'error',
        });
        return false;
      }

      const activeMingguan = getActiveBorrowingsByType(
        selectedMember.id,
        'Mingguan'
      );

      const currentlyEditedCount =
        editMode && editingBatchId
          ? borrowingData.filter((item) => item.batchId === editingBatchId).length
          : 0;

      if (
        !editMode &&
        activeMingguan.length + selectedBooks.length > 2
      ) {
        setToast({
          message: `${selectedMember.name} sudah meminjam ${activeMingguan.length} buku mingguan. Maksimal 2 buku aktif!`,
          type: 'error',
        });
        return false;
      }

      if (
        editMode &&
        activeMingguan.length - currentlyEditedCount + selectedBooks.length > 2
      ) {
        setToast({
          message: `Peminjaman mingguan maksimal 2 buku aktif.`,
          type: 'error',
        });
        return false;
      }

      const lessonBooks = selectedBooks.filter((book) => isLessonBook(book));
      if (lessonBooks.length > 0) {
        setToast({
          message:
            'Peminjaman mingguan tidak bisa untuk buku Pelajaran/Pendidikan. Gunakan tipe Tahunan.',
          type: 'error',
        });
        return false;
      }
    }

    return true;
  };

  const createBorrowing = async (selectedBooks: Book[]) => {
    if (!selectedMember) return;

    const payload = {
      member_id: selectedMember.id,
      bookCopyIds: selectedBooks.map((book) => book.id),
      borrow_date: formData.borrowDate,
      due_date: formData.returnDate,
      return_time: formData.returnTime || null,
      loan_type: formData.borrowType,
      loan_sub_type: formData.loanSubType || null,
      quantity:
        formData.borrowType === 'Harian' && formData.loanSubType === 'Kelas'
          ? formData.quantity
          : 1,
      class_name:
        formData.borrowType === 'Harian' && formData.loanSubType === 'Kelas'
          ? formData.className
          : null,
    };

    const response = await fetch('/api/borrowings', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        await getApiErrorMessage(response, 'Gagal menyimpan peminjaman.')
      );
    }
  };

  const updateBorrowingBatch = async (batch: BatchItem) => {
    if (!selectedMember) return;

    await Promise.all(
      batch.items.map(async (item) => {
        const response = await fetch(`/api/borrowings/${item.id}`, {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            member_id: selectedMember.id,
            borrow_date: formData.borrowDate,
            due_date: formData.returnDate,
            return_time: formData.returnTime || null,
            loan_type: formData.borrowType,
            loan_sub_type: formData.loanSubType || null,
            quantity:
              formData.borrowType === 'Harian' &&
              formData.loanSubType === 'Kelas'
                ? formData.quantity
                : 1,
            class_name:
              formData.borrowType === 'Harian' &&
              formData.loanSubType === 'Kelas'
                ? formData.className
                : null,
          }),
        });

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, 'Gagal memperbarui peminjaman.')
          );
        }
      })
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const selectedBooks = bookInputs
      .filter((input) => input.selected)
      .map((input) => input.selected!);

    if (!validateBorrowing(selectedBooks) || !selectedMember) {
      return;
    }

    setIsSaving(true);

    try {
      if (editMode && editingBatchId) {
        const batch = allBatches.find((item) => item.batchId === editingBatchId);

        if (!batch) {
          throw new Error('Data batch tidak ditemukan.');
        }

        await updateBorrowingBatch(batch);
        setSuccessMsg('Peminjaman berhasil diperbarui!');
      } else {
        await createBorrowing(selectedBooks);
        setSuccessMsg(
          `Peminjaman berhasil dibuat untuk ${selectedMember.name} (${selectedBooks.length} buku)!`
        );
      }

      handleReset();
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      setToast({
        message: error.message || 'Gagal menyimpan transaksi.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (batch: BatchItem) => {
    const member = membersData.find((item) => item.id === batch.memberId);

    if (!member) {
      setToast({ message: 'Data anggota tidak ditemukan.', type: 'error' });
      return;
    }

    const inputs = batch.items.map((item) => ({
      id: String(item.id),
      search: `${item.bookTitle} (${item.bookNumber})`,
      selected: {
        id: Number(item.bookCopyId ?? item.id),
        number: item.bookNumber,
        title: item.bookTitle,
        category: item.bookCategory ?? '',
        status: 'Tersedia',
      },
    }));

    setSelectedMember(member);
    setMemberSearch(member.name);
    setBookInputs(
      inputs.length > 0 ? inputs : [{ id: '1', search: '', selected: null }]
    );

    setFormData({
      borrowDate: batch.borrowDate,
      borrowTime: batch.loanType === 'Harian' ? nowTime() : '',
      returnDate: batch.dueDate,
      returnTime: batch.returnTime,
      borrowType: batch.loanType,
      loanSubType: batch.loanSubType,
      className: batch.className,
      quantity: batch.quantity,
    });

    setEditMode(true);
    setEditingBatchId(batch.batchId);
    setShowModal(true);
  };

  const handleDelete = (batch: BatchItem) => {
    setDeleteDialog({
      isOpen: true,
      batchId: batch.batchId,
      memberName: batch.memberName,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.batchId) {
      return;
    }

    const batch = allBatches.find((item) => item.batchId === deleteDialog.batchId);

    if (!batch) {
      setDeleteDialog({ isOpen: false, batchId: null });
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all(
        batch.items.map(async (item) => {
          const response = await fetch(`/api/borrowings/${item.id}`, {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(
              await getApiErrorMessage(response, 'Gagal menghapus peminjaman.')
            );
          }
        })
      );

      setSuccessMsg('Peminjaman berhasil dihapus!');
      setDeleteDialog({ isOpen: false, batchId: null });
      await loadData();
    } catch (error: any) {
      setToast({
        message: error.message || 'Gagal menghapus transaksi.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateReturnBookState = (
    borrowingId: number,
    changes: Partial<ReturnBookState>
  ) => {
    setReturnBookStates((previous) => {
      const current =
        previous[borrowingId] ??
        (selectedBatchForReturn
          ? createReturnBookState(
              selectedBatchForReturn.items.find((item) => item.id === borrowingId)!,
              selectedBatchForReturn.status
            )
          : {
              condition: 'Bagus' as BookCondition,
              penaltyType: 'Buku Donasi' as PenaltyType,
              penaltyBookTitles: [createPenaltyBookInput()],
              notes: '',
            });

      return {
        ...previous,
        [borrowingId]: {
          ...current,
          ...changes,
        },
      };
    });
  };

  const handleReturnConditionChange = (
    borrowingId: number,
    condition: BookCondition
  ) => {
    setReturnBookStates((previous) => {
      const current = previous[borrowingId];
      const isLate = selectedBatchForReturn?.status === 'Terlambat';

      if (!current) {
        return previous;
      }

      return {
        ...previous,
        [borrowingId]: {
          ...current,
          condition,
          penaltyType:
            condition === 'Rusak' || condition === 'Hilang'
              ? 'Buku Pengganti'
              : isLate
              ? 'Buku Donasi'
              : current.penaltyType,
          penaltyBookTitles:
            current.penaltyBookTitles.length > 0
              ? current.penaltyBookTitles
              : [createPenaltyBookInput()],
        },
      };
    });
  };

  const updatePenaltyBookTitle = (
    borrowingId: number,
    inputId: string,
    title: string
  ) => {
    setReturnBookStates((previous) => {
      const current = previous[borrowingId];

      if (!current) {
        return previous;
      }

      return {
        ...previous,
        [borrowingId]: {
          ...current,
          penaltyBookTitles: current.penaltyBookTitles.map((input) =>
            input.id === inputId ? { ...input, title } : input
          ),
        },
      };
    });
  };

  const addPenaltyBookTitle = (borrowingId: number) => {
    setReturnBookStates((previous) => {
      const current = previous[borrowingId];

      if (!current) {
        return previous;
      }

      return {
        ...previous,
        [borrowingId]: {
          ...current,
          penaltyBookTitles: [
            ...current.penaltyBookTitles,
            createPenaltyBookInput(),
          ],
        },
      };
    });
  };

  const removePenaltyBookTitle = (borrowingId: number, inputId: string) => {
    setReturnBookStates((previous) => {
      const current = previous[borrowingId];

      if (!current || current.penaltyBookTitles.length <= 1) {
        return previous;
      }

      return {
        ...previous,
        [borrowingId]: {
          ...current,
          penaltyBookTitles: current.penaltyBookTitles.filter(
            (input) => input.id !== inputId
          ),
        },
      };
    });
  };

  const handleReturn = (batch: BatchItem) => {
    setSelectedBatchForReturn(batch);
    setReturnBookStates(createInitialReturnBookStates(batch));
    setReturnModal(true);
  };

  const handleReturnSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!selectedBatchForReturn) {
      return;
    }

    const isLate = selectedBatchForReturn.status === 'Terlambat';

    for (const item of selectedBatchForReturn.items) {
      const itemState =
        returnBookStates[item.id] ??
        createReturnBookState(item, selectedBatchForReturn.status);

      const needsPenalty =
        isLate ||
        itemState.condition === 'Rusak' ||
        itemState.condition === 'Hilang';

      const filledPenaltyTitles = itemState.penaltyBookTitles
        .map((input) => input.title.trim())
        .filter(Boolean);

      if (needsPenalty && filledPenaltyTitles.length === 0) {
        setToast({
          message: `Isi judul buku sanksi untuk ${item.bookTitle} terlebih dahulu!`,
          type: 'error',
        });
        return;
      }
    }

    setReturnConfirmDialog({
      isOpen: true,
    });
  };

  const confirmReturnSubmit = async () => {
    if (!selectedBatchForReturn) {
      return;
    }

    const isLate = selectedBatchForReturn.status === 'Terlambat';

    setReturnConfirmDialog({
      isOpen: false,
    });

    setIsSaving(true);

    try {
      let penaltyCount = 0;
      let penaltyBookCount = 0;

      await Promise.all(
        selectedBatchForReturn.items.map(async (item) => {
          const itemState =
            returnBookStates[item.id] ??
            createReturnBookState(item, selectedBatchForReturn.status);

          const needsPenalty =
            isLate ||
            itemState.condition === 'Rusak' ||
            itemState.condition === 'Hilang';

          const penaltyReason =
            itemState.condition === 'Rusak' || itemState.condition === 'Hilang'
              ? itemState.condition
              : 'Terlambat';

          const penaltyBookTitle = itemState.penaltyBookTitles
            .map((input) => input.title.trim())
            .filter(Boolean)
            .join(', ');

          const response = await fetch(`/api/borrowings/${item.id}/return`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              return_date: todayDate(),
              return_time: nowTime(),
              withPenalty: needsPenalty,
              reason: needsPenalty ? penaltyReason : null,
              penalty_type: needsPenalty ? itemState.penaltyType : null,
              penalty_book_title: needsPenalty ? penaltyBookTitle : null,
              notes: itemState.notes || null,
            }),
          });

          if (!response.ok) {
            throw new Error(
              await getApiErrorMessage(response, 'Gagal memproses pengembalian.')
            );
          }

          if (needsPenalty) {
            penaltyCount += 1;
            penaltyBookCount += itemState.penaltyBookTitles
              .map((input) => input.title.trim())
              .filter(Boolean).length;
          }

          if (needsPenalty && onAddPenalty) {
            onAddPenalty({
              id: Date.now() + item.id,
              borrowingId: item.id,
              date: todayDate(),
              memberId: item.memberId,
              memberName: item.memberName,
              bookNumber: item.bookNumber,
              bookTitle: item.bookTitle,
              loanType: item.loanType,
              reason: penaltyReason,
              penaltyType: itemState.penaltyType,
              penaltyBookTitle,
              notes: itemState.notes,
            });
          }
        })
      );

      setSuccessMsg(
        penaltyCount > 0
          ? `Pengembalian berhasil! ${penaltyCount} buku memiliki sanksi dengan ${penaltyBookCount} buku sanksi.`
          : 'Semua buku berhasil dikembalikan dalam kondisi baik!'
      );

      setReturnModal(false);
      setSelectedBatchForReturn(null);
      setReturnBookStates({});
      await loadData();
    } catch (error: any) {
      setToast({
        message: error.message || 'Gagal memproses pengembalian.',
        type: 'error',
      });
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

  const renderBookDropdown = (
    input: { id: string; search: string; selected: Book | null },
    filter?: (book: Book) => boolean
  ) => {
    const filtered = getFilteredBooksForInput(input.search).filter((book) =>
      filter ? filter(book) : true
    );

    if (
      showBookDropdownId !== input.id ||
      !input.search ||
      input.selected ||
      filtered.length === 0
    ) {
      return null;
    }

    return (
      <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {filtered.map((book) => (
          <button
            key={book.id}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleBookSelect(input.id, book)}
            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{book.title}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {book.number}
                </p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                {book.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderSelectedBook = (
    input: { id: string; search: string; selected: Book | null },
    showRemove = false
  ) => {
    if (!input.selected) {
      return null;
    }

    return (
      <div className="mt-3 bg-primary/5 p-3 rounded-lg border border-primary/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-primary text-white rounded-lg font-mono font-bold text-sm">
            {input.selected.number}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {input.selected.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {input.selected.category}
            </p>
          </div>
        </div>

        {showRemove && bookInputs.length > 1 && (
          <button
            type="button"
            onClick={() => removeBookInput(input.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>
    );
  };

  const renderBookInput = (
    input: { id: string; search: string; selected: Book | null },
    index: number,
    filter?: (book: Book) => boolean
  ) => {
    return (
      <div key={input.id} className="bg-muted/30 p-4 rounded-lg border border-border">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
            {index + 1}
          </div>

          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={input.search}
                onChange={(event) => {
                  updateBookInput(input.id, event.target.value, null);
                  setShowBookDropdownId(input.id);
                }}
                onFocus={() => setShowBookDropdownId(input.id)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Cari judul atau nomor buku..."
                required
                disabled={editMode}
              />

              {renderBookDropdown(input, filter)}
            </div>

            {renderSelectedBook(input, true)}

            {editMode && (
              <p className="text-xs text-muted-foreground mt-2">
                Saat edit, data buku tidak diubah. Yang diubah hanya anggota,
                tanggal, jenis peminjaman, kelas, dan jumlah.
              </p>
            )}
          </div>

          {bookInputs.length > 1 && !editMode && (
            <button
              type="button"
              onClick={() => removeBookInput(input.id)}
              className="flex-shrink-0 p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Hapus buku"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const selectedBookCount = bookInputs.filter((input) => input.selected).length;
  const isTahunanOrGuru = formData.borrowType === 'Tahunan' || formData.borrowType === 'Guru';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Peminjaman Buku
          </h1>
          <p className="text-muted-foreground">
            Kelola peminjaman buku perpustakaan
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
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Peminjaman Aktif</span>
            <BookCopy className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-semibold text-foreground">
            {borrowingData.length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total buku aktif</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Tepat Waktu</span>
            <BookCopy className="w-5 h-5 text-[#6bbf8d]" />
          </div>
          <p className="text-3xl font-semibold text-foreground">
            {borrowingData.filter((item) => item.status === 'Aktif').length}
          </p>
          <p className="text-sm text-[#6bbf8d] mt-1">Belum jatuh tempo</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Terlambat</span>
            <BookCopy className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-semibold text-foreground">
            {borrowingData.filter((item) => item.status === 'Terlambat').length}
          </p>
          <p className="text-sm text-red-600 mt-1">Perlu tindakan</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border">
        <h3 className="font-semibold text-foreground mb-4">
          Daftar Peminjaman Aktif
        </h3>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari berdasarkan nama anggota, nomor buku, atau judul buku..."
              className="w-full pl-11 pr-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <select
            value={loanTypeFilter}
            onChange={(event) => setLoanTypeFilter(event.target.value)}
            className="w-full md:w-auto px-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium md:min-w-[180px]"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Harian">Harian</option>
            <option value="Mingguan">Mingguan</option>
            <option value="Tahunan">Tahunan</option>
            <option value="Guru">Guru</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                No Transaksi
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
              {paginatedBatches.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {isLoading
                      ? 'Memuat data peminjaman...'
                      : searchTerm || loanTypeFilter !== 'Semua'
                      ? 'Tidak ada hasil pencarian'
                      : 'Belum ada peminjaman aktif'}
                  </td>
                </tr>
              )}

              {paginatedBatches.map((batch) => (
                <tr
                  key={batch.batchId}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                <td className="py-4 px-4 font-mono text-sm text-primary font-medium whitespace-nowrap">
                {batch.batchId.replace('BATCH', 'TRX-')}
                </td>
                  <td className="py-4 px-4">
                    <div>
                      <span className="font-medium text-foreground">
                        {batch.memberName}
                      </span>
                      {batch.loanType === 'Harian' &&
                        batch.loanSubType === 'Kelas' &&
                        batch.className && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({batch.className})
                          </span>
                        )}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    {batch.loanType === 'Harian' &&
                    batch.loanSubType === 'Kelas' ? (
                      <div className="flex items-center gap-2">
                        <BookCopy className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">
                            {batch.items[0].bookTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Jumlah:{' '}
                            <span className="font-bold text-primary">
                              {batch.quantity}
                            </span>{' '}
                            buku
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <BookCopy className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">
                          {batch.bookCount} buku
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        batch.loanType === 'Harian'
                          ? 'bg-[#fff3cc] text-[#9d7a2f]'
                          : batch.loanType === 'Mingguan'
                          ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                          : batch.loanType === 'Tahunan'
                          ? 'bg-[#f5c842]/20 text-[#9d7a2f]'
                          : 'bg-[#d4f1e3] text-[#2d8659]'
                      }`}
                    >
                      {batch.loanType}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {batch.borrowDate}
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {batch.loanType === 'Guru' ? '-' : batch.dueDate || '-'}
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        batch.status === 'Aktif'
                          ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDetailBatchId(batch.batchId)}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                        title="Lihat detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEdit(batch)}
                        className="p-2 hover:bg-accent text-muted-foreground rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(batch)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>

                      <button
                        onClick={() => handleReturn(batch)}
                        className="px-3 py-2 bg-[#6bbf8d] hover:bg-[#5fb587] text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Kembalikan
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
          <p>
            {filteredBatches.length === 0
              ? `Menampilkan 0 batch dari ${allBatches.length} batch total (${borrowingData.length} buku)`
              : `Menampilkan ${startItem}-${endItem} dari ${filteredBatches.length} batch (${filteredBookCount} buku) dari ${allBatches.length} batch total (${borrowingData.length} buku)`}
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
        title={editMode ? 'Edit Peminjaman Buku' : 'Peminjaman Buku Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Jenis Peminjaman
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['Harian', 'Mingguan', 'Tahunan', 'Guru'] as LoanType[]).map(
                (type) => (
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
                )
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              Durasi:{' '}
              {formData.borrowType === 'Harian'
                ? 'Hari yang sama, maksimal jam 17:00'
                : formData.borrowType === 'Mingguan'
                ? '7 hari'
                : formData.borrowType === 'Tahunan'
                ? '1 tahun'
                : 'Sampai dikembalikan'}
            </p>
          </div>

          {formData.borrowType === 'Harian' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Tipe Peminjaman
              </label>

              <div className="inline-flex bg-accent/50 rounded-lg p-1">
                {(['Pribadi', 'Kelas'] as LoanSubType[]).map((subType) => (
                  <button
                    key={subType}
                    type="button"
                    onClick={() => handleLoanSubTypeChange(subType)}
                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                      formData.loanSubType === subType
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {subType}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {formData.borrowType === 'Harian' &&
              formData.loanSubType === 'Kelas'
                ? 'Data Perwakilan'
                : 'Data Anggota'}
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
                    placeholder="Ketik nama atau kelas/NIP anggota..."
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

                {showMemberDropdown &&
                  memberSearch &&
                  filteredMembersForModal.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredMembersForModal.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleMemberSelect(member)}
                          className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-0"
                        >
                          <div className="flex items-center justify-between">
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

              {selectedMember && formData.borrowType === 'Mingguan' && (
                <div
                  className={`mt-3 p-4 rounded-lg border-2 ${
                    getActiveBorrowingsByType(selectedMember.id, 'Mingguan')
                      .length >= 2
                      ? 'bg-red-50 border-red-300'
                      : getActiveBorrowingsByType(selectedMember.id, 'Mingguan')
                          .length === 1
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-green-50 border-green-300'
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">
                    Status Peminjaman Mingguan
                  </p>
                  <p className="text-sm">
                    {
                      getActiveBorrowingsByType(selectedMember.id, 'Mingguan')
                        .length
                    }{' '}
                    / 2 buku sedang aktif
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookCopy className="w-5 h-5 text-primary" />
              Data Buku
            </h3>

            {formData.borrowType === 'Harian' &&
              formData.loanSubType === 'Pribadi' && (
                <div className="space-y-3">
                  <div className="bg-[#fff3cc]/20 p-3 rounded-lg border border-[#f5c842]/30">
                    <p className="text-sm text-[#9d7a2f]">
                      ℹ️ Peminjaman harian pribadi maksimal 1 buku.
                    </p>
                  </div>

                  {renderBookInput(bookInputs[0], 0)}
                </div>
              )}

            {formData.borrowType === 'Harian' &&
              formData.loanSubType === 'Kelas' && (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      ℹ️ Digunakan untuk peminjaman buku pelajaran kelas.
                    </p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Kelas yang Meminjam
                    </label>

                    <input
                      type="text"
                      value={formData.className}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          className: event.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Contoh: X-1, XI-IPA-2"
                      required
                    />
                  </div>

                  {renderBookInput(bookInputs[0], 0, isLessonBook)}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Jumlah Buku
                    </label>

                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          quantity: Math.max(1, Number(event.target.value) || 1),
                        })
                      }
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      min="1"
                      required
                    />
                  </div>
                </div>
              )}

            {formData.borrowType === 'Mingguan' && (
              <div className="space-y-3">
                {bookInputs.map((input, index) =>
                  renderBookInput(input, index, (book) => !isLessonBook(book))
                )}

                {bookInputs.length < 2 && !editMode && (
                  <button
                    type="button"
                    onClick={addBookInput}
                    className="w-full py-3 border-2 border-dashed border-primary/30 rounded-lg text-primary font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Tambah Buku
                  </button>
                )}

                <div className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{selectedBookCount}</span>{' '}
                    / 2 buku dipilih
                  </p>
                </div>
              </div>
            )}

            {isTahunanOrGuru && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {formData.borrowType === 'Tahunan'
                      ? 'Khusus buku Pelajaran/Pendidikan'
                      : 'Tidak ada batas jumlah buku'}
                  </p>

                  {!editMode && (
                    <button
                      type="button"
                      onClick={addBookInput}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Buku
                    </button>
                  )}
                </div>

                {bookInputs.map((input, index) =>
                  renderBookInput(
                    input,
                    index,
                    formData.borrowType === 'Tahunan'
                      ? isLessonBook
                      : undefined
                  )
                )}

                <div className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{selectedBookCount}</span>{' '}
                    dari{' '}
                    <span className="font-semibold">{bookInputs.length}</span>{' '}
                    buku dipilih
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Data Peminjaman
            </h3>

            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              {formData.borrowType === 'Harian' ? (
                <div className="space-y-4">
                  <div className="bg-[#fff3cc]/30 p-4 rounded-lg border border-[#f5c842]/30">
                    <p className="text-sm text-[#9d7a2f] font-medium mb-1">
                      Peminjaman Harian
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pinjam dan kembali di hari yang sama, maksimal jam 17:00.
                    </p>
                  </div>

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
                        Waktu Peminjaman
                      </label>
                      <input
                        type="time"
                        value={formData.borrowTime}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            borrowTime: event.target.value,
                          })
                        }
                        max="17:00"
                        className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Waktu Pengembalian
                      </label>
                      <input
                        type="time"
                        value={formData.returnTime}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            returnTime: event.target.value,
                          })
                        }
                        min={formData.borrowTime}
                        max="17:00"
                        className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : formData.borrowType === 'Guru' ? (
                <div>
                  <div className="bg-[#d4f1e3]/30 p-4 rounded-lg border border-[#6bbf8d]/30 mb-4">
                    <p className="text-sm text-[#2d8659] font-medium mb-1">
                      Peminjaman Guru
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tanggal pengembalian akan tercatat saat buku dikembalikan.
                    </p>
                  </div>

                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tanggal Peminjaman
                  </label>
                  <input
                    type="date"
                    value={formData.borrowDate}
                    onChange={(event) => handleBorrowDateChange(event.target.value)}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
              ) : (
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
              )}
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
              disabled={
                isSaving ||
                !selectedMember ||
                selectedBookCount === 0 ||
                (formData.borrowType === 'Harian' &&
                  formData.loanSubType === 'Pribadi' &&
                  (!formData.borrowTime || !formData.returnTime)) ||
                (formData.borrowType === 'Harian' &&
                  formData.loanSubType === 'Kelas' &&
                  (formData.quantity < 1 ||
                    !formData.borrowTime ||
                    !formData.returnTime ||
                    !formData.className))
              }
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Menyimpan...' : editMode ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {detailBatch && (
        <Modal
          isOpen={!!detailBatchId}
          onClose={() => setDetailBatchId(null)}
          title="Detail Peminjaman"
        >
          <div className="space-y-5">
            <div className="flex items-start gap-4 bg-primary/5 border border-primary/10 rounded-xl p-4">
              <div className="flex-1">
                <p className="text-base font-bold text-foreground">
                  {detailBatch.memberName}
                </p>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      detailBatch.loanType === 'Harian'
                        ? 'bg-[#fff3cc] text-[#9d7a2f]'
                        : detailBatch.loanType === 'Mingguan'
                        ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                        : detailBatch.loanType === 'Tahunan'
                        ? 'bg-[#f5c842]/20 text-[#9d7a2f]'
                        : 'bg-[#d4f1e3] text-[#2d8659]'
                    }`}
                  >
                    {detailBatch.loanType}
                  </span>

                  {detailBatch.loanSubType && (
                    <span className="text-xs text-muted-foreground">
                      {detailBatch.loanSubType}
                    </span>
                  )}

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      detailBatch.status === 'Aktif'
                        ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {detailBatch.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Tanggal Pinjam
                </p>
                <p className="font-semibold text-foreground text-sm">
                  {detailBatch.borrowDate}
                </p>
              </div>

              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Jatuh Tempo</p>
                <p className="font-semibold text-foreground text-sm">
                  {detailBatch.loanType === 'Guru'
                    ? 'Sampai dikembalikan'
                    : detailBatch.dueDate || '-'}
                </p>
              </div>

              {detailBatch.returnTime && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Waktu Kembali
                  </p>
                  <p className="font-semibold text-foreground text-sm">
                    {detailBatch.returnTime}
                  </p>
                </div>
              )}

              {detailBatch.loanType === 'Harian' &&
                detailBatch.loanSubType === 'Kelas' &&
                detailBatch.className && (
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Kelas</p>
                    <p className="font-semibold text-foreground text-sm">
                      {detailBatch.className}
                    </p>
                  </div>
                )}
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-accent/60 px-4 py-3 border-b border-border">
                <h4 className="font-semibold text-foreground text-sm">
                  Daftar Buku ({detailBatch.bookCount})
                </h4>
              </div>

              <div className="divide-y divide-border">
                {detailBatch.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className="text-xs text-muted-foreground w-5">
                      {index + 1}
                    </span>
                    <span className="font-mono font-bold text-sm text-primary w-20">
                      {item.bookNumber}
                    </span>
                    <span className="text-sm text-foreground">
                      {item.bookTitle}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setDetailBatchId(null)}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium text-sm"
              >
                Tutup
              </button>

              <button
                onClick={() => {
                  setDetailBatchId(null);
                  handleReturn(detailBatch);
                }}
                className="flex-1 px-6 py-3 bg-[#6bbf8d] hover:bg-[#5fb587] text-white rounded-lg font-medium transition-all shadow-sm text-sm"
              >
                Kembalikan Buku
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={returnModal}
        onClose={() => {
          setReturnModal(false);
          setSelectedBatchForReturn(null);
          setReturnBookStates({});
          setReturnConfirmDialog({ isOpen: false });
        }}
        title="Pengembalian Buku"
      >
        {selectedBatchForReturn && (
          <form onSubmit={handleReturnSubmit} className="space-y-5">
            <div className="bg-muted/40 border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Anggota</span>
                <p className="font-semibold text-foreground">
                  {selectedBatchForReturn.memberName}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">Jenis</span>
                <p className="font-semibold text-foreground">
                  {selectedBatchForReturn.loanType}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">Jumlah Buku</span>
                <p className="font-semibold text-foreground">
                  {selectedBatchForReturn.bookCount} buku
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
                    selectedBatchForReturn.status === 'Terlambat'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-[#e8f3ff] text-[#5a7ba0]'
                  }`}
                >
                  {selectedBatchForReturn.status}
                </span>
              </div>
            </div>

            {selectedBatchForReturn.status === 'Terlambat' && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Buku terlambat dikembalikan
                  </p>
                  <p className="text-sm text-red-700">
                    Semua buku pada transaksi ini akan membutuhkan pencatatan sanksi keterlambatan. Jika ada buku yang rusak atau hilang, pilih kondisi pada buku tersebut.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  Kondisi dan Sanksi per Buku
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Atur kondisi masing-masing buku. Jika satu peminjaman berisi beberapa buku, setiap buku bisa memiliki sanksi dan daftar buku sanksi sendiri.
                </p>
              </div>

              {selectedBatchForReturn.items.map((item, index) => {
                const itemState =
                  returnBookStates[item.id] ??
                  createReturnBookState(item, selectedBatchForReturn.status);

                const itemNeedsPenalty =
                  selectedBatchForReturn.status === 'Terlambat' ||
                  itemState.condition === 'Rusak' ||
                  itemState.condition === 'Hilang';

                const penaltyBookLabel =
                  itemState.penaltyType === 'Buku Donasi'
                    ? 'Judul Buku Donasi'
                    : 'Judul Buku Pengganti';

                return (
                  <div
                    key={item.id}
                    className="border border-border rounded-xl overflow-hidden bg-white"
                  >
                    <div className="bg-accent/50 px-4 py-3 border-b border-border flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {index + 1}. {item.bookTitle}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {item.bookNumber}
                        </p>
                      </div>

                      {itemNeedsPenalty && (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold whitespace-nowrap">
                          Perlu Sanksi
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Kondisi Buku
                        </label>

                        <div className="grid grid-cols-3 gap-3">
                          {(['Bagus', 'Rusak', 'Hilang'] as BookCondition[]).map(
                            (condition) => (
                              <button
                                key={condition}
                                type="button"
                                onClick={() =>
                                  handleReturnConditionChange(item.id, condition)
                                }
                                className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                                  itemState.condition === condition
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white border-border hover:bg-accent'
                                }`}
                              >
                                {condition}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {itemNeedsPenalty && (
                        <div className="border border-border rounded-xl overflow-hidden">
                          <div className="bg-muted/40 px-4 py-3 border-b border-border">
                            <h4 className="font-semibold text-foreground text-sm">
                              Sanksi Buku Ini
                            </h4>
                          </div>

                          <div className="p-4 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Jenis Sanksi
                              </label>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(['Buku Donasi', 'Buku Pengganti'] as PenaltyType[]).map(
                                  (type) => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() =>
                                        updateReturnBookState(item.id, {
                                          penaltyType: type,
                                        })
                                      }
                                      className={`px-4 py-3 rounded-lg text-left transition-all border ${
                                        itemState.penaltyType === type
                                          ? 'bg-primary text-white border-primary shadow-sm'
                                          : 'bg-white border-border hover:bg-accent'
                                      }`}
                                    >
                                      <p className="font-semibold text-sm">{type}</p>
                                      <p
                                        className={`text-xs mt-0.5 ${
                                          itemState.penaltyType === type
                                            ? 'opacity-80'
                                            : 'text-muted-foreground'
                                        }`}
                                      >
                                        {type === 'Buku Donasi'
                                          ? 'Terlambat mengembalikan'
                                          : 'Buku rusak / hilang'}
                                      </p>
                                    </button>
                                  )
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <label className="block text-sm font-medium text-foreground">
                                  {penaltyBookLabel}
                                </label>

                                <button
                                  type="button"
                                  onClick={() => addPenaltyBookTitle(item.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Tambah Buku Sanksi
                                </button>
                              </div>

                              <div className="space-y-2">
                                {itemState.penaltyBookTitles.map((input, inputIndex) => (
                                  <div key={input.id} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={input.title}
                                      onChange={(event) =>
                                        updatePenaltyBookTitle(
                                          item.id,
                                          input.id,
                                          event.target.value
                                        )
                                      }
                                      className="flex-1 px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                      placeholder={
                                        itemState.penaltyType === 'Buku Donasi'
                                          ? `Judul buku donasi ${inputIndex + 1}`
                                          : `Contoh: ${item.bookTitle}`
                                      }
                                      required
                                    />

                                    {itemState.penaltyBookTitles.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removePenaltyBookTitle(item.id, input.id)
                                        }
                                        className="px-3 rounded-lg border border-border hover:bg-red-50 transition-colors"
                                        title="Hapus buku sanksi"
                                      >
                                        <X className="w-4 h-4 text-red-600" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Catatan untuk Sanksi (Opsional)
                              </label>

                              <textarea
                                value={itemState.notes}
                                onChange={(event) =>
                                  updateReturnBookState(item.id, {
                                    notes: event.target.value,
                                  })
                                }
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                                placeholder="Contoh: Sampul rusak, halaman hilang, atau keterangan lain..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setReturnModal(false);
                  setReturnBookStates({});
                  setReturnConfirmDialog({ isOpen: false });
                }}
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

      <ConfirmDialog
        isOpen={returnConfirmDialog.isOpen}
        onClose={() => setReturnConfirmDialog({ isOpen: false })}
        onConfirm={confirmReturnSubmit}
        title="Konfirmasi Pengembalian"
        message={
          selectedBatchForReturn
            ? `Yakin ingin memproses pengembalian ${selectedBatchForReturn.bookCount} buku atas nama ${selectedBatchForReturn.memberName}? Setelah diproses, status buku akan berubah menjadi dikembalikan.`
            : 'Yakin ingin memproses pengembalian buku ini?'
        }
        confirmText={isSaving ? 'Memproses...' : 'Ya'}
        cancelText="Batal"
        type="info"
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, batchId: null })}
        onConfirm={confirmDelete}
        title="Hapus Peminjaman"
        message={`Yakin ingin menghapus semua transaksi peminjaman milik ${
          deleteDialog.memberName ?? 'anggota ini'
        }? Buku akan dikembalikan ke status Tersedia.`}
        confirmText={isSaving ? 'Menghapus...' : 'Hapus'}
        cancelText="Batal"
        type="danger"
      />

      <SuccessModal
        isOpen={!!successMsg}
        message={successMsg}
        onClose={() => setSuccessMsg('')}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
