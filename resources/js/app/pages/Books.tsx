import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Eye,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Book {
  id: number;
  bookMasterId: number;
  title: string;
  author: string;
  category: string;
  number: string;
  shelf: string;
  status: string;
  publishYear: string;
  acquisitionYear: string;
}

interface GroupedBook {
  bookMasterId: number;
  title: string;
  author: string;
  category: string;
  shelf: string;
  publishYear: string;
  total: number;
  tersedia: number;
  dipinjam: number;
  copies: Book[];
}

const ITEMS_PER_PAGE = 10;

const extractArray = (payload: any): any[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.books)) return data.books;
  if (Array.isArray(data?.bookMasters)) return data.bookMasters;
  if (Array.isArray(data?.book_masters)) return data.book_masters;

  return [];
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
  const result = await response.json().catch(() => null);

  return (
    result?.message ||
    result?.errors?.title?.[0] ||
    result?.errors?.author?.[0] ||
    result?.errors?.category?.[0] ||
    result?.errors?.shelf?.[0] ||
    result?.errors?.publish_year?.[0] ||
    result?.errors?.number?.[0] ||
    result?.errors?.acquisition_year?.[0] ||
    result?.errors?.status?.[0] ||
    fallback
  );
};

const normalizeBooks = (items: any[]): Book[] => {
  const books: Book[] = [];

  items.forEach((item) => {
    const bookMasterId = Number(
      item.id ??
        item.bookMasterId ??
        item.book_master_id ??
        item.bookMaster?.id ??
        item.book_master?.id ??
        0
    );

    const title =
      item.title ??
      item.bookTitle ??
      item.book_title ??
      item.bookMaster?.title ??
      item.book_master?.title ??
      '-';

    const author =
      item.author ??
      item.bookAuthor ??
      item.book_author ??
      item.bookMaster?.author ??
      item.book_master?.author ??
      '-';

    const category =
      item.category ??
      item.bookCategory ??
      item.book_category ??
      item.bookMaster?.category ??
      item.book_master?.category ??
      '-';

    const shelf =
      item.shelf ??
      item.rack ??
      item.location ??
      item.bookMaster?.shelf ??
      item.book_master?.shelf ??
      '-';

    const publishYear = String(
      item.publishYear ??
        item.publish_year ??
        item.bookMaster?.publishYear ??
        item.bookMaster?.publish_year ??
        item.book_master?.publishYear ??
        item.book_master?.publish_year ??
        ''
    );

    const copies = item.copies ?? item.bookCopies ?? item.book_copies ?? null;

    if (Array.isArray(copies) && copies.length > 0) {
      copies.forEach((copy: any) => {
        books.push({
          id: Number(copy.id),
          bookMasterId: Number(
            copy.bookMasterId ??
              copy.book_master_id ??
              copy.bookMaster?.id ??
              copy.book_master?.id ??
              bookMasterId
          ),
          title:
            item.title ??
            copy.title ??
            copy.bookMaster?.title ??
            copy.book_master?.title ??
            title,
          author:
            item.author ??
            copy.author ??
            copy.bookMaster?.author ??
            copy.book_master?.author ??
            author,
          category:
            item.category ??
            copy.category ??
            copy.bookMaster?.category ??
            copy.book_master?.category ??
            category,
          shelf:
            item.shelf ??
            copy.shelf ??
            copy.rack ??
            copy.bookMaster?.shelf ??
            copy.book_master?.shelf ??
            shelf,
          publishYear: String(
            item.publishYear ??
              item.publish_year ??
              copy.publishYear ??
              copy.publish_year ??
              copy.bookMaster?.publishYear ??
              copy.bookMaster?.publish_year ??
              copy.book_master?.publishYear ??
              copy.book_master?.publish_year ??
              publishYear
          ),
          number: copy.number ?? copy.bookNumber ?? copy.book_number ?? '-',
          status: copy.status ?? 'Tersedia',
          acquisitionYear: String(
            copy.acquisitionYear ?? copy.acquisition_year ?? ''
          ),
        });
      });

      return;
    }

    if (item.number || item.bookNumber || item.book_number) {
      books.push({
        id: Number(item.id),
        bookMasterId: Number(
          item.bookMasterId ?? item.book_master_id ?? bookMasterId
        ),
        title,
        author,
        category,
        shelf,
        publishYear,
        number: item.number ?? item.bookNumber ?? item.book_number ?? '-',
        status: item.status ?? 'Tersedia',
        acquisitionYear: String(
          item.acquisitionYear ?? item.acquisition_year ?? ''
        ),
      });
    }
  });

  return books.filter(
    (book) => book.id && book.bookMasterId && book.title !== '-'
  );
};

