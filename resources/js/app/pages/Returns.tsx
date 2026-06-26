import { useState } from 'react';
import { Search, BookCheck, CheckCircle } from 'lucide-react';

const recentReturns = [
  { id: 1, memberName: 'Rudi Hermawan', bookTitle: 'Filosofi Kopi', borrowDate: '2026-04-20', returnDate: '2026-05-05', status: 'Tepat Waktu' },
  { id: 2, memberName: 'Rina Kusuma', bookTitle: 'Negeri 5 Menara', borrowDate: '2026-04-18', returnDate: '2026-05-04', status: 'Terlambat 2 hari' },
  { id: 3, memberName: 'Budi Santoso', bookTitle: 'Ayat-Ayat Cinta', borrowDate: '2026-04-22', returnDate: '2026-05-03', status: 'Tepat Waktu' },
  { id: 4, memberName: 'Agus Prasetyo', bookTitle: 'Matematika Kelas X', borrowDate: '2026-04-25', returnDate: '2026-05-02', status: 'Tepat Waktu' },
];

export function Returns() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReturns = recentReturns.filter(item =>
    item.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Pengembalian Buku</h1>
        <p className="text-muted-foreground">Proses pengembalian buku perpustakaan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Pengembalian Hari Ini</span>
            <BookCheck className="w-5 h-5 text-[#6bbf8d]" />
          </div>
          <p className="text-3xl font-semibold text-foreground">12</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Tepat Waktu</span>
            <CheckCircle className="w-5 h-5 text-[#7ba7d6]" />
          </div>
          <p className="text-3xl font-semibold text-foreground">9</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Terlambat</span>
            <BookCheck className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-semibold text-foreground">3</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <h3 className="font-semibold text-foreground mb-6">Pengembalian Terbaru</h3>

        <div className="mb-6">
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">No</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Nama Anggota</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Judul Buku</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Tanggal Pinjam</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Tanggal Kembali</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((item, index) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{index + 1}</td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-foreground">{item.memberName}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <BookCheck className="w-4 h-4 text-green-600" />
                      <span className="text-foreground">{item.bookTitle}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">{item.borrowDate}</td>
                  <td className="py-4 px-4 text-muted-foreground">{item.returnDate}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'Tepat Waktu'
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
      </div>
    </div>
  );
}
