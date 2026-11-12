import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Newspaper,
  Star,
  Users,
  Video,
  Wifi,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { BinaExpression } from '../BinaMascot.tsx';
import { BEduMediaHub } from '../BEduMediaHub.tsx';
import type { LearningMaterial, Mentor } from '../../types.ts';

export const BEduUmkmView: React.FC = () => {
  const {
    trainings,
    trainingRegistrations,
    mentors,
    mentoringSessions,
    routineCoaching,
    registeredRoutineIds,
    materials,
    registerTraining,
    registerRoutineCoaching,
    bookMentoring,
  } = useApp();

  const [tab, setTab] = useState<'routine' | 'webinar' | 'news' | 'mentoring' | 'training' | 'materials' | 'support'>('routine');
  const [routineModeFilter, setRoutineModeFilter] = useState<'Semua' | 'Online' | 'Offline'>('Semua');
  const [mentorModeFilter, setMentorModeFilter] = useState<'Semua' | 'Online' | 'Offline' | 'Hybrid'>('Semua');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [topic, setTopic] = useState('');
  const [reqDate, setReqDate] = useState(new Date().toISOString().slice(0, 10));
  const [readingMaterial, setReadingMaterial] = useState<LearningMaterial | null>(null);

  const handleBookMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor || !topic.trim()) return;
    await bookMentoring(selectedMentor, topic.trim(), reqDate);
    setSelectedMentor(null);
    setTopic('');
  };

  const filteredRoutines = routineCoaching.filter((item) =>
    routineModeFilter === 'Semua' ? true : item.mode === routineModeFilter
  );

  const filteredMentors = mentors.filter((m) => {
    if (!m.isActive) return false;
    if (mentorModeFilter === 'Semua') return true;
    return (m.mode || 'Hybrid') === mentorModeFilter;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-soft-card flex flex-col sm:flex-row items-center gap-4">
        <BinaExpression mood="idea" className="w-16 h-16" />
        <div>
          <p className="text-xs font-bold text-[#00A39D] uppercase">B-Edu · Webinar, Berita Viral, Mentor & Pembinaan</p>
          <h2 className="font-display text-xl font-extrabold text-[#1E293B]">
            Edukasi, Webinar & Pendampingan UMKM Binaan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ikuti webinar bisnis, pelajari berita UMKM yang sedang viral, jadwal pembinaan rutin online/offline, dan konsultasi mentor ahli.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto">
        {[
          { id: 'routine', label: 'Jadwal Rutin Pembinaan', icon: CalendarClock },
          { id: 'webinar', label: 'Webinar UMKM', icon: Video },
          { id: 'news', label: 'Berita Viral UMKM', icon: Newspaper },
          { id: 'mentoring', label: 'Mentor Pembinaan', icon: Users },
          { id: 'training', label: 'Pelatihan Khusus', icon: GraduationCap },
          { id: 'materials', label: 'Materi & Modul', icon: BookOpen },
          { id: 'support', label: 'Program BSI', icon: CheckCircle2 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === t.id ? 'bg-[#00A39D] text-white' : 'text-slate-600'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'webinar' && <BEduMediaHub section="webinar" audience="umkm" />}
      {tab === 'news' && <BEduMediaHub section="news" audience="umkm" />}

      {tab === 'routine' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl border border-slate-200/80 p-3.5">
            <div>
              <p className="text-xs font-extrabold text-[#1E293B]">Filter Mode Pembinaan Rutin</p>
              <p className="text-[11px] text-slate-500">Pilih kelas daring (Zoom/Meet) atau luring di Sentra BSI</p>
            </div>
            <div className="flex items-center gap-1.5">
              {(['Semua', 'Online', 'Offline'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRoutineModeFilter(mode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    routineModeFilter === mode
                      ? 'bg-[#006B68] text-white'
                      : 'bg-[#F4F6F6] text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoutines.map((rc) => {
              const isJoined = registeredRoutineIds.includes(rc.id);
              const isFull = rc.registeredCount >= rc.quota;
              return (
                <div
                  key={rc.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-extrabold ${
                          rc.mode === 'Online'
                            ? 'bg-[#00A39D]/10 text-[#006B68]'
                            : 'bg-[#F8AD3C]/20 text-[#8B5300]'
                        }`}
                      >
                        {rc.mode === 'Online' ? <Wifi className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        {rc.mode} · {rc.frequency}
                      </span>
                      <span className="text-slate-500 font-semibold tabular-nums">
                        Peserta: {rc.registeredCount}/{rc.quota}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-[#1E293B]">{rc.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{rc.topic}</p>

                    <div className="bg-[#F4F6F6] rounded-xl p-3 space-y-1.5 text-[11px] text-slate-700">
                      <p className="flex items-center gap-1.5 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-[#00A39D] shrink-0" />
                        <span>
                          {rc.dayOfWeek} · {rc.timeWib}
                        </span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#F8AD3C] shrink-0 mt-0.5" />
                        <span>{rc.locationOrLink}</span>
                      </p>
                      <p className="flex items-center gap-1.5 font-semibold text-[#006B68]">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>Mentor Pembina: {rc.mentorName}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isJoined || isFull}
                    onClick={() => registerRoutineCoaching(rc)}
                    className={`w-full h-11 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                      isJoined
                        ? 'bg-[#00A39D]/15 text-[#006B68]'
                        : 'bg-[#00A39D] hover:bg-[#006B68] text-white'
                    }`}
                  >
                    {isJoined
                      ? '✓ Terdaftar di Jadwal Rutin Ini'
                      : isFull
                      ? 'Kuota Sesi Penuh'
                      : `Ikuti Pembinaan ${rc.mode}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'training' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trainings.filter((t) => t.isActive).map((tr) => {
              const isRegistered = trainingRegistrations.some((r) => r.programId === tr.id);
              const full = tr.registeredCount >= tr.quota;
              return (
                <div key={tr.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#00A39D]">{tr.mode}</span>
                      <span className="text-slate-500 tabular-nums">
                        Kuota: {tr.registeredCount}/{tr.quota}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-[#1E293B]">{tr.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{tr.description}</p>
                    <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#00A39D]" /> {tr.schedule}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#F8AD3C]" /> {tr.location}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={isRegistered || full}
                    onClick={() => registerTraining(tr)}
                    className={`w-full h-11 rounded-xl font-bold text-xs cursor-pointer ${
                      isRegistered
                        ? 'bg-[#00A39D]/10 text-[#006B68]'
                        : 'bg-[#00A39D] hover:bg-[#006B68] text-white'
                    }`}
                  >
                    {isRegistered ? 'Sudah Terdaftar' : full ? 'Kuota Penuh' : 'Daftar Pelatihan'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card">
            <h3 className="font-display font-bold text-base text-[#1E293B] mb-3">
              Riwayat Pendaftaran Pelatihan ({trainingRegistrations.length})
            </h3>
            {trainingRegistrations.length === 0 ? (
              <p className="text-xs text-slate-500">Anda belum mendaftar pelatihan apa pun.</p>
            ) : (
              <div className="space-y-2">
                {trainingRegistrations.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-[#F4F6F6] flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{r.programTitle}</span>
                    <span className="font-bold text-[#00A39D]">{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'mentoring' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl border border-slate-200/80 p-3.5">
            <div>
              <p className="text-xs font-extrabold text-[#1E293B]">Direktori Mentor Pembinaan UMKM BSI</p>
              <p className="text-[11px] text-slate-500">Bimbingan privat 1-on-1 secara Online, Offline, atau Hybrid</p>
            </div>
            <div className="flex items-center gap-1.5">
              {(['Semua', 'Online', 'Offline', 'Hybrid'] as const).map((mMode) => (
                <button
                  key={mMode}
                  type="button"
                  onClick={() => setMentorModeFilter(mMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    mentorModeFilter === mMode
                      ? 'bg-[#F8AD3C] text-slate-900'
                      : 'bg-[#F4F6F6] text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mMode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMentors.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#00A39D]/10 text-[#006B68]">
                      {m.mode || 'Hybrid'} {m.city ? `· ${m.city}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {m.rating ?? 4.9} ({m.sessionsCompleted ?? 80}+ sesi)
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#00A39D]">{m.expertise}</p>
                  <h3 className="font-display font-bold text-base text-[#1E293B]">{m.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{m.bio}</p>
                  <p className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#00A39D]" />
                    Jadwal Praktik: {m.schedule}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMentor(m)}
                  className="w-full h-11 rounded-xl bg-[#F8AD3C] hover:bg-[#e59a28] text-slate-900 font-bold text-xs cursor-pointer"
                >
                  Ajukan Konsultasi 1-on-1
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card">
            <h3 className="font-display font-bold text-base text-[#1E293B] mb-3">
              Riwayat Pengajuan Konsultasi ({mentoringSessions.length})
            </h3>
            {mentoringSessions.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada pengajuan konsultasi mentor.</p>
            ) : (
              <div className="space-y-2">
                {mentoringSessions.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-[#F4F6F6] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{s.mentorName} · {s.requestedDate}</p>
                      <p className="text-slate-600 mt-0.5">Topik: {s.topic}</p>
                    </div>
                    <span className="font-bold text-[#006B68]">{s.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'materials' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {materials.map((mat) => (
            <div key={mat.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-soft-card flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#00A39D]">{mat.category}</span>
                  <span className="text-slate-400">{mat.duration}</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#1E293B]">{mat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{mat.summary}</p>
              </div>
              <button
                onClick={() => setReadingMaterial(mat)}
                className="w-full h-11 rounded-xl border border-[#00A39D] text-[#006B68] font-bold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-[#00A39D]/5 cursor-pointer"
              >
                {mat.type === 'Video Pembelajaran' ? <Video className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                Buka {mat.type}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'support' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft-card space-y-4">
          <h3 className="font-display font-extrabold text-lg text-[#1E293B]">
            Program Pendampingan & Fasilitasi BSI UMKM Center
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F4F6F6] space-y-1.5">
              <p className="font-bold text-[#006B68]">Katalog Digital Bersama</p>
              <p className="text-slate-600 leading-relaxed">
                Seluruh UMKM binaan yang telah memperbarui foto dan deskripsi di B-Save otomatis tampil pada katalog kurasi BSI UMKM Center.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F4F6F6] space-y-1.5">
              <p className="font-bold text-[#006B68]">Bazar & Pameran Tematik</p>
              <p className="text-slate-600 leading-relaxed">
                Kesempatan promosi luring pada agenda bazar BSI UMKM Center dan temu mitra bisnis ritel halal.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F4F6F6] space-y-1.5">
              <p className="font-bold text-[#006B68]">Pendampingan Legalitas & B-CHAIN</p>
              <p className="text-slate-600 leading-relaxed">
                Fasilitasi bimbingan NIB, PIRT, sertifikasi Halal, hingga verifikasi transparansi produk melalui B-CHAIN.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Book Mentoring Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleBookMentor} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[#1E293B]">
                Konsultasi: {selectedMentor.name}
              </h3>
              <button type="button" onClick={() => setSelectedMentor(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Konsultasi</label>
              <input
                type="date"
                required
                value={reqDate}
                onChange={(e) => setReqDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Topik / Masalah Usaha</label>
              <textarea
                rows={3}
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Konsultasi strategi kemasan dan pengajuan sertifikat Halal"
                className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm"
              />
            </div>
            <button type="submit" className="w-full h-11 rounded-xl bg-[#00A39D] text-white font-bold text-sm cursor-pointer">
              Kirim Pengajuan Konsultasi
            </button>
          </form>
        </div>
      )}

      {/* Material Reader Modal */}
      {readingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00A39D]">{readingMaterial.type}</span>
              <button onClick={() => setReadingMaterial(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-display text-lg font-extrabold text-[#1E293B]">{readingMaterial.title}</h3>
            <p className="text-xs text-slate-500">{readingMaterial.summary}</p>
            <div className="p-4 rounded-2xl bg-[#F4F6F6] text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {readingMaterial.content}
            </div>
            <button onClick={() => setReadingMaterial(null)} className="w-full h-11 rounded-xl bg-[#00A39D] text-white font-bold text-sm cursor-pointer">
              Tutup Materi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