export function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [showBookModal, setShowBookModal] = useState(false);
  const [editingMasterBook, setEditingMasterBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    category: '',
    shelf: '',
    publishYear: '',
    number: '',
    acquisitionYear: '',
    status: 'Tersedia',
  });

  const [detailGroup, setDetailGroup] = useState<GroupedBook | null>(null);

  const [editingCopyId, setEditingCopyId] = useState<number | null>(null);
  const [copyEditForm, setCopyEditForm] = useState({
    number: '',
    acquisitionYear: '',
    status: 'Tersedia',
  });

  const [showAddCopyForm, setShowAddCopyForm] = useState(false);
  const [newCopyForm, setNewCopyForm] = useState({
    number: '',
    acquisitionYear: '',
    status: 'Tersedia',
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'group' | 'copy';
    title?: string;
    author?: string;
    bookMasterId?: number;
    copyId?: number;
  }>({
    isOpen: false,
    type: 'group',
  });

  const loadBooks = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/books', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Gagal memuat data buku.')
        );
      }

      const result = await response.json();
      const normalizedBooks = normalizeBooks(extractArray(result));

      setBooks(normalizedBooks);
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal memuat data buku.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const filteredBooks = books.filter((book) => {
    const keyword = searchTerm.toLowerCase();

    const matchesSearch =
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword) ||
      book.number.toLowerCase().includes(keyword);

    const matchesCategory =
      categoryFilter === 'Semua' || book.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const groupedBooks: GroupedBook[] = [];
  const bookMap = new Map<number, GroupedBook>();

  filteredBooks.forEach((book) => {
    if (bookMap.has(book.bookMasterId)) {
      const group = bookMap.get(book.bookMasterId)!;

      group.total++;

      if (book.status === 'Tersedia') {
        group.tersedia++;
      } else {
        group.dipinjam++;
      }

      group.copies.push(book);
    } else {
      const group: GroupedBook = {
        bookMasterId: book.bookMasterId,
        title: book.title,
        author: book.author,
        category: book.category,
        shelf: book.shelf,
        publishYear: book.publishYear,
        total: 1,
        tersedia: book.status === 'Tersedia' ? 1 : 0,
        dipinjam: book.status === 'Dipinjam' ? 1 : 0,
        copies: [book],
      };

      bookMap.set(book.bookMasterId, group);
      groupedBooks.push(group);
    }
  });

  groupedBooks.sort((a, b) =>
    a.title.localeCompare(b.title, 'id-ID', {
      sensitivity: 'base',
      numeric: true,
    })
  );

  groupedBooks.forEach((group) => {
    group.copies.sort((a, b) =>
      a.number.localeCompare(b.number, 'id-ID', {
        sensitivity: 'base',
        numeric: true,
      })
    );
  });

  const totalPages = Math.ceil(groupedBooks.length / ITEMS_PER_PAGE);

  const paginatedGroupedBooks = groupedBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startItem =
    groupedBooks.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, groupedBooks.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const syncedDetail = detailGroup
    ? groupedBooks.find(
        (group) => group.bookMasterId === detailGroup.bookMasterId
      ) ?? null
    : null;

  const openAddBook = () => {
    setEditingMasterBook(null);
    setBookForm({
      title: '',
      author: '',
      category: '',
      shelf: '',
      publishYear: '',
      number: '',
      acquisitionYear: '',
      status: 'Tersedia',
    });
    setShowBookModal(true);
    setErrorMsg('');
  };

  const openEditBook = (group: GroupedBook) => {
    const referenceBook = group.copies[0];

    setEditingMasterBook(referenceBook);
    setBookForm({
      title: referenceBook.title,
      author: referenceBook.author,
      category: referenceBook.category,
      shelf: referenceBook.shelf,
      publishYear: referenceBook.publishYear,
      number: referenceBook.number,
      acquisitionYear: referenceBook.acquisitionYear,
      status: referenceBook.status,
    });
    setShowBookModal(true);
    setErrorMsg('');
  };

  const submitBookForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      if (editingMasterBook) {
        const response = await fetch(
          `/api/book-masters/${editingMasterBook.bookMasterId}`,
          {
            method: 'PUT',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: bookForm.title,
              author: bookForm.author,
              category: bookForm.category,
              shelf: bookForm.shelf,
              publish_year: bookForm.publishYear,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(
              response,
              'Gagal memperbarui data buku.'
            )
          );
        }

        setSuccessMsg('Info buku berhasil diperbarui!');
      } else {
        const response = await fetch('/api/books', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: bookForm.title,
            author: bookForm.author,
            category: bookForm.category,
            shelf: bookForm.shelf,
            publish_year: bookForm.publishYear,
            number: bookForm.number,
            status: bookForm.status,
            acquisition_year: bookForm.acquisitionYear,
          }),
        });

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, 'Gagal menambahkan buku.')
          );
        }

        setSuccessMsg(`Buku "${bookForm.title}" berhasil ditambahkan!`);
      }

      setShowBookModal(false);
      await loadBooks();
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal menyimpan data buku.');
    } finally {
      setSaving(false);
    }
  };

  const startEditCopy = (copy: Book) => {
    setEditingCopyId(copy.id);
    setCopyEditForm({
      number: copy.number,
      acquisitionYear: copy.acquisitionYear,
      status: copy.status,
    });
    setShowAddCopyForm(false);
  };

  const saveCopyEdit = async (copyId: number) => {
    setSaving(true);
    setErrorMsg('');

    try {
      const response = await fetch(`/api/book-copies/${copyId}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: copyEditForm.number,
          acquisition_year: copyEditForm.acquisitionYear,
          status: copyEditForm.status,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Gagal memperbarui eksemplar.')
        );
      }

      setEditingCopyId(null);
      setSuccessMsg('Eksemplar berhasil diperbarui!');
      await loadBooks();
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal memperbarui eksemplar.');
    } finally {
      setSaving(false);
    }
  };

  const submitAddCopy = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!syncedDetail) {
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const response = await fetch(
        `/api/book-masters/${syncedDetail.bookMasterId}/copies`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: newCopyForm.number,
            acquisition_year: newCopyForm.acquisitionYear,
            status: newCopyForm.status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(response, 'Gagal menambahkan eksemplar.')
        );
      }

      setNewCopyForm({
        number: '',
        acquisitionYear: '',
        status: 'Tersedia',
      });
      setShowAddCopyForm(false);
      setSuccessMsg(`Eksemplar ${newCopyForm.number} berhasil ditambahkan!`);
      await loadBooks();
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal menambahkan eksemplar.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteGroup = (group: GroupedBook) => {
    const borrowedBooks = group.copies.filter(
      (book) => book.status === 'Dipinjam'
    );

    if (borrowedBooks.length > 0) {
      setDeleteErrorMsg(
        `Tidak dapat menghapus "${group.title}" — ${borrowedBooks.length} eksemplar masih berstatus Dipinjam (${borrowedBooks
          .map((book) => book.number)
          .join(', ')}).`
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: 'group',
      title: group.title,
      author: group.author,
      bookMasterId: group.bookMasterId,
    });
  };

  const confirmDeleteCopy = (copyId: number) => {
    const copy = books.find((book) => book.id === copyId);

    if (copy?.status === 'Dipinjam') {
      setDeleteErrorMsg(
        `Tidak dapat menghapus eksemplar ${copy.number} — buku sedang berstatus Dipinjam.`
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: 'copy',
      copyId,
    });
  };

  const executeDelete = async () => {
    setSaving(true);
    setErrorMsg('');

    try {
      if (confirmDialog.type === 'group' && confirmDialog.bookMasterId) {
        const response = await fetch(
          `/api/book-masters/${confirmDialog.bookMasterId}`,
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, 'Gagal menghapus buku.')
          );
        }

        setDetailGroup(null);
        setSuccessMsg(`"${confirmDialog.title}" berhasil dihapus!`);
      } else if (confirmDialog.type === 'copy' && confirmDialog.copyId) {
        const copy = books.find((book) => book.id === confirmDialog.copyId);

        const response = await fetch(
          `/api/book-copies/${confirmDialog.copyId}`,
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, 'Gagal menghapus eksemplar.')
          );
        }

        setSuccessMsg(`Eksemplar ${copy?.number} berhasil dihapus!`);
      }

      setConfirmDialog({
        isOpen: false,
        type: 'group',
      });

      await loadBooks();
    } catch (error: any) {
      setDeleteErrorMsg(error.message || 'Data tidak dapat dihapus.');
    } finally {
      setSaving(false);
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
            Data Buku
          </h1>
          <p className="text-muted-foreground">
            Kelola koleksi buku perpustakaan
          </p>
        </div>

        <button
          onClick={openAddBook}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Tambah Buku
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-border text-sm text-muted-foreground">
          Memuat data buku dari database...
        </div>
      )}

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border">
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari buku berdasarkan judul, pengarang, atau nomor buku..."
              className="w-full pl-11 pr-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="w-full md:w-auto px-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium md:min-w-[180px]"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Fiksi">Fiksi</option>
            <option value="Pendidikan">Pendidikan</option>
            <option value="Agama">Agama</option>
            <option value="Bahasa & Kamus">Bahasa & Kamus</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  No
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Judul Buku
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Pengarang
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Kategori
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Rak
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Th. Terbit
                </th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">
                  Stok
                </th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedGroupedBooks.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {searchTerm || categoryFilter !== 'Semua'
                      ? 'Tidak ada hasil pencarian'
                      : 'Belum ada data buku'}
                  </td>
                </tr>
              )}

              {paginatedGroupedBooks.map((group, index) => (
                <tr
                  key={group.bookMasterId}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="py-4 px-4 text-muted-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>

                  <td className="py-4 px-4">
                    <span className="font-medium text-foreground">
                      {group.title}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-muted-foreground text-sm">
                    {group.author}
                  </td>

                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                      {group.category}
                    </span>
                  </td>

                  <td className="py-4 px-4 font-mono text-sm text-muted-foreground">
                    {group.shelf}
                  </td>

                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {group.publishYear || '-'}
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="px-2 py-0.5 bg-[#d4f1e3] text-[#2d8659] rounded text-xs font-semibold">
                        {group.tersedia}
                      </span>
                      <span className="text-muted-foreground text-xs">/</span>
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs font-semibold">
                        {group.total}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setDetailGroup(group);
                          setEditingCopyId(null);
                          setShowAddCopyForm(false);
                        }}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                        title="Lihat detail & eksemplar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openEditBook(group)}
                        className="p-2 hover:bg-accent text-muted-foreground rounded-lg transition-colors"
                        title="Edit info buku"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => confirmDeleteGroup(group)}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                        title="Hapus semua eksemplar"
                      >
                        <Trash2 className="w-4 h-4" />
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
            {groupedBooks.length === 0
              ? `Menampilkan 0 judul (${filteredBooks.length} eksemplar)`
              : `Menampilkan ${startItem}-${endItem} dari ${groupedBooks.length} judul (${filteredBooks.length} eksemplar)`}
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
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title={editingMasterBook ? 'Edit Info Buku' : 'Tambah Buku Baru'}
      >
        <form onSubmit={submitBookForm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Judul Buku
              </label>
              <input
                type="text"
                value={bookForm.title}
                onChange={(event) =>
                  setBookForm({
                    ...bookForm,
                    title: event.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Masukkan judul buku"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Pengarang
              </label>
              <input
                type="text"
                value={bookForm.author}
                onChange={(event) =>
                  setBookForm({
                    ...bookForm,
                    author: event.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Masukkan nama pengarang"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kategori
              </label>
              <select
                value={bookForm.category}
                onChange={(event) =>
                  setBookForm({
                    ...bookForm,
                    category: event.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              >
                <option value="">Pilih Kategori</option>
                <option value="Fiksi">Fiksi</option>
                <option value="Pendidikan">Pendidikan</option>
                <option value="Agama">Agama</option>
                <option value="Bahasa & Kamus">Bahasa & Kamus</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Lokasi Rak
              </label>
              <input
                type="text"
                value={bookForm.shelf}
                onChange={(event) =>
                  setBookForm({
                    ...bookForm,
                    shelf: event.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Contoh: A-01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tahun Terbit
              </label>
              <input
                type="number"
                value={bookForm.publishYear}
                onChange={(event) =>
                  setBookForm({
                    ...bookForm,
                    publishYear: event.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Contoh: 2005"
                min="1900"
                max={new Date().getFullYear()}
                required
              />
            </div>

            {!editingMasterBook && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    No. Eksemplar Pertama
                  </label>
                  <input
                    type="text"
                    value={bookForm.number}
                    onChange={(event) =>
                      setBookForm({
                        ...bookForm,
                        number: event.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Contoh: BK013"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tahun Pengadaan Eksemplar Pertama
                  </label>
                  <input
                    type="number"
                    value={bookForm.acquisitionYear}
                    onChange={(event) =>
                      setBookForm({
                        ...bookForm,
                        acquisitionYear: event.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Contoh: 2024"
                    min="1900"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBookModal(false)}
              disabled={saving}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
                saving
                  ? 'bg-primary/60 text-white cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              {saving
                ? 'Menyimpan...'
                : editingMasterBook
                ? 'Simpan Perubahan'
                : 'Tambah Buku'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!syncedDetail}
        onClose={() => {
          setDetailGroup(null);
          setEditingCopyId(null);
          setShowAddCopyForm(false);
        }}
        title="Detail Buku"
      >
        {syncedDetail && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 bg-primary/5 border border-primary/10 rounded-xl p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground">
                  {syncedDetail.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {syncedDetail.author}
                </p>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                    {syncedDetail.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Rak {syncedDetail.shelf}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · Terbit {syncedDetail.publishYear || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/40 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {syncedDetail.total}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Total</p>
              </div>

              <div className="bg-[#d4f1e3]/60 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[#2d8659]">
                  {syncedDetail.tersedia}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tersedia
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {syncedDetail.dipinjam}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dipinjam
                </p>
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-accent/50 border-b border-border">
                <h4 className="font-semibold text-foreground text-sm">
                  Daftar Eksemplar
                </h4>

                <button
                  onClick={() => {
                    setShowAddCopyForm(true);
                    setEditingCopyId(null);
                    setNewCopyForm({
                      number: '',
                      acquisitionYear: '',
                      status: 'Tersedia',
                    });
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Eksemplar
                </button>
              </div>

              <div className="divide-y divide-border">
                {syncedDetail.copies.map((copy) => (
                  <div key={copy.id}>
                    {editingCopyId === copy.id ? (
                      <div className="px-4 py-3 bg-primary/5 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              No. Buku
                            </label>
                            <input
                              type="text"
                              value={copyEditForm.number}
                              onChange={(event) =>
                                setCopyEditForm({
                                  ...copyEditForm,
                                  number: event.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              Th. Pengadaan
                            </label>
                            <input
                              type="number"
                              value={copyEditForm.acquisitionYear}
                              onChange={(event) =>
                                setCopyEditForm({
                                  ...copyEditForm,
                                  acquisitionYear: event.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              min="1900"
                              max={new Date().getFullYear()}
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">
                              Status
                            </label>
                            <select
                              value={copyEditForm.status}
                              onChange={(event) =>
                                setCopyEditForm({
                                  ...copyEditForm,
                                  status: event.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                              <option value="Tersedia">Tersedia</option>
                              <option value="Dipinjam">Dipinjam</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingCopyId(null)}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <X className="w-3.5 h-3.5" />
                            Batal
                          </button>

                          <button
                            type="button"
                            onClick={() => saveCopyEdit(copy.id)}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono font-bold text-sm text-primary w-16">
                            {copy.number}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              copy.status === 'Tersedia'
                                ? 'bg-[#d4f1e3] text-[#2d8659]'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {copy.status}
                          </span>

                          {copy.acquisitionYear && (
                            <span className="text-xs text-muted-foreground">
                              Pengadaan {copy.acquisitionYear}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditCopy(copy)}
                            className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                            title="Edit eksemplar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => confirmDeleteCopy(copy.id)}
                            className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Hapus eksemplar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {showAddCopyForm && (
                  <form
                    onSubmit={submitAddCopy}
                    className="px-4 py-3 bg-[#d4f1e3]/20 border-t border-[#6bbf8d]/30 space-y-3"
                  >
                    <p className="text-xs font-semibold text-[#2d8659]">
                      + Eksemplar Baru
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          No. Buku
                        </label>
                        <input
                          type="text"
                          value={newCopyForm.number}
                          onChange={(event) =>
                            setNewCopyForm({
                              ...newCopyForm,
                              number: event.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                          placeholder="BK013"
                          required
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Th. Pengadaan
                        </label>
                        <input
                          type="number"
                          value={newCopyForm.acquisitionYear}
                          onChange={(event) =>
                            setNewCopyForm({
                              ...newCopyForm,
                              acquisitionYear: event.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="2024"
                          min="1900"
                          max={new Date().getFullYear()}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          Status
                        </label>
                        <select
                          value={newCopyForm.status}
                          onChange={(event) =>
                            setNewCopyForm({
                              ...newCopyForm,
                              status: event.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="Tersedia">Tersedia</option>
                          <option value="Dipinjam">Dipinjam</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAddCopyForm(false)}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <X className="w-3.5 h-3.5" />
                        Batal
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#6bbf8d] hover:bg-[#5fb587] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {saving ? 'Menyimpan...' : 'Tambahkan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setDetailGroup(null);
                  setEditingCopyId(null);
                  setShowAddCopyForm(false);
                }}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium text-sm"
              >
                Tutup
              </button>

              <button
                onClick={() => {
                  setDetailGroup(null);
                  openEditBook(syncedDetail);
                }}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm text-sm"
              >
                Edit Info Buku
              </button>
            </div>
          </div>
        )}
      </Modal>

      <SuccessModal
        isOpen={!!successMsg}
        message={successMsg}
        onClose={() => setSuccessMsg('')}
      />

      {deleteErrorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleteErrorMsg('')}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2">
              Tidak Dapat Dihapus
            </h3>

            <p className="text-muted-foreground text-sm mb-6">
              {deleteErrorMsg}
            </p>

            <button
              onClick={() => setDeleteErrorMsg('')}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              Oke
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({
            isOpen: false,
            type: 'group',
          })
        }
        onConfirm={executeDelete}
        title={
          confirmDialog.type === 'group' ? 'Hapus Buku' : 'Hapus Eksemplar'
        }
        message={
          confirmDialog.type === 'group'
            ? `Yakin ingin menghapus semua eksemplar "${confirmDialog.title}"? Tindakan ini tidak dapat dibatalkan.`
            : `Yakin ingin menghapus eksemplar ${
                books.find((book) => book.id === confirmDialog.copyId)?.number
              }? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={
          saving
            ? 'Memproses...'
            : confirmDialog.type === 'group'
            ? 'Hapus Semua'
            : 'Hapus'
        }
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
