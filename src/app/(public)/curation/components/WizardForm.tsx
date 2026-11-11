// Lokasi file: src/app/(public)/curation/components/WizardForm.tsx
// Dynamic & Adaptive Form Wizard — Mendukung 8 Tipe Field, Logika ShowIf & Clario Vision Upload

'use client';

import React, { useState, useEffect } from 'react';
import {
  CurationTemplate,
  FormField,
  FormStep,
} from '@/types/curation.types';
import { storageService } from '@/services/storage.service';
import {
  ChevronLeft,
  ArrowRight,
  Upload,
  X,
  Check,
  Sparkles,
  Loader2,
  Trash2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Props {
  template: CurationTemplate;
  onComplete: (data: any, fileDataUris: string[]) => void;
  onBack: () => void;
}

export default function WizardForm({ template, onComplete, onBack }: Props) {
  const CACHE_KEY = `curation_draft_${template.id}`;

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fileMap, setFileMap] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  const steps = template.steps || [];
  const currentStep = steps[currentStepIdx];
  const isLastStep = currentStepIdx === steps.length - 1;

  // Muat draf tersimpan di localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        setFormData(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Gagal memuat draf form:', e);
    }
  }, [CACHE_KEY]);

  // Simpan draf otomatis ke localStorage
  const updateField = (fieldId: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [fieldId]: value };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleArrayToggle = (fieldId: string, optionValue: string) => {
    const currentList: string[] = Array.isArray(formData[fieldId]) ? formData[fieldId] : [];
    const nextList = currentList.includes(optionValue)
      ? currentList.filter((v) => v !== optionValue)
      : [...currentList, optionValue];
    updateField(fieldId, nextList);
  };

  const handleFileSelect = (fieldId: string, file: File | null) => {
    if (!file) {
      setFileMap((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
      updateField(fieldId, null);
      return;
    }
    setFileMap((prev) => ({ ...prev, [fieldId]: file }));
    updateField(fieldId, `[FILE:${file.name}]`);
  };

  // Evaluasi Logika ShowIf
  const isFieldVisible = (field: FormField) => {
    if (!field.showIf) return true;
    const currentVal = formData[field.showIf.fieldId];
    if (field.showIf.operator === 'not_equals') {
      return currentVal !== field.showIf.value;
    }
    if (field.showIf.operator === 'contains') {
      return Array.isArray(currentVal) && currentVal.includes(String(field.showIf.value));
    }
    return currentVal === field.showIf.value;
  };

  // Validasi Step Aktif
  const validateCurrentStep = () => {
    if (!currentStep) return true;
    for (const f of currentStep.fields) {
      if (f.required && isFieldVisible(f)) {
        const val = formData[f.id];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          toast.error(`Pertanyaan "${f.label}" wajib diisi.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBack();
    }
  };

  // Submit & Upload File/Foto ke Storage + Konversi Base64 untuk Vision
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    setUploadProgressMsg('Mengunggah dokumen bukti...');

    try {
      const storagePaths: string[] = [];
      const fileDataUris: string[] = [];

      for (const [fieldId, file] of Object.entries(fileMap)) {
        if (file instanceof File) {
          // Upload ke Firebase Storage
          const isImg = file.type.startsWith('image/');
          const subPath = isImg ? 'tenants/curation/products' : 'tenants/curation/documents';
          const downloadUrl = isImg
            ? await storageService.uploadImage(file, subPath)
            : await storageService.uploadFile(file, subPath);

          storagePaths.push(downloadUrl);
          formData[`${fieldId}Url`] = downloadUrl;

          // Jika gambar dan ukurannya < 4MB, siapkan base64 data uri untuk Clario Vision
          if (isImg && file.size < 4 * 1024 * 1024) {
            const base64DataUri = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            fileDataUris.push(base64DataUri);
          }
        }
      }

      setUploadProgressMsg('Menjalankan engine Clario AI...');
      // Bersihkan draf lokal
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {}

      onComplete({ ...formData, storageFilePaths: storagePaths }, fileDataUris);
    } catch (err: any) {
      console.error('Error saat submit wizard:', err);
      toast.error('Gagal memproses unggahan: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const handleResetDraft = () => {
    if (confirm('Kosongkan semua isian dan ulangi dari awal?')) {
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {}
      setFormData({});
      setFileMap({});
      setCurrentStepIdx(0);
      toast.success('Draf form telah direset.');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-5.5rem)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-12">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        
        {/* HEADER PROGRESS WIZARD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={16} /> {currentStepIdx === 0 ? 'Pilih Jalur' : 'Langkah Sebelumnya'}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Langkah {currentStepIdx + 1} dari {steps.length}
              </span>
              <button
                type="button"
                onClick={handleResetDraft}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                title="Reset isian"
              >
                <Trash2 size={13} /> Reset
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIdx + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentStep?.title}</h2>
            {currentStep?.description && (
              <p className="text-xs text-slate-500 font-medium mt-1">{currentStep.description}</p>
            )}
          </div>
        </div>

        {/* FORM FIELDS BODY */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {currentStep?.fields.filter(isFieldVisible).map((field) => {
              const isColSpan2 = field.gridSpan === 2 || field.type === 'textarea' || field.type === 'file';

              return (
                <div key={field.id} className={`space-y-2 ${isColSpan2 ? 'sm:col-span-2' : ''}`}>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  {field.description && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">{field.description}</p>
                  )}

                  {/* 1. TEXT INPUT */}
                  {field.type === 'text' && (
                    <Input
                      value={formData[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder || 'Ketik jawaban Anda...'}
                      className="text-xs bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  )}

                  {/* 2. NUMBER INPUT */}
                  {field.type === 'number' && (
                    <Input
                      type="number"
                      value={formData[field.id] || ''}
                      onChange={(e) => updateField(field.id, Number(e.target.value))}
                      placeholder={field.placeholder || '0'}
                      className="text-xs bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  )}

                  {/* 3. TEXTAREA */}
                  {field.type === 'textarea' && (
                    <Textarea
                      rows={4}
                      value={formData[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      placeholder={field.placeholder || 'Uraikan rincian secara lengkap...'}
                      className="text-xs bg-slate-50 border-slate-200 rounded-xl resize-none"
                    />
                  )}

                  {/* 4. SELECT DROPDOWN */}
                  {field.type === 'select' && (
                    <select
                      value={formData[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Pilih salah satu opsi --</option>
                      {field.options?.map((opt, oIdx) => (
                        <option key={oIdx} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* 5. RADIO CARDS */}
                  {field.type === 'radio' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {field.options?.map((opt, oIdx) => {
                        const isChecked = formData[field.id] === opt.value;
                        return (
                          <div
                            key={oIdx}
                            onClick={() => updateField(field.id, opt.value)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                              isChecked
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-indigo-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                isChecked ? 'border-indigo-600 bg-white' : 'border-slate-300'
                              }`}
                            >
                              {isChecked && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs leading-tight block">{opt.label}</span>
                              {opt.description && (
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 6. CHECKBOX CARDS */}
                  {field.type === 'checkbox' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {field.options?.map((opt, oIdx) => {
                        const isChecked = Array.isArray(formData[field.id]) && formData[field.id].includes(opt.value);
                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleArrayToggle(field.id, String(opt.value))}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                              isChecked
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-indigo-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check size={13} className="stroke-[3]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs leading-tight block">{opt.label}</span>
                              {opt.description && (
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 7. FILE & FOTO UPLOAD */}
                  {field.type === 'file' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center px-5 py-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:border-indigo-400 transition-all cursor-pointer">
                          <Upload size={16} className="mr-2.5 text-slate-400" />
                          <span className="truncate max-w-[240px]">
                            {fileMap[field.id]?.name || 'Pilih Berkas / Foto (Maksimal 5MB)'}
                          </span>
                          <input
                            type="file"
                            accept={field.fileAccept || '*'}
                            onChange={(e) => handleFileSelect(field.id, e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                        {fileMap[field.id] && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFileSelect(field.id, null)}
                            className="h-12 w-12 text-rose-500 hover:bg-rose-50 rounded-2xl"
                          >
                            <X size={18} />
                          </Button>
                        )}
                      </div>
                      {fileMap[field.id] && (
                        <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check size={12} /> File terpilih: {fileMap[field.id].name} ({(fileMap[field.id].size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  )}

                  {/* 8. DATE INPUT */}
                  {field.type === 'date' && (
                    <Input
                      type="date"
                      value={formData[field.id] || ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM NAV BUTTONS */}
        <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            className="text-xs font-bold h-11 px-6 rounded-2xl cursor-pointer"
          >
            Kembali
          </Button>

          {!isLastStep ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-11 px-8 rounded-2xl gap-2 shadow-sm cursor-pointer"
            >
              Langkah Berikutnya <ArrowRight size={15} />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-11 px-8 rounded-2xl gap-2 shadow-md cursor-pointer"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {isSubmitting ? uploadProgressMsg || 'Memproses Analisis AI...' : 'Kirim & Dapatkan Hasil AI'}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
