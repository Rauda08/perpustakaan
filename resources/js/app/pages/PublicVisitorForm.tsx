import { useState } from 'react';
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';
import logoImage from '../../imports/logoperpus.png';
import { membersData } from '../data/mockData';

interface PublicVisitorFormProps {
  onBack: () => void;
}

export function PublicVisitorForm({ onBack }: PublicVisitorFormProps) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedVisitorName, setSavedVisitorName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    classNip: '',
    type: 'Siswa',
    purpose: 'Membaca',
  });
  const [nameInput, setNameInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFromMember, setIsFromMember] = useState(false);

  // Filter suggestions based on name input
  const suggestions = membersData.filter(member =>
    member.name.toLowerCase().includes(nameInput.toLowerCase()) && nameInput.length > 0
  ).slice(0, 5); // Limit to 5 suggestions

  const handleSelectMember = (member: typeof membersData[0]) => {
    setNameInput(member.name);
    setFormData({
      ...formData,
      name: member.name,
      classNip: member.classNip,
      type: member.type
    });
    setShowSuggestions(false);
    setIsFromMember(true);
  };

  const handleNameChange = (value: string) => {
    setNameInput(value);
    setFormData({ ...formData, name: value });
    setShowSuggestions(true);
    setIsFromMember(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Capture current time automatically
    const currentTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const currentDate = '2026-06-14'; // Fixed system date

    // Save to localStorage (in real implementation, this would save to database)
    const newVisitor = {
      id: Date.now(), // Generate unique ID
      name: formData.name,
      type: formData.type,
      classNip: formData.classNip,
      purpose: formData.purpose,
      visitDate: currentDate,
      visitTime: currentTime
    };

    // Get existing visitors from localStorage
    const existingVisitors = JSON.parse(localStorage.getItem('customVisitors') || '[]');
    existingVisitors.push(newVisitor);
    localStorage.setItem('customVisitors', JSON.stringify(existingVisitors));

    setSavedVisitorName(formData.name);
    setShowSuccessModal(true);
    setFormData({ name: '', classNip: '', type: 'Siswa', purpose: 'Membaca' });
    setNameInput('');
    setIsFromMember(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
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
              <h1 className="font-bold text-foreground">Input Kunjungan</h1>
              <p className="text-xs text-muted-foreground">SMAN Bernas Binsus</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form Section */}
      <section className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Catat Kunjungan</h2>
              <p className="text-sm text-muted-foreground">Silakan isi form di bawah ini</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-2">
                Nama Lengkap {isFromMember && <span className="text-[#6bbf8d] text-xs">(Anggota Terdaftar ✓)</span>}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ketik nama untuk mencari anggota terdaftar..."
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-border max-h-60 overflow-y-auto">
                  <div className="px-3 py-2 bg-accent/50 border-b border-border text-xs text-muted-foreground">
                    Anggota Terdaftar (Pilih untuk auto-fill)
                  </div>
                  {suggestions.map((member) => (
                    <div
                      key={member.id}
                      className="px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors border-b border-border last:border-0"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectMember(member);
                      }}
                    >
                      <div className="font-medium text-foreground">{member.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {member.type} • {member.classNip}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!isFromMember && nameInput.length > 0 && suggestions.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nama tidak ditemukan di data anggota. Anda tetap bisa melanjutkan input manual.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, classNip: '' })}
                disabled={isFromMember}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="Siswa">Siswa</option>
                <option value="Guru">Guru</option>
              </select>
              {isFromMember && (
                <p className="text-xs text-[#6bbf8d] mt-1">
                  Otomatis terisi dari data anggota
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {formData.type === 'Siswa' ? 'NIS' : 'NIP'}{formData.type === 'Guru' && ' (Opsional)'}
              </label>
              <input
                type="text"
                value={formData.classNip}
                onChange={(e) => setFormData({ ...formData, classNip: e.target.value })}
                disabled={isFromMember}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={formData.type === 'Siswa' ? 'Masukkan NIS' : 'Masukkan NIP atau kosongkan untuk honorer'}
                required={formData.type === 'Siswa'}
              />
              {isFromMember ? (
                <p className="text-xs text-[#6bbf8d] mt-1">Otomatis terisi dari data anggota</p>
              ) : formData.type === 'Guru' ? (
                <p className="text-xs text-muted-foreground mt-1">Boleh dikosongkan untuk guru honorer</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tujuan Kunjungan
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              >
                <option value="Membaca">Membaca</option>
                <option value="Pinjam Buku">Pinjam Buku</option>
                <option value="Mencari Referensi">Mencari Referensi</option>
                <option value="Mengerjakan Tugas">Mengerjakan Tugas</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </section>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Kunjungan Tercatat!</h3>
            <p className="text-muted-foreground mb-1">Selamat datang,</p>
            <p className="text-lg font-semibold text-primary mb-4">{savedVisitorName}</p>
            <p className="text-sm text-muted-foreground mb-6">Kunjungan kamu berhasil dicatat. Selamat berkunjung di perpustakaan SMAN Bernas Binsus!</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              Oke
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
