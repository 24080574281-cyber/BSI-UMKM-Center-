import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  Newspaper,
  PlayCircle,
  Radio,
  Search,
  Sparkles,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import type { BEduNewsArticle, BEduWebinar } from '../types.ts';

interface BEduMediaHubProps {
  section: 'news' | 'webinar';
  audience: 'customer' | 'umkm';
  onRequestAuth?: () => void;
  onOpenStoreInMarket?: (storeId: string) => void;
}

export const BEduMediaHub: React.FC<BEduMediaHubProps> = ({
  section,
  audience,
  onRequestAuth,
  onOpenStoreInMarket,
}) => {
  const {
    isAuthenticated,
    webinars,
    registeredWebinarIds,
    newsArticles,
    readNewsIds,
    savedNewsIds,
    registerWebinar,
    markNewsRead,
    toggleSaveNews,
  } = useApp();

  const [newsSearch, setNewsSearch] = useState('');
  const [newsCategory, setNewsCategory] = useState<string>('Semua');
  const [webinarFilter, setWebinarFilter] = useState<'Semua' | BEduWebinar['mode']>('Semua');
  const [readingArticle, setReadingArticle] = useState<BEduNewsArticle | null>(null);
  const [selectedWebinar, setSelectedWebinar] = useState<BEduWebinar | null>(null);

  const filteredNews = useMemo(() => {
    return newsArticles.filter((item) => {
      if (newsCategory === 'Tersimpan' && !savedNewsIds.includes(item.id)) return false;
      if (newsCategory !== 'Semua' && newsCategory !== 'Tersimpan' && item.category !== newsCategory) return false;
      if (newsSearch.trim()) {
        const q = newsSearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [newsArticles, newsCategory, newsSearch, savedNewsIds]);

  const filteredWebinars = useMemo(() => {
    return webinars.filter((w) => (webinarFilter === 'Semua' ? true : w.mode === webinarFilter));
  }, [webinars, webinarFilter]);

  const handleOpenArticle = async (article: BEduNewsArticle) => {
    setReadingArticle(article);
    if (audience === 'customer') {
      await markNewsRead(article);
    }
  };

  const handleRegisterWebinar = async (w: BEduWebinar) => {
    if (!isAuthenticated && onRequestAuth) {
      onRequestAuth();
      return;
    }
    await registerWebinar(w);
  };

  if (section === 'news') {
    const featured = filteredNews[0] || null;
    const restArticles = featured ? filteredNews.slice(1) : [];

    return (
      <div className="space-y-5">
        {/* Search & Category Filter */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3 shadow-soft-card">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-[#1E293B] flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#00A39D]" />
                Kabar UMKM Viral & Tren Bisnis Terkini
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {audience === 'customer'
                  ? 'Ikuti kisah produk lokal yang viral & raih +10 poin literasi per artikel yang dibaca.'
                  : 'Pelajari studi kasus UMKM binaan yang viral untuk diterapkan pada strategi toko Anda.'}
              </p>
            </div>
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-[#00A39D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={newsSearch}
                onChange={(e) => setNewsSearch(e.target.value)}
                placeholder="Cari berita UMKM viral..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#00A39D]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['Semua', 'UMKM Viral', 'Kisah Sukses', 'Tren Pasar & Ekspor', 'Tips Bisnis & Halal', 'Tersimpan'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setNewsCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  newsCategory === cat
                    ? 'bg-[#00A39D] text-white'
                    : 'bg-[#F4F6F6] text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'Tersimpan' ? `Tersimpan (${savedNewsIds.length})` : cat}
              </button>
            ))}
          </div>
        </div>

        {!featured ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Newspaper className="w-9 h-9 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Belum ada berita sesuai filter</p>
            <p className="text-xs text-slate-500">Coba kata kunci atau kategori berita lainnya.</p>
          </div>
        ) : (
          <>
            {/* Featured Viral Headline */}
            <article
              onClick={() => handleOpenArticle(featured)}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-soft-card grid grid-cols-1 md:grid-cols-12 hover:border-[#00A39D] transition-all cursor-pointer group"
            >
              <div className="md:col-span-5 aspect-[16/10] md:aspect-auto md:min-h-[240px] bg-slate-100 relative overflow-hidden">
                <img
                  src={featured.imageUrl}
                  alt={featured.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {featured.isViral && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#F8AD3C] text-slate-900 text-[11px] font-extrabold inline-flex items-center gap-1 shadow">
                    <Flame className="w-3.5 h-3.5" />
                    Sedang Viral
                  </span>
                )}
              </div>
              <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-[#00A39D]">{featured.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featured.source}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featured.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                      <Eye className="w-3.5 h-3.5" /> {featured.viewsLabel}
                    </span>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#1E293B] group-hover:text-[#006B68] leading-snug text-balance">
                    {featured.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {featured.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#006B68] inline-flex items-center gap-1.5">
                    Baca Liputan Lengkap
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex items-center gap-2">
                    {audience === 'customer' && (
                      <span className="text-[11px] font-bold text-[#F8AD3C]">
                        {readNewsIds.includes(featured.id) ? '✓ Sudah Dibaca' : '+10 Poin'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveNews(featured.id);
                      }}
                      aria-label="Simpan artikel"
                      className={`p-2 rounded-xl border cursor-pointer ${
                        savedNewsIds.includes(featured.id)
                          ? 'border-[#00A39D] bg-[#00A39D]/10 text-[#006B68]'
                          : 'border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${savedNewsIds.includes(featured.id) ? 'fill-[#00A39D]' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Remaining News Grid */}
            {restArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {restArticles.map((art) => {
                  const isRead = readNewsIds.includes(art.id);
                  const isSaved = savedNewsIds.includes(art.id);
                  return (
                    <article
                      key={art.id}
                      onClick={() => handleOpenArticle(art)}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-soft-card hover:border-[#00A39D] transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {art.isViral && (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#F8AD3C] text-slate-900 text-[10px] font-extrabold inline-flex items-center gap-1 shadow">
                              <Flame className="w-3 h-3" /> Viral
                            </span>
                          )}
                        </div>
                        <div className="p-4 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-bold text-[#00A39D]">{art.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{art.publishedAt}</span>
                            <span aria-hidden="true">·</span>
                            <span>{art.viewsLabel}</span>
                          </div>
                          <h4 className="font-display font-bold text-sm sm:text-base text-[#1E293B] group-hover:text-[#006B68] leading-snug line-clamp-2">
                            {art.title}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{art.summary}</p>
                        </div>
                      </div>
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#006B68] inline-flex items-center gap-1">
                          Baca Selengkapnya <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex items-center gap-2">
                          {audience === 'customer' && (
                            <span className="text-[11px] font-bold text-[#F8AD3C]">
                              {isRead ? '✓ Dibaca' : '+10 Poin'}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveNews(art.id);
                            }}
                            aria-label="Simpan artikel"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-[#00A39D] cursor-pointer"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#00A39D] text-[#00A39D]' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Full Article Reader Modal */}
        {readingArticle && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="relative aspect-[16/9] bg-slate-900">
                <img
                  src={readingArticle.imageUrl}
                  alt={readingArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReadingArticle(null)}
                  aria-label="Tutup artikel"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center shadow cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 sm:p-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-[#00A39D]">{readingArticle.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{readingArticle.source}</span>
                  <span aria-hidden="true">·</span>
                  <span>{readingArticle.publishedAt}</span>
                  <span aria-hidden="true">·</span>
                  <span>{readingArticle.readTime}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-amber-700">{readingArticle.viewsLabel}</span>
                </div>

                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#1E293B] leading-snug">
                  {readingArticle.title}
                </h2>

                <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {readingArticle.content}
                </div>

                <div className="p-4 rounded-2xl bg-[#F4F6F6] border border-slate-200/80 space-y-2">
                  <p className="text-xs font-extrabold text-[#006B68] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#F8AD3C]" />
                    Intisari & Pembelajaran Utama:
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                    {readingArticle.keyTakeaways.map((tk, idx) => (
                      <li key={idx}>{tk}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleSaveNews(readingArticle.id)}
                    className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 hover:border-[#00A39D] cursor-pointer"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${savedNewsIds.includes(readingArticle.id) ? 'fill-[#00A39D] text-[#00A39D]' : ''}`}
                    />
                    {savedNewsIds.includes(readingArticle.id) ? 'Tersimpan di Favorit' : 'Simpan Artikel'}
                  </button>

                  {readingArticle.relatedStoreId && onOpenStoreInMarket && (
                    <button
                      type="button"
                      onClick={() => {
                        const sid = readingArticle.relatedStoreId!;
                        setReadingArticle(null);
                        onOpenStoreInMarket(sid);
                      }}
                      className="h-11 px-5 rounded-xl bg-[#00A39D] hover:bg-[#006B68] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      Lihat Toko & Sejarahnya di B-Market
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // WEBINAR SECTION
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft-card">
        <div>
          <h2 className="font-display font-extrabold text-base sm:text-lg text-[#1E293B] flex items-center gap-2">
            <Video className="w-4 h-4 text-[#00A39D]" />
            Webinar & Talkshow Ekosistem UMKM BSI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {audience === 'customer'
              ? 'Daftar webinar bisnis inspiratif bersama pelaku UMKM viral & mentor ahli untuk raih +30 poin.'
              : 'Ikuti kelas live webinar nasional & rekaman on-demand untuk melejitkan omzet dan legalitas usaha.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['Semua', 'Live Webinar', 'Hybrid Event', 'Rekaman On-Demand'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setWebinarFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                webinarFilter === m ? 'bg-[#006B68] text-white' : 'bg-[#F4F6F6] text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWebinars.map((w) => {
          const isJoined = registeredWebinarIds.includes(w.id);
          const isFull = w.registeredCount >= w.quota;
          const isOnDemand = w.mode === 'Rekaman On-Demand';
          return (
            <div
              key={w.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-soft-card flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/9] bg-slate-900 relative overflow-hidden">
                  <img
                    src={w.bannerImage}
                    alt={w.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent flex flex-col justify-between p-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 ${
                          isOnDemand
                            ? 'bg-white text-[#006B68]'
                            : 'bg-[#F8AD3C] text-slate-900'
                        }`}
                      >
                        {isOnDemand ? <PlayCircle className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                        {w.mode}
                      </span>
                      {audience === 'customer' && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#00A39D] text-white text-[10px] font-extrabold">
                          +{w.pointsReward} Poin
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#F8AD3C]">{w.status}</p>
                      <h3 className="font-display font-extrabold text-sm sm:text-base text-white leading-snug line-clamp-2">
                        {w.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-[#00A39D]" /> {w.dateLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#F8AD3C]" /> {w.timeWib}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {w.registeredCount}/{w.quota} peserta
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{w.description}</p>

                  <div className="p-3 rounded-xl bg-[#F4F6F6] text-xs space-y-0.5">
                    <p className="font-bold text-[#006B68]">Narasumber: {w.speaker}</p>
                    <p className="text-[11px] text-slate-500">{w.speakerRole}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-5 pb-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWebinar(w)}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 hover:border-[#00A39D] text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Detail & Materi
                </button>
                <button
                  type="button"
                  disabled={isJoined || isFull}
                  onClick={() => handleRegisterWebinar(w)}
                  className={`flex-1 h-11 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    isJoined
                      ? 'bg-[#00A39D]/15 text-[#006B68]'
                      : 'bg-[#00A39D] hover:bg-[#006B68] text-white'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {isOnDemand ? 'Akses Rekaman Aktif' : 'Tiket Webinar Terdaftar'}
                    </>
                  ) : isFull ? (
                    'Kuota Penuh'
                  ) : isOnDemand ? (
                    'Klaim Akses Rekaman'
                  ) : (
                    'Daftar Webinar Gratis'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Webinar Detail & Highlights Modal */}
      {selectedWebinar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="relative aspect-[16/9] bg-slate-900">
              <img
                src={selectedWebinar.bannerImage}
                alt={selectedWebinar.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedWebinar(null)}
                aria-label="Tutup detail webinar"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 text-slate-800 flex items-center justify-center shadow cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-[#00A39D]">{selectedWebinar.mode}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedWebinar.dateLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedWebinar.timeWib}</span>
              </div>
              <h3 className="font-display text-lg font-extrabold text-[#1E293B] leading-snug">
                {selectedWebinar.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{selectedWebinar.description}</p>

              <div className="p-3.5 rounded-2xl bg-[#F4F6F6] space-y-2 text-xs">
                <p className="font-bold text-[#006B68]">Materi yang Akan Dibahas:</p>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
                  {selectedWebinar.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={registeredWebinarIds.includes(selectedWebinar.id)}
                onClick={async () => {
                  await handleRegisterWebinar(selectedWebinar);
                }}
                className={`w-full h-11 rounded-xl font-bold text-xs cursor-pointer ${
                  registeredWebinarIds.includes(selectedWebinar.id)
                    ? 'bg-[#00A39D]/15 text-[#006B68]'
                    : 'bg-[#00A39D] hover:bg-[#006B68] text-white'
                }`}
              >
                {registeredWebinarIds.includes(selectedWebinar.id)
                  ? '✓ Anda Sudah Terdaftar di Webinar Ini'
                  : 'Daftar & Amankan Kursi Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
