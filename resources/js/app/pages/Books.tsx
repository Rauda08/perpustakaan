import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, BookOpen, Eye, Check, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Book {
  id: number;
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

const initialBooks: Book[] = [
  { id: 1, title: 'Laskar Pelangi', author: 'Andrea Hirata', category: 'Fiksi', number: 'BK001', shelf: 'A-01', status: 'Tersedia', publishYear: '2005', acquisitionYear: '2010' },
  { id: 2, title: 'Laskar Pelangi', author: 'Andrea Hirata', category: 'Fiksi', number: 'BK002', shelf: 'A-01', status: 'Dipinjam', publishYear: '2005', acquisitionYear: '2010' },
  { id: 3, title: 'Laskar Pelangi', author: 'Andrea Hirata', category: 'Fiksi', number: 'BK003', shelf: 'A-01', status: 'Tersedia', publishYear: '2005', acquisitionYear: '2015' },
  { id: 4, title: 'Bumi Manusia', author: 'Pramoedya Ananta Toer', category: 'Fiksi', number: 'BK004', shelf: 'A-02', status: 'Dipinjam', publishYear: '1980', acquisitionYear: '2012' },
  { id: 5, title: 'Bumi Manusia', author: 'Pramoedya Ananta Toer', category: 'Fiksi', number: 'BK005', shelf: 'A-02', status: 'Tersedia', publishYear: '1980', acquisitionYear: '2012' },
  { id: 6, title: 'Negeri 5 Menara', author: 'Ahmad Fuadi', category: 'Fiksi', number: 'BK006', shelf: 'A-03', status: 'Tersedia', publishYear: '2009', acquisitionYear: '2013' },
  { id: 7, title: 'Perahu Kertas', author: 'Dee Lestari', category: 'Fiksi', number: 'BK007', shelf: 'A-04', status: 'Tersedia', publishYear: '2009', acquisitionYear: '2014' },
  { id: 8, title: 'Sang Pemimpi', author: 'Andrea Hirata', category: 'Fiksi', number: 'BK008', shelf: 'A-05', status: 'Dipinjam', publishYear: '2006', acquisitionYear: '2011' },
  { id: 9, title: 'Filosofi Kopi', author: 'Dewi Lestari', category: 'Fiksi', number: 'BK009', shelf: 'B-01', status: 'Tersedia', publishYear: '2006', acquisitionYear: '2016' },
  { id: 10, title: 'Ayat-Ayat Cinta', author: 'Habiburrahman El Shirazy', category: 'Agama', number: 'BK010', shelf: 'B-02', status: 'Tersedia', publishYear: '2004', acquisitionYear: '2013' },
  { id: 11, title: 'Matematika Kelas X', author: 'Tim Penulis', category: 'Pendidikan', number: 'BK011', shelf: 'C-01', status: 'Tersedia', publishYear: '2022', acquisitionYear: '2023' },
  { id: 12, title: 'Matematika Kelas X', author: 'Tim Penulis', category: 'Pendidikan', number: 'BK012', shelf: 'C-01', status: 'Tersedia', publishYear: '2022', acquisitionYear: '2023' },
];

export function Books() {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');

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
    copyId?: number;
  }>({
    isOpen: false,
    type: 'group',
  });

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'Semua' || book.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const groupedBooks: GroupedBook[] = [];
  const bookMap = new Map<string, GroupedBook>();

  filteredBooks.forEach((book) => {
    const key = `${book.title}||${book.author}`;

    if (bookMap.has(key)) {
      const group = bookMap.get(key)!;

      group.total++;

      if (book.status === 'Tersedia') {
        group.tersedia++;
      } else {
        group.dipinjam++;
      }

      group.copies.push(book);
    } else {
      const group: GroupedBook = {
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

      bookMap.set(key, group);
      groupedBooks.push(group);
    }
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
        (group) =>
          group.title === detailGroup.title &&
          group.author === detailGroup.author
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
  };

  const submitBookForm = (event: React.FormEvent) => {
    event.preventDefault();

    if (editingMasterBook) {
      setBooks(
        books.map((book) =>
          book.title === editingMasterBook.title &&
          book.author === editingMasterBook.author
            ? {
                ...book,
                title: bookForm.title,
                author: bookForm.author,
                category: bookForm.category,
                shelf: bookForm.shelf,
                publishYear: bookForm.publishYear,
              }
            : book
        )
      );

      setSuccessMsg('Info buku berhasil diperbarui!');
    } else {
      const newBook: Book = {
        id: Math.max(...books.map((book) => book.id), 0) + 1,
        ...bookForm,
      };

      setBooks([...books, newBook]);
      setSuccessMsg(`Buku "${bookForm.title}" berhasil ditambahkan!`);
    }

    setShowBookModal(false);
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

  const saveCopyEdit = (copyId: number) => {
    setBooks(
      books.map((book) =>
        book.id === copyId
          ? {
              ...book,
              ...copyEditForm,
            }
          : book
      )
    );

    setEditingCopyId(null);
    setSuccessMsg('Eksemplar berhasil diperbarui!');
  };

  const submitAddCopy = (event: React.FormEvent) => {
    event.preventDefault();

    if (!syncedDetail) {
      return;
    }

    const referenceBook = syncedDetail.copies[0];

    const newBook: Book = {
      id: Math.max(...books.map((book) => book.id), 0) + 1,
      title: referenceBook.title,
      author: referenceBook.author,
      category: referenceBook.category,
      shelf: referenceBook.shelf,
      publishYear: referenceBook.publishYear,
      number: newCopyForm.number,
      acquisitionYear: newCopyForm.acquisitionYear,
      status: newCopyForm.status,
    };

    setBooks([...books, newBook]);
    setNewCopyForm({
      number: '',
      acquisitionYear: '',
      status: 'Tersedia',
    });
    setShowAddCopyForm(false);
    setSuccessMsg(`Eksemplar ${newCopyForm.number} berhasil ditambahkan!`);
  };

  const confirmDeleteGroup = (title: string, author: string) => {
    const borrowedBooks = books.filter((book) => {
      return (
        book.title === title &&
        book.author === author &&
        book.status === 'Dipinjam'
      );
    });

    if (borrowedBooks.length > 0) {
      setDeleteErrorMsg(
        `Tidak dapat menghapus "${title}" — ${borrowedBooks.length} eksemplar masih berstatus Dipinjam (${borrowedBooks
          .map((book) => book.number)
          .join(', ')}).`
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: 'group',
      title,
      author,
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

  const executeDelete = () => {
    if (
      confirmDialog.type === 'group' &&
      confirmDialog.title &&
      confirmDialog.author
    ) {
      const count = books.filter((book) => {
        return (
          book.title === confirmDialog.title &&
          book.author === confirmDialog.author
        );
      }).length;

      setBooks(
        books.filter((book) => {
          return !(
            book.title === confirmDialog.title &&
            book.author === confirmDialog.author
          );
        })
      );

      setDetailGroup(null);
      setSuccessMsg(
        `"${confirmDialog.title}" (${count} eksemplar) berhasil dihapus!`
      );
    } else if (confirmDialog.type === 'copy' && confirmDialog.copyId) {
      const copy = books.find((book) => book.id === confirmDialog.copyId);

      setBooks(books.filter((book) => book.id !== confirmDialog.copyId));
      setSuccessMsg(`Eksemplar ${copy?.number} berhasil dihapus!`);
    }

    setConfirmDialog({
      isOpen: false,
      type: 'group',
    });
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
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
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Tambah Buku
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari buku berdasarkan judul, pengarang, atau kategori..."
              className="w-full pl-11 pr-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="px-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium min-w-[180px]"
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
          <table className="w-full">
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
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    {searchTerm || categoryFilter !== 'Semua'
                      ? 'Tidak ada hasil pencarian'
                      : 'Belum ada data buku'}
                  </td>
                </tr>
              )}

              {paginatedGroupedBooks.map((group, index) => (
                <tr
                  key={`${group.title}||${group.author}`}
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
                        onClick={() => confirmDeleteGroup(group.title, group.author)}
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
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title={editingMasterBook ? 'Edit Info Buku' : 'Tambah Buku Baru'}
      >
        <form onSubmit={submitBookForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
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

            <div className="col-span-2">
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

                <div className="col-span-2">
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBookModal(false)}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
            >
              Batal
            </button>

            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              {editingMasterBook ? 'Simpan Perubahan' : 'Tambah Buku'}
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
                <p className="text-xs text-muted-foreground mt-0.5">Tersedia</p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {syncedDetail.dipinjam}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Dipinjam</p>
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-accent/50 border-b border-border">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium transition-colors"
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
                        <div className="grid grid-cols-3 gap-3">
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
                            className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Batal
                          </button>

                          <button
                            type="button"
                            onClick={() => saveCopyEdit(copy.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-accent/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-primary w-16">
                            {copy.number}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            copy.status === 'Tersedia'
                              ? 'bg-[#d4f1e3] text-[#2d8659]'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
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

                    <div className="grid grid-cols-3 gap-3">
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
                        className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Batal
                      </button>

                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#6bbf8d] hover:bg-[#5fb587] text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Tambahkan
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="flex gap-3">
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
        title={confirmDialog.type === 'group' ? 'Hapus Buku' : 'Hapus Eksemplar'}
        message={
          confirmDialog.type === 'group'
            ? `Yakin ingin menghapus semua eksemplar "${confirmDialog.title}"? Tindakan ini tidak dapat dibatalkan.`
            : `Yakin ingin menghapus eksemplar ${
                books.find((book) => book.id === confirmDialog.copyId)?.number
              }? Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText={confirmDialog.type === 'group' ? 'Hapus Semua' : 'Hapus'}
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
