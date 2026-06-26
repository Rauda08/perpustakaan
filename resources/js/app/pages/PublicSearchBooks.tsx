import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, BookOpen } from 'lucide-react';
import logoImage from '../../imports/logoperpus.png';

interface PublicSearchBooksProps {
  onBack: () => void;
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

interface GroupedBook {
  title: string;
  author: string;
  category: string;
  shelf: string;
  total: number;
  tersedia: number;
  dipinjam: number;
}

const ITEMS_PER_PAGE = 9;

const fallbackBooksData: Book[] = [
  { id: 1, title: 'Laskar Pelangi', author: 'Andrea Hirata', category: 'Fiksi', number: 'BK001', shelf: 'A-01', status: 'Tersedia' },
  { id: 2, title: 'Laskar Pelangi', author: 'Andrea Hirata', category: 'Fiksi', number: 'BK002', shelf: 'A-01', status: 'Dipinjam' },
  { id: 3, title: 'Laskar Pelangi', author: 'Andrea Hirata', category: 'Fiksi', number: 'BK003', shelf: 'A-01', status: 'Tersedia' },
  { id: 4, title: 'Bumi Manusia', author: 'Pramoedya Ananta Toer', category: 'Fiksi', number: 'BK004', shelf: 'A-02', status: 'Dipinjam' },
  { id: 5, title: 'Bumi Manusia', author: 'Pramoedya Ananta Toer', category: 'Fiksi', number: 'BK005', shelf: 'A-02', status: 'Tersedia' },
  { id: 6, title: 'Negeri 5 Menara', author: 'Ahmad Fuadi', category: 'Fiksi', number: 'BK006', shelf: 'A-03', status: 'Tersedia' },
  { id: 7, title: 'Perahu Kertas', author: 'Dee Lestari', category: 'Fiksi', number: 'BK007', shelf: 'A-04', status: 'Tersedia' },
  { id: 8, title: 'Perahu Kertas', author: 'Dee Lestari', category: 'Fiksi', number: 'BK008', shelf: 'A-04', status: 'Tersedia' },
  { id: 9, title: 'Sang Pemimpi', author: 'Andrea Hirata', category: 'Fiksi', number: 'BK009', shelf: 'A-05', status: 'Dipinjam' },
  { id: 10, title: 'Filosofi Kopi', author: 'Dewi Lestari', category: 'Fiksi', number: 'BK010', shelf: 'B-01', status: 'Tersedia' },
  { id: 11, title: 'Ayat-Ayat Cinta', author: 'Habiburrahman El Shirazy', category: 'Religi', number: 'BK011', shelf: 'B-02', status: 'Tersedia' },
  { id: 12, title: 'Ayat-Ayat Cinta', author: 'Habiburrahman El Shirazy', category: 'Religi', number: 'BK012', shelf: 'B-02', status: 'Tersedia' },
  { id: 13, title: 'Matematika Kelas X', author: 'Tim Penulis', category: 'Pelajaran', number: 'BK013', shelf: 'C-01', status: 'Tersedia' },
  { id: 14, title: 'Matematika Kelas X', author: 'Tim Penulis', category: 'Pelajaran', number: 'BK014', shelf: 'C-01', status: 'Tersedia' },
  { id: 15, title: 'Matematika Kelas X', author: 'Tim Penulis', category: 'Pelajaran', number: 'BK015', shelf: 'C-01', status: 'Dipinjam' },
];

const extractArray = (payload: any): any[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.books)) return data.books;
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
      const data = extractArray(result);

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      continue;
    }
  }

  return [];
};

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
          title: item.title ?? copy.title ?? copy.bookMaster?.title ?? copy.book_master?.title ?? '-',
          author: item.author ?? copy.author ?? copy.bookMaster?.author ?? copy.book_master?.author ?? '-',
          category: item.category ?? copy.category ?? copy.bookMaster?.category ?? copy.book_master?.category ?? '-',
          shelf: item.shelf ?? copy.shelf ?? copy.rack ?? copy.bookMaster?.shelf ?? copy.book_master?.shelf ?? '-',
          status: copy.status ?? 'Tersedia',
        });
      });
    } else {
      books.push(normalizeBook(item));
    }
  });

  return books.filter((book) => book.title !== '-');
};

