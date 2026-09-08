import React, { useState, useRef } from 'react';
import { Wallet, Category } from '../types';
import { api, triggerHaptic } from '../api';
import { Camera, Upload, Check, RefreshCw, Sparkles, Store, Calendar, CreditCard, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScanViewProps {
  wallets: Wallet[];
  categories: Category[];
  onTransactionCreated: () => void;
  onNavigateHome: () => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  wallets,
  categories,
  onTransactionCreated,
  onNavigateHome
}) => {
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Editable fields for confirmation
  const [editMerchant, setEditMerchant] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const processImageFile = async (file: File) => {
    triggerHaptic('medium');
    setScanning(true);
    setScannedResult(null);

    // Create local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const res = await api.scanReceipt(file);
      const receipt = res.receipt;
      setScannedResult(receipt);
      setEditMerchant(receipt.merchant || "Do'kon xaridi");
      setEditTotal(String(receipt.total || 0));

      const matchedCat = categories.find((c) =>
        c.name.toLowerCase().includes((receipt.category || '').toLowerCase())
      ) || categories[0];
      setEditCategoryId(matchedCat?.id || '');

      triggerHaptic('success');
    } catch (err) {
      console.error('Chekni skanerlashda xatolik:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleTestSample = async () => {
    triggerHaptic('medium');
    setScanning(true);
    setScannedResult(null);
    setPreviewImage(null);

    try {
      const res = await api.scanReceipt();
      const receipt = res.receipt;
      setScannedResult(receipt);
      setEditMerchant(receipt.merchant || "Korzinka Supermarket");
      setEditTotal(String(receipt.total || 0));

      const matchedCat = categories.find((c) =>
        c.name.toLowerCase().includes((receipt.category || '').toLowerCase())
      ) || categories[0];
      setEditCategoryId(matchedCat?.id || '');

      triggerHaptic('success');
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!scannedResult) return;
    const finalAmount = parseFloat(editTotal) || scannedResult.total;
    if (!finalAmount || finalAmount <= 0) return;

    setSaving(true);
    triggerHaptic('success');

    try {
      const cat = categories.find((c) => c.id === editCategoryId) || categories[0];

      await api.createTransaction({
        balance_id: selectedWalletId,
        category_id: cat?.id,
        amount: finalAmount,
        type: 'expense',
        description: `${editMerchant} (Chek skaneri)`
      });

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });

      onTransactionCreated();
      onNavigateHome();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Hidden file inputs for real camera and gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white light:text-[#1d2939]">Chek Skaneri</h2>
          <p className="text-xs text-[#899098]">Do'kon cheklarini real tahlil qilish (AI OCR)</p>
        </div>
        <div className="p-2 rounded-2xl bg-[#29c184]/15 text-[#29c184]">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      {!scannedResult ? (
        <div className="relative overflow-hidden rounded-3xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] p-6 text-center space-y-6">
          {/* Camera Viewfinder Box */}
          <div className="relative w-full aspect-4/3 rounded-2xl bg-[#151d27] border-2 border-dashed border-[#29c184]/50 flex flex-col items-center justify-center p-4 overflow-hidden group">
            {previewImage && (
              <img
                src={previewImage}
                alt="Chek rasmi"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
            )}

            {scanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#29c184] to-transparent shadow-lg shadow-[#29c184] animate-[bounce_2s_infinite]"></div>
            )}

            {/* Corner guides */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#29c184] z-10"></div>
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#29c184] z-10"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#29c184] z-10"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#29c184] z-10"></div>

            <div className="relative z-10 flex flex-col items-center">
              <Camera className="w-12 h-12 text-[#29c184] mb-2 animate-pulse" />
              <p className="text-xs font-bold text-white light:text-[#1d2939]">
                {scanning ? "Sun'iy intellekt OCR matnlarni o'qimoqda..." : "Chekni suratga oling yoki yuklang"}
              </p>
              <p className="text-[11px] text-[#899098] mt-1">
                Korzinka, Makro, Havas, Dorixona yoki istalgan kvitansiya
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={scanning}
              className="w-full py-3.5 rounded-2xl bg-[#29c184] hover:bg-[#25ab75] active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-[#29c184]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>{scanning ? "Skanerlanmoqda..." : "Kamera orqali suratga olish"}</span>
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={scanning}
              className="w-full py-3 rounded-2xl bg-[#151d27] light:bg-[#f2f4f7] border border-[#354454] light:border-[#d0d5dd] hover:border-[#29c184] text-xs font-bold text-[#b6bfd0] light:text-[#475467] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Fayl yoki galereyadan tanlash</span>
            </button>

            <button
              onClick={handleTestSample}
              disabled={scanning}
              className="w-full py-2 rounded-xl text-[11px] text-[#899098] hover:text-[#29c184] transition-colors cursor-pointer"
            >
              Yoki namunaviy chek orqali sinab ko'rish
            </button>
          </div>
        </div>
      ) : (
        /* Scanned Result View */
        <div className="space-y-4">
          <div className="rounded-3xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] p-5 shadow-xl space-y-4">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-[#354454]/50 light:border-[#eaecf0] pb-3">
              <div className="flex-1 pr-2">
                <label className="text-[10px] text-[#899098] font-bold uppercase">Do'kon / Xizmat</label>
                <input
                  type="text"
                  value={editMerchant}
                  onChange={(e) => setEditMerchant(e.target.value)}
                  className="w-full bg-transparent text-white light:text-[#1d2939] font-bold text-base focus:outline-none border-b border-transparent focus:border-[#29c184]"
                />
                <div className="flex items-center gap-1 text-[11px] text-[#899098] mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{scannedResult.date}</span>
                  <span>•</span>
                  <span className="text-[#29c184] font-semibold">Tesseract OCR</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setScannedResult(null);
                  setPreviewImage(null);
                }}
                className="p-1.5 rounded-xl bg-[#151d27] text-[#899098] hover:text-white cursor-pointer"
                title="Qayta skanerlash"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Items table if found */}
            {scannedResult.items && scannedResult.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#b6bfd0] light:text-[#475467] uppercase tracking-wider">
                  Aniqlangan mahsulotlar ({scannedResult.items.length})
                </h4>
                <div className="divide-y divide-[#354454]/40 light:divide-[#eaecf0] max-h-40 overflow-y-auto pr-1">
                  {scannedResult.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                      <span className="text-white/90 light:text-[#1d2939] font-medium truncate max-w-[200px]">
                        {item.name}
                      </span>
                      <span className="font-bold text-white light:text-[#1d2939]">
                        {(item.price * (item.quantity || 1)).toLocaleString('uz-UZ')} so'm
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editable Total */}
            <div className="pt-3 border-t border-[#354454]/60 light:border-[#eaecf0] flex items-center justify-between">
              <span className="text-xs font-bold text-[#b6bfd0] light:text-[#475467]">Jami Summa (so'm):</span>
              <input
                type="number"
                value={editTotal}
                onChange={(e) => setEditTotal(e.target.value)}
                className="text-right text-xl font-black text-[#29c184] bg-transparent border-b border-[#29c184]/40 focus:border-[#29c184] focus:outline-none w-36"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="text-xs text-[#899098] font-bold">Kategoriya:</label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-[#151d27] border border-[#354454] text-white text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select wallet to pay from */}
          <div className="rounded-2xl bg-[#213040] light:bg-white border border-[#354454] p-4 space-y-2">
            <label className="text-xs font-bold text-white light:text-[#1d2939] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#1570ef]" />
              <span>To'lov qaysi hisobdan yechiladi?</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWalletId(w.id)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedWalletId === w.id
                      ? 'border-[#29c184] bg-[#29c184]/15 ring-1 ring-[#29c184]'
                      : 'border-[#354454]/50 bg-[#151d27]/60'
                  }`}
                >
                  <p className="text-xs font-bold text-white light:text-[#1d2939] truncate">{w.name}</p>
                  <p className="text-[11px] text-[#899098]">{w.balance.toLocaleString('uz-UZ')} so'm</p>
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveExpense}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-[#29c184] hover:bg-[#25ab75] active:scale-98 text-white font-extrabold text-base shadow-lg shadow-[#29c184]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>{saving ? "Saqlanmoqda..." : "Xarajatlarga Saqlash"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
