import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  BookCopy,
  User,
  X,
  Calendar,
  Edit2,
  Trash2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  borrowingData as mockBorrowingData,
  membersData as mockMembersData,
  booksData as mockBooksData,
  type Penalty,
} from '../data/mockData';

const ITEMS_PER_PAGE = 10;

type LoanType = 'Harian' | 'Mingguan' | 'Tahunan' | 'Guru';
type LoanSubType = 'Pribadi' | 'Kelas' | '';
type BookCondition = 'Bagus' | 'Rusak' | 'Hilang';
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
  batchId: string;
  memberId?: number;
  memberName: string;
  bookTitle: string;
  bookNumber: string;
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

interface TransactionsProps {
  onAddPenalty: (record: Penalty) => void;
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

const isLessonBook = (book: Book) => {
  return book.category === 'Pelajaran' || book.category === 'Pendidikan';
};

const membersData: Member[] = mockMembersData.map((member: any) => ({
  id: member.id,
  name: member.name,
  type: member.type,
  classNip: member.classNip,
}));

const booksData: Book[] = mockBooksData.map((book: any) => ({
  id: book.id,
  number: book.number,
  title: book.title,
  category: book.category,
  status: book.status,
}));

const initialBorrowingData: BorrowingItem[] = mockBorrowingData
  .filter((item: any) => item.status === 'Aktif' || item.status === 'Terlambat')
  .map((item: any) => ({
    id: item.id,
    batchId: item.batchId ?? `BATCH-${item.id}`,
    memberId: item.memberId,
    memberName: item.memberName,
    bookTitle: item.bookTitle,
    bookNumber: item.bookNumber,
    borrowDate: item.borrowDate,
    dueDate: item.dueDate,
    returnTime: item.returnTime || '',
    status: item.status,
    loanType: item.loanType ?? 'Mingguan',
    loanSubType: item.loanSubType || '',
    quantity: item.quantity || 1,
    className: item.className || '',
  }));

const getInitialFormData = () => ({
  borrowDate: todayDate(),
  borrowTime: '',
  returnDate: '',
  returnTime: '',
  borrowType: 'Harian' as LoanType,
  loanSubType: 'Pribadi' as LoanSubType,
  className: '',
  quantity: 1,
});

export function Transactions({
  onAddPenalty,
  quickLoanType,
  onQuickLoanConsumed,
}: TransactionsProps) {
  const [borrowingData, setBorrowingData] = useState<BorrowingItem[]>(initialBorrowingData);
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

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    batchId: string | null;
    bookTitle?: string;
    memberName?: string;
  }>({
    isOpen: false,
    batchId: null,
  });

  const [selectedBatchForReturn, setSelectedBatchForReturn] = useState<BatchItem | null>(null);
  const [bookCondition, setBookCondition] = useState<BookCondition>('Bagus');
  const [penaltyData, setPenaltyData] = useState({
    type: 'Buku Donasi' as PenaltyType,
    bookTitle: '',
    notes: '',
  });

  const [editMode, setEditMode] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [bookInputs, setBookInputs] = useState<
    { id: string; search: string; selected: Book | null }[]
  >([{ id: '1', search: '', selected: null }]);

  const [showBookDropdownId, setShowBookDropdownId] = useState<string | null>(null);
  const [formData, setFormData] = useState(getInitialFormData());

