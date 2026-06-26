import { BookOpen, UserPlus, Search, LogIn } from 'lucide-react';
import logoImage from '../../imports/logoperpus.png';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onLoginClick: () => void;
}

export function LandingPage({ onNavigate, onLoginClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src={logoImage}
                alt="Logo SMAN Bernas"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Perpustakaan Digital</h1>
              <p className="text-xs text-primary font-medium">SMAN Bernas Binsus</p>
            </div>
          </div>
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-all"
          >
            <LogIn className="w-5 h-5" />
            <span>Login Petugas</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Selamat Datang di Perpustakaan Digital
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Akses katalog buku dan catat kunjungan Anda dengan mudah
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Input Kunjungan */}
          <button
            onClick={() => onNavigate('visitor-form')}
            className="group bg-white rounded-2xl p-8 shadow-lg border-2 border-border hover:border-primary hover:shadow-xl transition-all text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#7ba7d6] to-[#9bc4e8] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Input Kunjungan
            </h3>
            <p className="text-muted-foreground mb-4">
              Catat kunjungan Anda ke perpustakaan (Siswa & Guru)
            </p>
            <div className="flex items-center gap-2 text-primary font-medium">
              <span>Mulai Catat</span>
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>

          {/* Cari Buku */}
          <button
            onClick={() => onNavigate('search-books')}
            className="group bg-white rounded-2xl p-8 shadow-lg border-2 border-border hover:border-primary hover:shadow-xl transition-all text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#6bbf8d] to-[#a8d5ba] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Cari Buku
            </h3>
            <p className="text-muted-foreground mb-4">
              Telusuri katalog buku perpustakaan dan cek ketersediaan
            </p>
            <div className="flex items-center gap-2 text-primary font-medium">
              <span>Mulai Cari</span>
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          © 2026 Perpustakaan SMAN Bernas Binsus. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
