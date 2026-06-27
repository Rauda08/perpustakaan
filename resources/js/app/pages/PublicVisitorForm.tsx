import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import logoImage from '../../imports/logoperpus.png';

interface PublicVisitorFormProps {
  onBack: () => void;
}

interface Member {
  id: number;
  name: string;
  type: string;
  classNip: string;
}

const extractArray = (payload: any): any[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.members)) return data.members;

  return [];
};

const normalizeMember = (item: any): Member => ({
  id: Number(item.id),
  name: item.name ?? item.memberName ?? item.member_name ?? '-',
  type: item.type ?? item.memberType ?? item.member_type ?? 'Siswa',
  classNip:
    item.classNip ??
    item.class_nip ??
    item.nis ??
    item.nip ??
    item.identityNumber ??
    item.identity_number ??
    '',
});

export function PublicVisitorForm({ onBack }: PublicVisitorFormProps) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedVisitorName, setSavedVisitorName] = useState('');
  const [formData, setFormData] = useState({
    memberId: 0,
    name: '',
    classNip: '',
    type: 'Siswa',
    purpose: 'Membaca',
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFromMember, setIsFromMember] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/members', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return;
      }

      const result = await response.json();
      setMembers(extractArray(result).map(normalizeMember));
    } catch {
      setMembers([]);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const suggestions = useMemo(() => {
    const keyword = nameInput.trim().toLowerCase();

    if (!keyword) return [];

    return members
      .filter((member) => member.name.toLowerCase().includes(keyword))
      .slice(0, 5);
  }, [members, nameInput]);

  const handleSelectMember = (member: Member) => {
    setNameInput(member.name);
    setFormData({
      ...formData,
      memberId: member.id,
      name: member.name,
      classNip: member.classNip,
      type: member.type,
    });
    setShowSuggestions(false);
    setIsFromMember(true);
    setErrorMsg('');
  };

  const handleNameChange = (value: string) => {
    setNameInput(value);
    setFormData({
      ...formData,
      memberId: 0,
      name: value,
    });
    setShowSuggestions(true);
    setIsFromMember(false);
    setErrorMsg('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    if (formData.type === 'Siswa' && !formData.classNip.trim()) {
      setErrorMsg('NIS wajib diisi untuk siswa.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: formData.memberId || null,
          name: formData.name.trim(),
          type: formData.type,
          class_nip: formData.classNip.trim(),
          purpose: formData.purpose,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ||
            result?.errors?.name?.[0] ||
            result?.errors?.type?.[0] ||
            result?.errors?.class_nip?.[0] ||
            result?.errors?.purpose?.[0] ||
            'Gagal menyimpan data kunjungan.'
        );
      }

      setSavedVisitorName(formData.name);
      setShowSuccessModal(true);
      setFormData({
        memberId: 0,
        name: '',
        classNip: '',
        type: 'Siswa',
        purpose: 'Membaca',
      });
      setNameInput('');
      setIsFromMember(false);
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan saat menyimpan data kunjungan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img
                src={logoImage}
                alt="Logo SMAN Bernas"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className="font-bold text-foreground truncate">
                Input Kunjungan
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                SMAN Bernas Binsus
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-6 h-6 text-white" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Catat Kunjungan
              </h2>
              <p className="text-sm text-muted-foreground">
                Silakan isi form di bawah ini
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-2">
                Nama Lengkap{' '}
                {isFromMember && (
                  <span className="text-[#6bbf8d] text-xs">
                    (Anggota Terdaftar ✓)
                  </span>
                )}
              </label>

              <input
                type="text"
                value={nameInput}
                onChange={(event) => handleNameChange(event.target.value)}
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
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelectMember(member);
                      }}
                    >
                      <div className="font-medium text-foreground">
                        {member.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {member.type} • {member.classNip || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isFromMember && nameInput.length > 0 && suggestions.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nama tidak ditemukan di data anggota. Anda tetap bisa
                  melanjutkan input manual.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>

              <select
                value={formData.type}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    type: event.target.value,
                    classNip: '',
                    memberId: 0,
                  })
                }
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
                {formData.type === 'Siswa' ? 'NIS' : 'NIP'}
                {formData.type === 'Guru' && ' (Opsional)'}
              </label>

              <input
                type="text"
                value={formData.classNip}
                onChange={(event) =>
                  setFormData({ ...formData, classNip: event.target.value })
                }
                disabled={isFromMember}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={
                  formData.type === 'Siswa'
                    ? 'Masukkan NIS'
                    : 'Masukkan NIP atau kosongkan untuk honorer'
                }
                required={formData.type === 'Siswa'}
              />

              {isFromMember ? (
                <p className="text-xs text-[#6bbf8d] mt-1">
                  Otomatis terisi dari data anggota
                </p>
              ) : formData.type === 'Guru' ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Boleh dikosongkan untuk guru honorer
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tujuan Kunjungan
              </label>

              <select
                value={formData.purpose}
                onChange={(event) =>
                  setFormData({ ...formData, purpose: event.target.value })
                }
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

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Kembali
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all shadow-sm ${
                  loading
                    ? 'bg-primary/60 text-white cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
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

            <h3 className="text-xl font-bold text-foreground mb-2">
              Kunjungan Tercatat!
            </h3>
            <p className="text-muted-foreground mb-1">Selamat datang,</p>
            <p className="text-lg font-semibold text-primary mb-4">
              {savedVisitorName}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Kunjungan kamu berhasil dicatat. Selamat berkunjung di
              perpustakaan SMAN Bernas Binsus!
            </p>

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