  const calculateReturnDate = (borrowDate: string, type: string) => {
    if (type === 'Harian') {
      return borrowDate;
    }

    if (type === 'Guru') {
      return '';
    }

    const date = new Date(`${borrowDate}T00:00:00`);

    if (type === 'Mingguan') {
      date.setDate(date.getDate() + 7);
    }

    if (type === 'Tahunan') {
      date.setFullYear(date.getFullYear() + 1);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

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
      loanType: items[0].loanType,
      loanSubType: items[0].loanSubType,
      className: items[0].className,
      quantity: items[0].quantity,
      borrowDate: items[0].borrowDate,
      dueDate: items[0].dueDate,
      returnTime: items[0].returnTime,
      status: items.some((item) => item.status === 'Terlambat') ? 'Terlambat' : items[0].status,
      bookCount: items.length,
    }));
  }, [groupedBorrowing]);

  const filteredBatches = useMemo(() => {
    return allBatches
      .filter((batch) => {
        const lowerSearch = searchTerm.toLowerCase();

        const matchesSearch =
          batch.memberName.toLowerCase().includes(lowerSearch) ||
          batch.items.some((item) => item.bookTitle.toLowerCase().includes(lowerSearch)) ||
          batch.items.some((item) => item.bookNumber.toLowerCase().includes(lowerSearch));

        const matchesLoanType =
          loanTypeFilter === 'Semua' || batch.loanType === loanTypeFilter;

        return matchesSearch && matchesLoanType;
      })
      .sort((a, b) => {
        if (a.status === 'Terlambat' && b.status !== 'Terlambat') return -1;
        if (a.status !== 'Terlambat' && b.status === 'Terlambat') return 1;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
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

  const detailBatch = useMemo(() => {
    return allBatches.find((batch) => batch.batchId === detailBatchId) ?? null;
  }, [allBatches, detailBatchId]);

  const filteredMembersForModal = membersData.filter((member) => {
    return (
      member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.classNip.toLowerCase().includes(memberSearch.toLowerCase())
    );
  });

  const getFilteredBooksForInput = (searchText: string) => {
    return booksData.filter((book) => {
      return (
        book.status === 'Tersedia' &&
        (book.title.toLowerCase().includes(searchText.toLowerCase()) ||
          book.number.toLowerCase().includes(searchText.toLowerCase()))
      );
    });
  };

  const getActiveBorrowingsByType = (memberName: string, loanType: string) => {
    return borrowingData.filter((item) => {
      return (
        item.memberName === memberName &&
        item.loanType === loanType &&
        item.status === 'Aktif'
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
    updateBookInput(inputId, book.title, book);
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
        setToast({ message: 'Peminjaman mingguan maksimal 2 buku!', type: 'error' });
        return false;
      }

      const activeMingguan = getActiveBorrowingsByType(
        selectedMember.name,
        'Mingguan'
      );

      if (!editMode && activeMingguan.length + selectedBooks.length > 2) {
        setToast({
          message: `${selectedMember.name} sudah meminjam ${activeMingguan.length} buku mingguan. Maksimal 2 buku aktif!`,
          type: 'error',
        });
        return false;
      }

      const lessonBooks = selectedBooks.filter((book) => isLessonBook(book));
      if (lessonBooks.length > 0) {
        setToast({
          message: 'Peminjaman mingguan tidak bisa untuk buku Pelajaran/Pendidikan. Gunakan tipe Tahunan.',
          type: 'error',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const selectedBooks = bookInputs
      .filter((input) => input.selected)
      .map((input) => input.selected!);

    if (!validateBorrowing(selectedBooks) || !selectedMember) {
      return;
    }

    const batchId = editMode && editingBatchId ? editingBatchId : `BATCH${Date.now()}`;

    let newBorrowings: BorrowingItem[] = [];

    if (formData.borrowType === 'Harian' && formData.loanSubType === 'Kelas') {
      const book = selectedBooks[0];

      newBorrowings = [
        {
          id: Date.now(),
          batchId,
          memberId: selectedMember.id,
          memberName: selectedMember.name,
          bookTitle: book.title,
          bookNumber: `${book.number}-${formData.quantity}`,
          borrowDate: formData.borrowDate,
          dueDate: formData.returnDate,
          returnTime: formData.returnTime,
          status: 'Aktif',
          loanType: formData.borrowType,
          loanSubType: formData.loanSubType,
          className: formData.className,
          quantity: formData.quantity,
        },
      ];
    } else {
      newBorrowings = selectedBooks.map((book, index) => ({
        id: Date.now() + index,
        batchId,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        bookTitle: book.title,
        bookNumber: book.number,
        borrowDate: formData.borrowDate,
        dueDate: formData.returnDate,
        returnTime: formData.returnTime,
        status: 'Aktif',
        loanType: formData.borrowType,
        loanSubType: formData.loanSubType,
        className: formData.loanSubType === 'Kelas' ? formData.className : '',
        quantity: 1,
      }));
    }

    if (editMode && editingBatchId) {
      setBorrowingData((previous) => [
        ...previous.filter((item) => item.batchId !== editingBatchId),
        ...newBorrowings,
      ]);
      setSuccessMsg('Peminjaman berhasil diperbarui!');
    } else {
      setBorrowingData((previous) => [...previous, ...newBorrowings]);
      setSuccessMsg(
        `Peminjaman berhasil dibuat untuk ${selectedMember.name} (${selectedBooks.length} buku)!`
      );
    }

    handleReset();
    setShowModal(false);
  };

  const handleEdit = (batch: BatchItem) => {
    const member = membersData.find((item) => item.name === batch.memberName);

    if (!member) {
      setToast({ message: 'Data anggota tidak ditemukan.', type: 'error' });
      return;
    }

    const inputs = batch.items.map((item) => {
      const book = booksData.find((data) => data.number === item.bookNumber.split('-')[0]);

      return {
        id: String(item.id),
        search: book?.title ?? item.bookTitle,
        selected: book ?? null,
      };
    });

    setSelectedMember(member);
    setMemberSearch(member.name);
    setBookInputs(inputs.length > 0 ? inputs : [{ id: '1', search: '', selected: null }]);

    setFormData({
      borrowDate: batch.borrowDate,
      borrowTime: batch.loanType === 'Harian' ? batch.items[0].returnTime : '',
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
      bookTitle: batch.items[0].bookTitle,
      memberName: batch.memberName,
    });
  };

  const confirmDelete = () => {
    if (!deleteDialog.batchId) {
      return;
    }

    setBorrowingData((previous) =>
      previous.filter((item) => item.batchId !== deleteDialog.batchId)
    );

    setSuccessMsg('Peminjaman berhasil dihapus!');
    setDeleteDialog({ isOpen: false, batchId: null });
  };

  const handleReturn = (batch: BatchItem) => {
    setSelectedBatchForReturn(batch);
    setBookCondition('Bagus');
    setPenaltyData({
      type: batch.status === 'Terlambat' ? 'Buku Donasi' : 'Buku Donasi',
      bookTitle: '',
      notes: '',
    });
    setReturnModal(true);
  };

  const handleReturnSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedBatchForReturn) {
      return;
    }

    const isLate = selectedBatchForReturn.status === 'Terlambat';
    const needsPenalty =
      isLate || bookCondition === 'Rusak' || bookCondition === 'Hilang';

    if (needsPenalty && !penaltyData.bookTitle.trim()) {
      setToast({ message: 'Isi judul buku sanksi terlebih dahulu!', type: 'error' });
      return;
    }

    if (needsPenalty) {
      selectedBatchForReturn.items.forEach((item) => {
        onAddPenalty({
          id: Date.now() + item.id,
          borrowingId: item.id,
          date: todayDate(),
          memberId: item.memberId,
          memberName: item.memberName,
          bookNumber: item.bookNumber,
          bookTitle: item.bookTitle,
          loanType: item.loanType,
          reason: isLate ? 'Terlambat' : bookCondition,
          penaltyType: penaltyData.type,
          penaltyBookTitle: penaltyData.bookTitle,
          notes: penaltyData.notes,
        });
      });
    }

    setBorrowingData((previous) =>
      previous.filter((item) => item.batchId !== selectedBatchForReturn.batchId)
    );

    setSuccessMsg(
      needsPenalty
        ? `Pengembalian berhasil! Sanksi: ${penaltyData.type} (${penaltyData.bookTitle})`
        : 'Buku berhasil dikembalikan dalam kondisi baik!'
    );

    setReturnModal(false);
    setSelectedBatchForReturn(null);
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
            onClick={() => handleBookSelect(input.id, book)}
            className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{book.title}</p>
                <p className="text-sm text-muted-foreground font-mono">{book.number}</p>
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
            <p className="text-xs text-muted-foreground">{input.selected.category}</p>
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
              />

              {renderBookDropdown(input, filter)}
            </div>

            {renderSelectedBook(input)}
          </div>

          {bookInputs.length > 1 && (
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
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
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Peminjaman Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Peminjaman Aktif</span>
            <BookCopy className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-semibold text-foreground">
            {borrowingData.length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total saat ini</p>
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

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
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
            className="px-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium min-w-[180px]"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Harian">Harian</option>
            <option value="Mingguan">Mingguan</option>
            <option value="Tahunan">Tahunan</option>
            <option value="Guru">Guru</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
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
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    {searchTerm || loanTypeFilter !== 'Semua'
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
                    {batch.loanType === 'Harian' && batch.loanSubType === 'Kelas' ? (
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      batch.loanType === 'Harian'
                        ? 'bg-[#fff3cc] text-[#9d7a2f]'
                        : batch.loanType === 'Mingguan'
                        ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                        : batch.loanType === 'Tahunan'
                        ? 'bg-[#f5c842]/20 text-[#9d7a2f]'
                        : 'bg-[#d4f1e3] text-[#2d8659]'
                    }`}>
                      {batch.loanType}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {batch.borrowDate}
                  </td>

                  <td className="py-4 px-4 text-muted-foreground">
                    {batch.loanType === 'Guru' ? '-' : batch.dueDate}
                  </td>

                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      batch.status === 'Aktif'
                        ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                        : 'bg-red-100 text-red-700'
                    }`}>
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

            <div className="grid grid-cols-4 gap-3">
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
              {formData.borrowType === 'Harian' && formData.loanSubType === 'Kelas'
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
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                    className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Ketik nama atau kelas/NIP anggota..."
                    required
                  />

                  {selectedMember && (
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

                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              member.type === 'Guru'
                                ? 'bg-[#fff3cc] text-[#9d7a2f]'
                                : 'bg-[#e8f3ff] text-[#5a7ba0]'
                            }`}>
                              {member.type}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
              </div>

              {selectedMember && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">No Anggota</p>
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
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedMember.type === 'Guru'
                        ? 'bg-[#fff3cc] text-[#9d7a2f]'
                        : 'bg-[#e8f3ff] text-[#5a7ba0]'
                    }`}>
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
                <div className={`mt-3 p-4 rounded-lg border-2 ${
                  getActiveBorrowingsByType(selectedMember.name, 'Mingguan').length >= 2
                    ? 'bg-red-50 border-red-300'
                    : getActiveBorrowingsByType(selectedMember.name, 'Mingguan').length === 1
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-green-50 border-green-300'
                }`}>
                  <p className="text-sm font-semibold mb-1">
                    Status Peminjaman Mingguan
                  </p>
                  <p className="text-sm">
                    {getActiveBorrowingsByType(selectedMember.name, 'Mingguan').length} / 2 buku sedang aktif
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

            {formData.borrowType === 'Harian' && formData.loanSubType === 'Pribadi' && (
              <div className="space-y-3">
                <div className="bg-[#fff3cc]/20 p-3 rounded-lg border border-[#f5c842]/30">
                  <p className="text-sm text-[#9d7a2f]">
                    ℹ️ Peminjaman harian pribadi maksimal 1 buku.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Pilih Buku
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={bookInputs[0]?.search || ''}
                      onChange={(event) => {
                        updateBookInput(
                          bookInputs[0]?.id || '1',
                          event.target.value,
                          null
                        );
                        setShowBookDropdownId(bookInputs[0]?.id || '1');
                      }}
                      onFocus={() => setShowBookDropdownId(bookInputs[0]?.id || '1')}
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Cari judul atau nomor buku..."
                      required
                    />

                    {renderBookDropdown(bookInputs[0])}
                  </div>

                  {renderSelectedBook(bookInputs[0])}
                </div>
              </div>
            )}

            {formData.borrowType === 'Harian' && formData.loanSubType === 'Kelas' && (
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    ℹ️ Digunakan untuk peminjaman buku pelajaran kelas.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Kelas yang Meminjam
                    </label>

                    <input
                      type="text"
                      value={formData.className}
                      onChange={(event) =>
                        setFormData({ ...formData, className: event.target.value })
                      }
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Contoh: X-1, XI-IPA-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Pilih Buku Pelajaran
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={bookInputs[0]?.search || ''}
                        onChange={(event) => {
                          updateBookInput(
                            bookInputs[0]?.id || '1',
                            event.target.value,
                            null
                          );
                          setShowBookDropdownId(bookInputs[0]?.id || '1');
                        }}
                        onFocus={() => setShowBookDropdownId(bookInputs[0]?.id || '1')}
                        className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Cari buku pelajaran..."
                        required
                      />

                      {renderBookDropdown(bookInputs[0], isLessonBook)}
                    </div>

                    {renderSelectedBook(bookInputs[0])}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Jumlah Buku
                    </label>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            quantity: Math.max(1, formData.quantity - 1),
                          })
                        }
                        className="w-10 h-10 flex items-center justify-center bg-accent hover:bg-accent/70 border border-border rounded-lg transition-colors"
                      >
                        <span className="text-xl font-bold text-foreground">−</span>
                      </button>

                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            quantity: Math.max(1, Number(event.target.value) || 1),
                          })
                        }
                        className="flex-1 px-4 py-3 bg-input-background border border-border rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        min="1"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            quantity: formData.quantity + 1,
                          })
                        }
                        className="w-10 h-10 flex items-center justify-center bg-accent hover:bg-accent/70 border border-border rounded-lg transition-colors"
                      >
                        <span className="text-xl font-bold text-foreground">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.borrowType === 'Mingguan' && (
              <div className="space-y-3">
                {bookInputs.map((input, index) =>
                  renderBookInput(input, index, (book) => !isLessonBook(book))
                )}

                {bookInputs.length < 2 && (
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
                    <span className="font-semibold">{selectedBookCount}</span> / 2 buku dipilih
                  </p>
                </div>
              </div>
            )}

            {(formData.borrowType === 'Tahunan' || formData.borrowType === 'Guru') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {formData.borrowType === 'Tahunan'
                      ? 'Khusus buku Pelajaran/Pendidikan'
                      : 'Tidak ada batas jumlah buku'}
                  </p>

                  <button
                    type="button"
                    onClick={addBookInput}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Buku
                  </button>
                </div>

                {bookInputs.map((input, index) =>
                  renderBookInput(
                    input,
                    index,
                    formData.borrowType === 'Tahunan' ? isLessonBook : undefined
                  )
                )}

                <div className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{selectedBookCount}</span> dari{' '}
                    <span className="font-semibold">{bookInputs.length}</span> buku dipilih
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
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
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        borrowDate: event.target.value,
                        returnDate: '',
                      })
                    }
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                handleReset();
              }}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={
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
              {editMode ? 'Update' : 'Simpan'}
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
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    detailBatch.loanType === 'Harian'
                      ? 'bg-[#fff3cc] text-[#9d7a2f]'
                      : detailBatch.loanType === 'Mingguan'
                      ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                      : detailBatch.loanType === 'Tahunan'
                      ? 'bg-[#f5c842]/20 text-[#9d7a2f]'
                      : 'bg-[#d4f1e3] text-[#2d8659]'
                  }`}>
                    {detailBatch.loanType}
                  </span>

                  {detailBatch.loanSubType && detailBatch.loanType !== 'Mingguan' && (
                    <span className="text-xs text-muted-foreground">
                      {detailBatch.loanSubType}
                    </span>
                  )}

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    detailBatch.status === 'Aktif'
                      ? 'bg-[#e8f3ff] text-[#5a7ba0]'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {detailBatch.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Tanggal Pinjam</p>
                <p className="font-semibold text-foreground text-sm">
                  {detailBatch.borrowDate}
                </p>
              </div>

              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Jatuh Tempo</p>
                <p className="font-semibold text-foreground text-sm">
                  {detailBatch.loanType === 'Guru'
                    ? 'Tidak terbatas'
                    : detailBatch.dueDate}
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
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-muted-foreground w-5">
                      {index + 1}
                    </span>
                    <span className="font-mono font-bold text-sm text-primary w-20">
                      {item.bookNumber}
                    </span>
                    <span className="text-sm text-foreground">{item.bookTitle}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
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
        }}
        title="Pengembalian Buku"
      >
        {selectedBatchForReturn && (
          <form onSubmit={handleReturnSubmit} className="space-y-5">
            <div className="bg-muted/40 border border-border rounded-xl p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
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
                <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
                  selectedBatchForReturn.status === 'Terlambat'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-[#e8f3ff] text-[#5a7ba0]'
                }`}>
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
                    Sistem akan mencatat sanksi pengembalian.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kondisi Buku
              </label>

              <div className="grid grid-cols-3 gap-3">
                {(['Bagus', 'Rusak', 'Hilang'] as BookCondition[]).map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => {
                      setBookCondition(condition);
                      if (condition === 'Rusak' || condition === 'Hilang') {
                        setPenaltyData({
                          ...penaltyData,
                          type: 'Buku Pengganti',
                        });
                      }
                    }}
                    className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                      bookCondition === condition
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-border hover:bg-accent'
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            {(selectedBatchForReturn.status === 'Terlambat' ||
              bookCondition === 'Rusak' ||
              bookCondition === 'Hilang') && (
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

                    <div className="grid grid-cols-2 gap-3">
                      {(['Buku Donasi', 'Buku Pengganti'] as PenaltyType[]).map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setPenaltyData({
                                ...penaltyData,
                                type,
                              })
                            }
                            className={`px-4 py-3 rounded-lg text-left transition-all border ${
                              penaltyData.type === type
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white border-border hover:bg-accent'
                            }`}
                          >
                            <p className="font-semibold text-sm">{type}</p>
                            <p className={`text-xs mt-0.5 ${
                              penaltyData.type === type
                                ? 'opacity-80'
                                : 'text-muted-foreground'
                            }`}>
                              {type === 'Buku Donasi'
                                ? 'Terlambat mengembalikan'
                                : 'Buku hilang / rusak'}
                            </p>
                          </button>
                        )
                      )}
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
                          : `Contoh: ${selectedBatchForReturn.items[0].bookTitle}`
                      }
                      required
                    />
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
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setReturnModal(false);
                  setSelectedBatchForReturn(null);
                }}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium text-sm"
              >
                Batal
              </button>

              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm text-sm"
              >
                Proses Pengembalian
              </button>
            </div>
          </form>
        )}
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <SuccessModal
        isOpen={!!successMsg}
        message={successMsg}
        onClose={() => setSuccessMsg('')}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, batchId: null })}
        onConfirm={confirmDelete}
        title="Hapus Peminjaman"
        message={`Yakin ingin menghapus peminjaman ${deleteDialog.bookTitle ? `"${deleteDialog.bookTitle}"` : 'ini'} atas nama ${deleteDialog.memberName ?? '-'}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
