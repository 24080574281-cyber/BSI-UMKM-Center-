import React from 'react';
import { ImageOff, Store } from 'lucide-react';

export type BinaMood =
  | 'wave'
  | 'celebrate'
  | 'thinking'
  | 'idea'
  | 'namaste'
  | 'love'
  | 'surprised'
  | 'chart';

const MOOD_POSITIONS: Record<BinaMood, string> = {
  wave: '0% 0%',
  celebrate: '33.333% 0%',
  thinking: '66.666% 0%',
  idea: '100% 0%',
  namaste: '0% 100%',
  love: '33.333% 100%',
  surprised: '66.666% 100%',
  chart: '100% 100%',
};

export const BrandLogo: React.FC<{ className?: string; showText?: boolean }> = ({
  className = 'h-10 w-10',
  showText = true,
}) => (
  <div className="flex items-center gap-2.5 shrink-0">
    <img
      src="/assets/aistudio/BSI_UMKM_Center_Logo_14700028.png"
      alt="Logo BSI UMKM Center"
      referrerPolicy="no-referrer"
      className={`${className} rounded-xl object-contain bg-white border border-slate-100 p-0.5 shadow-sm`}
    />
    {showText && (
      <div className="leading-tight">
        <span className="block font-display font-extrabold text-sm sm:text-base tracking-tight text-[#006B68] whitespace-nowrap">
          BSI UMKM Center
        </span>
        <span className="block text-[10px] font-medium text-[#00A39D] whitespace-nowrap">
          Empowering MSMEs
        </span>
      </div>
    )}
  </div>
);

export const BinaWelcome: React.FC<{ className?: string }> = ({ className = 'w-44 h-44' }) => (
  <img
    src="/assets/aistudio/Welcoming_Teal_Hijab_Mascot_with_Tablet_71343894.png"
    alt="Maskot BINA BSI UMKM Center"
    referrerPolicy="no-referrer"
    className={`${className} object-contain select-none`}
  />
);

export const BinaExpression: React.FC<{ mood?: BinaMood; className?: string }> = ({
  mood = 'wave',
  className = 'w-14 h-14',
}) => (
  <div
    role="img"
    aria-label={`Ekspresi BINA ${mood}`}
    className={`${className} bina-sprite-cell rounded-2xl bg-white border border-[#00A39D]/20 shrink-0 shadow-sm`}
    style={{ backgroundPosition: MOOD_POSITIONS[mood] }}
  />
);

export const ProductPlaceholder: React.FC<{
  title?: string;
  compact?: boolean;
  isStore?: boolean;
}> = ({ title, compact = false, isStore = false }) => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F4F6F6] via-white to-[#00A39D]/10 text-slate-400 p-3 text-center select-none">
    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#00A39D] mb-1.5 shadow-sm">
      {isStore ? <Store className="w-5 h-5" /> : <ImageOff className="w-5 h-5" />}
    </div>
    {!compact && (
      <>
        <p className="text-[11px] font-semibold text-slate-600 line-clamp-1">
          {title || 'Belum Ada Foto'}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Placeholder · Pemilik toko dapat mengunggah foto
        </p>
      </>
    )}
  </div>
);
