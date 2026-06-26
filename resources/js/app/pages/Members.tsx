import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  User,
  History,
  BookCopy,
  ChevronDown,
  ChevronUp,
  GraduationCap,
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { SuccessModal } from '../components/SuccessModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Member {
  id: number;
  name: string;
  classNip: string;
  type: string;
  phone: string;
}

interface Borrowing {
  id: number;
  batchId?: string;
  memberId?: number;
  memberName: string;
  bookTitle: string;
  bookNumber: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  returnTime?: string;
  loanType: string;
  loanSubType?: string;
  status: string;
  quantity?: number;
  className?: string;
}

interface MemberBorrowingRecord {
  active: Borrowing[];
  activeTahunan: Borrowing[];
  history: Borrowing[];
}

const ITEMS_PER_PAGE = 10;

const extractArray = (payload: any): any[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.borrowings)) return data.borrowings;

  return [];
};

const normalizeMember = (item: any): Member => ({
  id: Number(item.id),
  name: item.name ?? item.memberName ?? item.member_name ?? '-',
  classNip:
    item.classNip ??
    item.class_nip ??
    item.nis ??
    item.nip ??
    item.identityNumber ??
    item.identity_number ??
    '',
  type: item.type ?? item.memberType ?? item.member_type ?? 'Siswa',
  phone: item.phone ?? item.phoneNumber ?? item.phone_number ?? '',
});

const normalizeBorrowing = (item: any): Borrowing => ({
  id: Number(item.id),
  batchId: item.batchId ?? item.batch_id,
  memberId: item.memberId ?? item.member_id,
  memberName:
    item.memberName ??
    item.member_name ??
    item.member?.name ??
    item.member?.memberName ??
    '-',
  bookTitle:
    item.bookTitle ??
    item.book_title ??
    item.bookCopy?.bookMaster?.title ??
    item.book_copy?.book_master?.title ??
    item.bookCopy?.title ??
    item.book_copy?.title ??
    '-',
  bookNumber:
    item.bookNumber ??
    item.book_number ??
    item.bookCopy?.number ??
    item.book_copy?.number ??
    '-',
  borrowDate: item.borrowDate ?? item.borrow_date ?? '',
  dueDate: item.dueDate ?? item.due_date ?? '',
  returnDate: item.returnDate ?? item.return_date ?? '',
  returnTime: item.returnTime ?? item.return_time ?? '',
  loanType: item.loanType ?? item.loan_type ?? 'Mingguan',
  loanSubType: item.loanSubType ?? item.loan_sub_type ?? '',
  status: item.status ?? 'Aktif',
  quantity: item.quantity ?? 1,
  className: item.className ?? item.class_name ?? '',
});