export function PublicSearchBooks({ onBack }: PublicSearchBooksProps) {
  const [books, setBooks] = useState<Book[]>(fallbackBooksData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);

      try {
        const response = await fetchApiArray(['/api/book-copies', '/api/books']);
        const normalized = normalizeBooks(response);

        if (normalized.length > 0) {
          setBooks(normalized);
          setUsingFallback(false);
        } else {
          setBooks(fallbackBooksData);
          setUsingFallback(true);
        }
      } catch {
        setBooks(fallbackBooksData);
        setUsingFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        books
          .map((book) => book.category)
          .filter((category) => category && category !== '-')
      )
    );

    return ['Semua', ...uniqueCategories];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const lowerSearch = searchTerm.toLowerCase();

      const matchesSearch =
        book.title.toLowerCase().includes(lowerSearch) ||
        book.author.toLowerCase().includes(lowerSearch) ||
        book.number.toLowerCase().includes(lowerSearch);

      const matchesCategory =
        selectedCategory === 'Semua' || book.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [books, searchTerm, selectedCategory]);

  const groupedBooks = useMemo(() => {
    const groups: GroupedBook[] = [];
    const bookMap = new Map<string, GroupedBook>();

    filteredBooks.forEach((book) => {
      const key = `${book.title}||${book.author}`;

      if (bookMap.has(key)) {
        const group = bookMap.get(key)!;

        group.total += 1;

        if (book.status === 'Tersedia') {
          group.tersedia += 1;
        } else {
          group.dipinjam += 1;
        }
      } else {
        const newGroup: GroupedBook = {
          title: book.title,
          author: book.author,
          category: book.category,
          shelf: book.shelf,
          total: 1,
          tersedia: book.status === 'Tersedia' ? 1 : 0,
          dipinjam: book.status === 'Dipinjam' ? 1 : 0,
        };

        bookMap.set(key, newGroup);
        groups.push(newGroup);
      }
    });

    return groups;
  }, [filteredBooks]);

  const totalPages = Math.ceil(groupedBooks.length / ITEMS_PER_PAGE);

  const paginatedBooks = useMemo(() => {
    return groupedBooks.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [groupedBooks, currentPage]);

  const startItem =
    groupedBooks.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, groupedBooks.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src={logoImage}
                alt="Logo SMAN Bernas"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <h1 className="font-bold text-foreground">Katalog Buku</h1>
              <p className="text-xs text-muted-foreground">SMAN Bernas Binsus</p>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Cari Buku Perpustakaan
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cari berdasarkan judul, pengarang, atau nomor eksemplar buku.
              </p>
            </div>

            {isLoading && (
              <span className="text-sm text-muted-foreground">
                Memuat data buku...
              </span>
            )}

            {!isLoading && usingFallback && (
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                Mode data contoh
              </span>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari berdasarkan judul, pengarang, atau nomor buku..."
                className="w-full pl-12 pr-4 py-4 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-accent text-foreground hover:bg-accent/70'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <p className="text-sm text-muted-foreground">
                {groupedBooks.length === 0
                  ? `Ditemukan 0 judul buku (${filteredBooks.length} eksemplar)`
                  : `Ditemukan ${groupedBooks.length} judul buku (${filteredBooks.length} eksemplar)`}
              </p>

              {groupedBooks.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Menampilkan {startItem}-{endItem} dari {groupedBooks.length} judul
                </p>
              )}
            </div>

            {paginatedBooks.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedBooks.map((book) => (
                    <div
                      key={`${book.title}-${book.author}`}
                      className="bg-accent/30 rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {book.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {book.author}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Kategori:</span>
                          <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                            {book.category}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Lokasi:</span>
                          <span className="font-mono font-medium text-foreground">
                            {book.shelf}
                          </span>
                        </div>

                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">
                            Total Eksemplar:
                          </span>
                          <span className="font-semibold text-foreground">
                            {book.total} buku
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#6bbf8d]" />
                            <span className="text-xs text-muted-foreground">
                              Tersedia
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-[#6bbf8d]">
                            {book.tersedia}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-600" />
                            <span className="text-xs text-muted-foreground">
                              Dipinjam
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-yellow-700">
                            {book.dipinjam}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
                    <p>
                      Halaman {currentPage} dari {totalPages}
                    </p>

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
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Tidak ada buku yang ditemukan
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
