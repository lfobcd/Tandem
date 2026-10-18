import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Link, Image as ImageIcon, Check, Sparkles } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface PhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
  prenom?: string;
}

// 4 high-quality preset avatars for quick selection
const AVATAR_PRESETS = [
  {
    id: 'preset_1',
    label: 'Oslo Portrait 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset_2',
    label: 'Oslo Portrait 2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset_3',
    label: 'Oslo Portrait 3',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset_4',
    label: 'Oslo Portrait 4',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
];

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  value,
  onChange,
  prenom = 'Utilisateur',
}) => {
  const { locale } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resize and compress image using HTML5 Canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        locale === 'no'
          ? 'Vennligst velg et gyldig bildefil (JPG, PNG, WebP).'
          : 'Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).'
      );
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            onChange(compressedDataUrl);
          } else {
            onChange(e.target?.result as string);
          }
        } catch {
          onChange(e.target?.result as string);
        } finally {
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setErrorMessage(
          locale === 'no'
            ? 'Kunne ikke lese bildet.'
            : 'Impossible de charger cette image.'
        );
        setIsProcessing(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setErrorMessage(
        locale === 'no' ? 'Feil under lesing av fil.' : 'Erreur lors de la lecture du fichier.'
      );
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim());
      setUrlDraft('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8]">
        {/* Avatar Preview */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-[#EAE5DC] text-[#2E4A3D] font-display text-3xl font-semibold flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-[#E5E1D8]">
            {value ? (
              <img
                src={value}
                alt={prenom}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex flex-col items-center justify-center text-[#8C938E]">
                {prenom ? (
                  prenom.charAt(0).toUpperCase()
                ) : (
                  <Camera className="w-8 h-8 text-[#8C938E]" />
                )}
              </span>
            )}
          </div>

          {/* Quick upload overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-2 bg-[#2E4A3D] text-white rounded-xl shadow-md hover:bg-[#23382E] transition-all cursor-pointer border-2 border-white"
            title={locale === 'no' ? 'Last opp bilde' : 'Télécharger une photo'}
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Drag & Drop / Upload area */}
        <div className="flex-1 w-full space-y-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#2E4A3D] bg-[#E8EDE6]'
                : 'border-[#D9D3C7] hover:border-[#2E4A3D] bg-white'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-[#F2EFE9] text-[#2E4A3D] flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-[#1F2421]">
                {isProcessing
                  ? locale === 'no'
                    ? 'Behandler bilde...'
                    : 'Traitement de la photo...'
                  : locale === 'no'
                  ? 'Klikk eller dra & slipp profilbildet her'
                  : 'Cliquez ou glissez-déposez votre photo ici'}
              </div>
              <p className="text-[11px] text-[#717A74]">
                {locale === 'no'
                  ? 'JPG, PNG eller WebP (automatisk optimalisert)'
                  : 'JPG, PNG ou WebP (optimisé automatiquement)'}
              </p>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              {errorMessage}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#2E4A3D] text-white rounded-lg font-medium hover:bg-[#23382E] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{locale === 'no' ? 'Velg fil' : 'Choisir une photo'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-3 py-1.5 border border-[#E5E1D8] text-[#525E56] hover:text-[#1F2421] bg-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Link className="w-3.5 h-3.5" />
                <span>{locale === 'no' ? 'Bruk bilde-URL' : 'Coller un lien'}</span>
              </button>
            </div>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title={locale === 'no' ? 'Fjern bilde' : 'Supprimer la photo'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{locale === 'no' ? 'Fjern' : 'Supprimer'}</span>
              </button>
            )}
          </div>

          {/* URL Input Toggle */}
          {showUrlInput && (
            <div className="flex gap-2 pt-2">
              <input
                type="url"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#2E4A3D]"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 bg-[#2E4A3D] text-white text-xs font-medium rounded-lg hover:bg-[#23382E] cursor-pointer"
              >
                {locale === 'no' ? 'Bruk' : 'Appliquer'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Avatar Presets */}
      <div className="p-3 bg-white rounded-xl border border-[#E5E1D8] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#525E56] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2E4A3D]" />
            <span>
              {locale === 'no'
                ? 'Eller velg en illustrativ profilavatar i 1-klikk :'
                : 'Ou choisissez un avatar illustratif en 1 clic :'}
            </span>
          </span>
          <span className="text-[10px] text-[#8C938E]">
            {locale === 'no' ? 'Raskt & trygt' : 'Rapide & discret'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {AVATAR_PRESETS.map((preset) => {
            const isSelected = value === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.url)}
                className={`relative p-1 rounded-xl border transition-all flex flex-col items-center gap-1 cursor-pointer group ${
                  isSelected
                    ? 'border-[#2E4A3D] bg-[#F2F6F3] shadow-xs ring-1 ring-[#2E4A3D]'
                    : 'border-[#E5E1D8] bg-[#FAF8F5] hover:border-[#2E4A3D]'
                }`}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#EAE5DC] border border-[#E5E1D8]">
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2E4A3D] text-white flex items-center justify-center text-[9px] shadow-xs">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