const formatDate = (dateText?: string) => {
  if (!dateText) return '-';

  const date = new Date(`${dateText}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isActiveStatus = (status: string) => {
  return status === 'Aktif' || status === 'Terlambat';
};

const isReturnedStatus = (status: string) => {
  return status === 'Dikembalikan' || status === 'Selesai' || status === 'Returned';
};

export function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    classNip: '',
    type: 'Siswa',
    phone: '',
    teacherStatus: 'PNS',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    memberId: number | null;
  }>({
    isOpen: false,
    memberId: null,
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMemberHistory, setSelectedMemberHistory] = useState<Member | null>(null);
  const [historyLoanFilter, setHistoryLoanFilter] = useState<'Semua' | 'Harian' | 'Mingguan' | 'Tahunan'>('Semua');
  const [showTahunanAccordion, setShowTahunanAccordion] = useState(false);

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/members', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data anggota.');
      }

      const result = await response.json();
      const data = extractArray(result).map(normalizeMember);

      setMembers(data);
    } catch {
      setMembers([]);
    }
  };

  const loadBorrowings = async () => {
    try {
      const response = await fetch('/api/borrowings', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data peminjaman.');
      }

      const result = await response.json();
      const data = extractArray(result).map(normalizeBorrowing);

      setBorrowings(data);
    } catch {
      setBorrowings([]);
    }
  };

  const loadData = async () => {
    setLoading(true);

    try {
      await Promise.all([loadMembers(), loadBorrowings()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const memberBorrowingData = useMemo<Record<number, MemberBorrowingRecord>>(() => {
    const records: Record<number, MemberBorrowingRecord> = {};

    members.forEach((member) => {
      records[member.id] = {
        active: [],
        activeTahunan: [],
        history: [],
      };
    });

    borrowings.forEach((borrowing) => {
      const matchedMember = members.find((member) => {
        if (borrowing.memberId) {
          return member.id === Number(borrowing.memberId);
        }

        return member.name === borrowing.memberName;
      });

      if (!matchedMember) {
        return;
      }

      if (!records[matchedMember.id]) {
        records[matchedMember.id] = {
          active: [],
          activeTahunan: [],
          history: [],
        };
      }

      if (isActiveStatus(borrowing.status) && borrowing.loanType === 'Tahunan') {
        records[matchedMember.id].activeTahunan.push(borrowing);
        return;
      }

      if (isActiveStatus(borrowing.status)) {
        records[matchedMember.id].active.push(borrowing);
        return;
      }

      if (isReturnedStatus(borrowing.status)) {
        records[matchedMember.id].history.push(borrowing);
      }
    });

    return records;
  }, [members, borrowings]);

  const filteredMembers = members.filter((member) => {
    const lowerSearch = searchTerm.toLowerCase();

    const matchesSearch =
      member.name.toLowerCase().includes(lowerSearch) ||
      member.classNip.toLowerCase().includes(lowerSearch) ||
      member.type.toLowerCase().includes(lowerSearch);

    const matchesType = typeFilter === 'Semua' || member.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);

  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startItem =
    filteredMembers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const currentBorrowingData = selectedMemberHistory
    ? memberBorrowingData[selectedMemberHistory.id]
    : undefined;

  const annualBorrowDate =
    currentBorrowingData?.activeTahunan?.[0]?.borrowDate || '';

  const annualDueDate =
    currentBorrowingData?.activeTahunan?.[0]?.dueDate || '';

  const handleAdd = () => {
    setEditingMember(null);
    setErrorMsg('');
    setFormData({
      name: '',
      classNip: '',
      type: 'Siswa',
      phone: '',
      teacherStatus: 'PNS',
    });
    setShowModal(true);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setErrorMsg('');
    setFormData({
      name: member.name,
      classNip: member.classNip,
      type: member.type,
      phone: member.phone,
      teacherStatus: member.classNip === 'Honorer' ? 'Honorer' : 'PNS',
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      memberId: id,
    });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.memberId) {
      return;
    }

    const memberId = confirmDialog.memberId;

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus anggota.');
      }

      setMembers((previous) => previous.filter((member) => member.id !== memberId));
      setSuccessMsg('Anggota berhasil dihapus!');
    } catch {
      setMembers((previous) => previous.filter((member) => member.id !== memberId));
      setSuccessMsg('Anggota berhasil dihapus dari tampilan lokal.');
    } finally {
      setConfirmDialog({
        isOpen: false,
        memberId: null,
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedClassNip =
      formData.type === 'Guru' && formData.teacherStatus === 'Honorer'
        ? 'Honorer'
        : formData.classNip;

    const duplicate = members.find((member) => {
      if (normalizedClassNip === 'Honorer') {
        return false;
      }

      return (
        member.classNip === normalizedClassNip &&
        member.id !== editingMember?.id
      );
    });

    if (duplicate) {
      setErrorMsg(
        `${formData.type === 'Siswa' ? 'NIS' : 'NIP'} "${normalizedClassNip}" sudah terdaftar atas nama ${duplicate.name}.`
      );
      return;
    }

    const payload = {
      name: formData.name,
      class_nip: normalizedClassNip,
      classNip: normalizedClassNip,
      type: formData.type,
      phone: formData.phone,
    };

    if (editingMember) {
      try {
        const response = await fetch(`/api/members/${editingMember.id}`, {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Gagal memperbarui anggota.');
        }

        const result = await response.json();
        const updatedMember = normalizeMember(result.data ?? result);

        setMembers((previous) =>
          previous.map((member) =>
            member.id === editingMember.id ? updatedMember : member
          )
        );

        setSuccessMsg('Anggota berhasil diperbarui!');
      } catch {
        setMembers((previous) =>
          previous.map((member) =>
            member.id === editingMember.id
              ? {
                  ...member,
                  name: formData.name,
                  classNip: normalizedClassNip,
                  type: formData.type,
                  phone: formData.phone,
                }
              : member
          )
        );

        setSuccessMsg('Anggota berhasil diperbarui pada tampilan lokal.');
      }
    } else {
      try {
        const response = await fetch('/api/members', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Gagal menambahkan anggota.');
        }

        const result = await response.json();
        const createdMember = normalizeMember(result.data ?? result);

        setMembers((previous) => [...previous, createdMember]);
        setSuccessMsg('Anggota berhasil ditambahkan!');
      } catch {
        const newMember: Member = {
          id: Math.max(...members.map((member) => member.id), 0) + 1,
          name: formData.name,
          classNip: normalizedClassNip,
          type: formData.type,
          phone: formData.phone,
        };

        setMembers((previous) => [...previous, newMember]);
        setSuccessMsg('Anggota berhasil ditambahkan pada tampilan lokal.');
      }
    }

    setShowModal(false);
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
            Data Anggota
          </h1>
          <p className="text-muted-foreground">
            Kelola data anggota perpustakaan
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Tambah Anggota
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari anggota berdasarkan nama atau NIS/NIP"
              className="w-full pl-11 pr-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="px-4 py-3 bg-accent/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            >
              <option value="Semua">Semua Jenis</option>
              <option value="Siswa">Siswa</option>
              <option value="Guru">Guru</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Memuat data anggota...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                      No Anggota
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                      Nama Anggota
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                      NIS / NIP
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                      Jenis Anggota
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                      Nomor HP
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedMembers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        {searchTerm || typeFilter !== 'Semua'
                          ? 'Tidak ada hasil pencarian'
                          : 'Belum ada data anggota'}
                      </td>
                    </tr>
                  )}

                  {paginatedMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-primary">
                          {member.id.toString().padStart(4, '0')}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#e8f3ff] rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-[#7ba7d6]" />
                          </div>
                          <span className="font-medium text-foreground">
                            {member.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-muted-foreground font-mono text-sm">
                        {member.type === 'Guru' && member.classNip === 'Honorer' ? (
                          <span className="px-2 py-1 bg-[#fff3cc] text-[#9d7a2f] rounded text-xs font-medium">
                            Honorer
                          </span>
                        ) : (
                          member.classNip
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          member.type === 'Guru'
                            ? 'bg-[#fff3cc] text-[#9d7a2f]'
                            : 'bg-[#e8f3ff] text-[#5a7ba0]'
                        }`}>
                          {member.type}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-muted-foreground">
                        {member.phone || '-'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedMemberHistory(member);
                              setHistoryLoanFilter('Semua');
                              setShowTahunanAccordion(false);
                              setShowHistoryModal(true);
                            }}
                            className="p-2 hover:bg-[#6bbf8d]/10 text-[#6bbf8d] rounded-lg transition-colors"
                            title="Lihat Riwayat"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(member.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Hapus"
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
                {filteredMembers.length === 0
                  ? `Menampilkan 0 dari ${members.length} anggota`
                  : `Menampilkan ${startItem}-${endItem} dari ${filteredMembers.length} anggota`}
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
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMember ? 'Edit Anggota' : 'Tambah Anggota Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  name: event.target.value,
                })
              }
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Jenis Anggota
            </label>
            <select
              value={formData.type}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  type: event.target.value,
                  classNip: '',
                  teacherStatus: 'PNS',
                })
              }
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            >
              <option value="Siswa">Siswa</option>
              <option value="Guru">Guru</option>
            </select>
          </div>

          {formData.type === 'Siswa' ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                NIS
              </label>
              <input
                type="text"
                value={formData.classNip}
                onChange={(event) => {
                  setFormData({
                    ...formData,
                    classNip: event.target.value,
                  });
                  setErrorMsg('');
                }}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Masukkan NIS siswa"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nomor Induk Siswa
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Status Kepegawaian
                </label>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teacherStatus"
                      value="PNS"
                      checked={formData.teacherStatus === 'PNS'}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          teacherStatus: event.target.value,
                          classNip: '',
                        })
                      }
                      className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-sm text-foreground">Guru PNS</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teacherStatus"
                      value="Honorer"
                      checked={formData.teacherStatus === 'Honorer'}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          teacherStatus: event.target.value,
                          classNip: 'Honorer',
                        })
                      }
                      className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-sm text-foreground">Guru Honorer</span>
                  </label>
                </div>
              </div>

              {formData.teacherStatus === 'PNS' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    NIP
                  </label>
                  <input
                    type="text"
                    value={formData.classNip}
                    onChange={(event) => {
                      setFormData({
                        ...formData,
                        classNip: event.target.value,
                      });
                      setErrorMsg('');
                    }}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Masukkan NIP 18 digit"
                    maxLength={18}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: 18 digit angka
                  </p>
                </div>
              )}

              {formData.teacherStatus === 'Honorer' && (
                <div className="bg-[#fff3cc]/30 p-4 rounded-lg border border-[#f5c842]/30">
                  <p className="text-sm text-[#9d7a2f]">
                    Guru honorer tidak memerlukan NIP. Status akan dicatat sebagai
                    "Honorer".
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nomor HP
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  phone: event.target.value,
                })
              }
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="08123456789"
              required
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setErrorMsg('');
              }}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
            >
              Batal
            </button>

            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              {editingMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedMemberHistory(null);
        }}
        title={`Riwayat Peminjaman - ${selectedMemberHistory?.name || ''}`}
      >
        <div className="space-y-6">
          {selectedMemberHistory && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    No Anggota
                  </p>
                  <p className="font-mono text-primary">
                    {selectedMemberHistory.id.toString().padStart(4, '0')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Jenis</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedMemberHistory.type === 'Guru'
                      ? 'bg-[#fff3cc] text-[#9d7a2f]'
                      : 'bg-[#e8f3ff] text-[#5a7ba0]'
                  }`}>
                    {selectedMemberHistory.type}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Nama Anggota
                  </p>
                  <p className="font-medium text-foreground">
                    {selectedMemberHistory.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedMemberHistory.type === 'Siswa' ? 'NIS' : 'NIP'}
                  </p>
                  <p className="font-medium text-foreground font-mono text-sm">
                    {selectedMemberHistory.classNip}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">No. HP</p>
                  <p className="font-medium text-foreground">
                    {selectedMemberHistory.phone || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedMemberHistory && (() => {
            const activeList = (currentBorrowingData?.active || []).map((item) => ({
              ...item,
              _isActive: true,
            }));

            const historyList = (currentBorrowingData?.history || [])
              .filter((item) => item.loanType !== 'Tahunan')
              .map((item) => ({
                ...item,
                _isActive: false,
              }));

            const combined = [...activeList, ...historyList];

            const filtered =
              selectedMemberHistory.type === 'Siswa' && historyLoanFilter !== 'Semua'
                ? combined.filter((item) => item.loanType === historyLoanFilter)
                : combined;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BookCopy className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Peminjaman Buku
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      (currentBorrowingData?.active.length || 0) >= 2
                        ? 'bg-red-100 text-red-700'
                        : 'bg-[#d4f1e3] text-[#2d8659]'
                    }`}>
                      {currentBorrowingData?.active.length || 0} / 2 aktif
                    </span>
                  </div>

                  {selectedMemberHistory.type === 'Siswa' && (
                    <div className="flex gap-1.5">
                      {(['Semua', 'Harian', 'Mingguan'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setHistoryLoanFilter(filter)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                            historyLoanFilter === filter
                              ? filter === 'Harian'
                                ? 'bg-[#fff3cc] text-[#9d7a2f] border-[#f5c842]'
                                : filter === 'Mingguan'
                                ? 'bg-[#e8f3ff] text-[#5a7ba0] border-[#7ba7d6]'
                                : 'bg-primary text-white border-primary'
                              : 'bg-white text-muted-foreground border-border hover:bg-accent/50'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {filtered.length > 0 ? (
                  <div className="border-2 border-[#b0c8e8] rounded-lg overflow-hidden font-mono shadow-sm">
                    <div className="bg-[#d6e8f7] px-4 py-2 border-b-2 border-[#b0c8e8] flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5a7ba0]">
                        Kartu Peminjaman
                      </span>
                      <span className="text-[10px] text-[#5a7ba0]">·</span>
                      <span className="text-[10px] uppercase tracking-widest text-[#5a7ba0]">
                        Perpustakaan SMA Negeri Bernas
                      </span>
                    </div>

                    <div className="px-4 py-3 border-b border-[#d6e8f7] grid grid-cols-3 gap-x-4 gap-y-1 text-xs bg-[#f5faff]">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-[#8aa8c8] mb-0.5">
                          No Anggota
                        </p>
                        <p className="font-mono text-[#1a3a5a]">
                          {selectedMemberHistory.id.toString().padStart(4, '0')}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-[#8aa8c8] mb-0.5">
                          Nama
                        </p>
                        <p className="font-bold text-[#1a3a5a]">
                          {selectedMemberHistory.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-[#8aa8c8] mb-0.5">
                          {selectedMemberHistory.type === 'Siswa' ? 'NIS' : 'NIP'}
                        </p>
                        <p className="font-bold text-[#1a3a5a]">
                          {selectedMemberHistory.classNip}
                        </p>
                      </div>
                    </div>

                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#e8f3ff]">
                          <th className="border border-[#b0c8e8] px-3 py-2 text-left text-[10px] uppercase tracking-wide text-[#5a7ba0]">
                            No. Buku
                          </th>
                          <th className="border border-[#b0c8e8] px-3 py-2 text-left text-[10px] uppercase tracking-wide text-[#5a7ba0]">
                            Judul Buku
                          </th>
                          <th className="border border-[#b0c8e8] px-3 py-2 text-left text-[10px] uppercase tracking-wide text-[#5a7ba0]">
                            Jenis
                          </th>
                          <th className="border border-[#b0c8e8] px-3 py-2 text-left text-[10px] uppercase tracking-wide text-[#5a7ba0]">
                            Tgl. Pinjam
                          </th>
                          <th className="border border-[#b0c8e8] px-3 py-2 text-left text-[10px] uppercase tracking-wide text-[#5a7ba0]">
                            Tgl. Kembali
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filtered.map((item: any, index: number) => (
                          <tr
                            key={`${item._isActive ? 'a' : 'h'}-${item.id}`}
                            className={index % 2 === 0 ? 'bg-white' : 'bg-[#f5faff]'}
                          >
                            <td className="border border-[#d6e8f7] px-3 py-2 font-bold text-[#3a5a80]">
                              {item.bookNumber || '—'}
                            </td>

                            <td className="border border-[#d6e8f7] px-3 py-2 text-[#1a3a5a]">
                              {item.bookTitle}
                            </td>

                            <td className="border border-[#d6e8f7] px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.loanType === 'Harian'
                                  ? 'bg-[#fff3cc] text-[#9d7a2f]'
                                  : 'bg-[#e8f3ff] text-[#5a7ba0]'
                              }`}>
                                {item.loanType}
                              </span>
                            </td>

                            <td className="border border-[#d6e8f7] px-3 py-2 text-[#3a5a80]">
                              {formatDate(item.borrowDate)}
                            </td>

                            <td className="border border-[#d6e8f7] px-3 py-2">
                              {item._isActive ? (
                                <span className="inline-flex items-center gap-1 text-[#2d8659] font-semibold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2d8659] inline-block" />
                                  Sedang Dipinjam
                                </span>
                              ) : (
                                <span className={`text-xs font-semibold ${
                                  item.status === 'Tepat waktu'
                                    ? 'text-[#3a5a80]'
                                    : 'text-red-500'
                                }`}>
                                  {formatDate(item.returnDate)}
                                  {item.status !== 'Tepat waktu' && (
                                    <span className="ml-1 text-[9px] text-red-400">
                                      (terlambat)
                                    </span>
                                  )}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-accent/10 text-sm">
                    Tidak ada data peminjaman
                  </div>
                )}

                {selectedMemberHistory.type === 'Siswa' && (
                  <div
                    className="border-2 border-[#f5c842]/50 rounded-lg overflow-hidden shadow-sm font-mono"
                    style={{ background: '#fffdf5' }}
                  >
                    <button
                      onClick={() =>
                        setShowTahunanAccordion(!showTahunanAccordion)
                      }
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-[#fff8d6] hover:bg-[#fff3bb] transition-colors border-b-2 border-[#f5c842]/40"
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#9d7a2f]" />
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-[#9d7a2f]">
                          Kartu Peminjaman · Buku Pelajaran Tahunan
                        </span>
                        <span className="px-2 py-0.5 bg-[#f5c842]/40 text-[#7a5c1e] rounded text-[10px] font-bold uppercase">
                          {currentBorrowingData?.activeTahunan?.length || 0} Buku
                        </span>
                      </div>

                      {showTahunanAccordion ? (
                        <ChevronUp className="w-4 h-4 text-[#9d7a2f]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#9d7a2f]" />
                      )}
                    </button>

                    {!showTahunanAccordion && (
                      <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                        <span className="text-[#9d7a2f]">
                          Periode aktif:{' '}
                          <span className="font-bold">
                            {formatDate(annualBorrowDate)} – {formatDate(annualDueDate)}
                          </span>
                        </span>
                        <span className="text-[10px] text-[#8aa8c8] italic">
                          Klik untuk lihat daftar buku
                        </span>
                      </div>
                    )}

                    {showTahunanAccordion && (
                      <div className="px-4 pt-3 pb-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3 text-xs">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-[#c8a84b] mb-0.5">
                              Nama Peminjam
                            </p>
                            <p className="font-bold text-[#5a3e00]">
                              {selectedMemberHistory.name}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-[#c8a84b] mb-0.5">
                              Kelas / NIS
                            </p>
                            <p className="font-bold text-[#5a3e00]">
                              {selectedMemberHistory.classNip}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-[#c8a84b] mb-0.5">
                              Tgl. Pinjam
                            </p>
                            <p className="font-bold text-[#5a3e00]">
                              {formatDate(annualBorrowDate)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-[#c8a84b] mb-0.5">
                              Tgl. Kembali
                            </p>
                            <p className="font-bold text-[#c0392b]">
                              {formatDate(annualDueDate)}
                            </p>
                          </div>
                        </div>

                        <table className="w-full text-xs border-collapse mb-2">
                          <thead>
                            <tr className="bg-[#fff3cc]">
                              <th className="border border-[#f5c842]/60 px-2 py-1.5 text-left text-[10px] uppercase tracking-wide text-[#9d7a2f]">
                                No.
                              </th>
                              <th className="border border-[#f5c842]/60 px-2 py-1.5 text-left text-[10px] uppercase tracking-wide text-[#9d7a2f]">
                                No. Buku
                              </th>
                              <th className="border border-[#f5c842]/60 px-2 py-1.5 text-left text-[10px] uppercase tracking-wide text-[#9d7a2f]">
                                Judul Buku
                              </th>
                              <th className="border border-[#f5c842]/60 px-2 py-1.5 text-left text-[10px] uppercase tracking-wide text-[#9d7a2f]">
                                Jenis
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {(currentBorrowingData?.activeTahunan || []).map(
                              (book: Borrowing, index: number) => (
                                <tr
                                  key={book.id}
                                  className={
                                    index % 2 === 0 ? 'bg-[#fffdf5]' : 'bg-[#fffbea]'
                                  }
                                >
                                  <td className="border border-[#f5c842]/40 px-2 py-1.5 text-[#7a5c1e] text-center">
                                    {index + 1}
                                  </td>
                                  <td className="border border-[#f5c842]/40 px-2 py-1.5 text-[#7a5c1e] font-bold">
                                    {book.bookNumber}
                                  </td>
                                  <td className="border border-[#f5c842]/40 px-2 py-1.5 text-[#3a2a00]">
                                    {book.bookTitle}
                                  </td>
                                  <td className="border border-[#f5c842]/40 px-2 py-1.5 text-[#7a5c1e]">
                                    {book.loanType}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>

                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#f5c842]/40">
                          <span className="text-[10px] text-[#c8a84b] uppercase tracking-wide">
                            Total
                          </span>
                          <span className="text-[10px] font-bold text-[#7a5c1e]">
                            {currentBorrowingData?.activeTahunan?.length || 0} buku pelajaran
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="pt-4">
            <button
              onClick={() => {
                setShowHistoryModal(false);
                setSelectedMemberHistory(null);
              }}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      <SuccessModal
        isOpen={!!successMsg}
        message={successMsg}
        onClose={() => setSuccessMsg('')}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({
            isOpen: false,
            memberId: null,
          })
        }
        onConfirm={confirmDelete}
        title="Hapus Anggota"
        message="Apakah Anda yakin ingin menghapus anggota ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}
