"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import {
  usePresensiHarian,
  useCheckInMutation,
  useCheckOutMutation,
  useKehadiranStatus,
} from "@/hooks/presensi/usePresensi";
import { useKantorList } from "@/hooks/presensi/useKantor";
import { useLKHHarian, useSaveLKHMutation } from "@/hooks/presensi/useLKH";
import {
  useLemburHarian,
  useCheckOutLemburMutation,
  usePengajuanLemburMutation,
} from "@/hooks/presensi/useLembur";
import {
  calculateHaversineDistance,
  calculateEffectiveDistance,
  detectNearestOffice,
  isPointInPolygon,
  isSoloTechnoparkOffice,
  getDistanceToStpCampus,
} from "@/data/presensi/masterKantor";
import { KantorUnit, LKHItem } from "@/types/presensi";
import {
  TARGET_POIN_HARIAN,
  TEMPLAT_AKTIVITAS_STP,
  WORK_SHIFTS,
  WorkShiftConfig,
  TemplatAktivitasSTP,
} from "@/data/presensi/masterAktivitas";
import { VoiceLkhListener, isSpeechRecognitionSupported } from "@/lib/presensi/speech";
import { checkAndTriggerPresensiReminder } from "@/lib/presensi/notifications";
import CameraCapture from "@/components/presensi/CameraCapture";
import { checkGpsIntegrity } from "@/lib/presensi/anti-fraud/client";
import { playSuccessChime, playWarningBeep } from "@/lib/presensi/sound";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MotionStaggerContainer, MotionFadeUp } from "@/components/ui/motion-wrapper";
import {
  MapPin,
  CheckCircle2,
  Clock,
  Building,
  Building2,
  AlertCircle,
  FileText,
  RefreshCw,
  ExternalLink,
  Plus,
  ListTodo,
  Sparkles,
  Award,
  ArrowRight,
  ChevronLeft,
  X,
  Briefcase,
  Lock,
  Unlock,
  AlertTriangle,
  Zap,
  Timer,
  MessageSquare,
  FileSpreadsheet,
  Check,
  Send,
  Mic,
  MicOff,
  Compass,
  Bell,
  Layers,
} from "lucide-react";
import ContextHeroCard from "./ContextHeroCard";

export default function TabAbsensi() {
  const { user } = usePresensiAuth();
  const todayDateStr = new Date().toISOString().split("T")[0];

  // Integrasi data realtime Firestore via TanStack Query
  const { data: presensiData, isLoading: isPresensiLoading } = usePresensiHarian(
    user?.id,
    todayDateStr
  );

  // Status gabungan
  const { data: kehadiranStatus, isLoading: isKehadiranLoading } = useKehadiranStatus(
    user?.id,
    todayDateStr
  );

  const { data: kantorListFromDb } = useKantorList(user?.orgId);
  const kantorList: KantorUnit[] = kantorListFromDb || [];

  // Laporan Kinerja Harian (LKH)
  const { data: lkhData, refetch: refetchLkh } = useLKHHarian(user?.id, todayDateStr);
  const saveLKHMutation = useSaveLKHMutation();

  // Integrasi Tugas Lembur Kedinasan
  const { data: lemburHariIni, refetch: refetchLembur } = useLemburHarian(user?.id, todayDateStr);
  const checkOutLemburMutation = useCheckOutLemburMutation();
  const pengajuanLemburMutation = usePengajuanLemburMutation();

  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  // Waktu reaktif sistem untuk deteksi jam kerja dan shift
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Mode Multi-Shift Operasional Kawasan
  const [selectedShift, setSelectedShift] = useState<keyof typeof WORK_SHIFTS>("reguler");
  const currentShiftConfig = WORK_SHIFTS[selectedShift] || WORK_SHIFTS.reguler;

  const isAfterShiftEnd =
    currentHour > currentShiftConfig.jamBukaPulangHour ||
    (currentHour === currentShiftConfig.jamBukaPulangHour &&
      currentMinute >= currentShiftConfig.jamBukaPulangMinute);

  // Countdown estimasi menuju pembukaan jam pulang sesuai shift
  const remainingTimeToShiftEndStr = useMemo(() => {
    if (isAfterShiftEnd) return null;
    const target = new Date(currentTime);
    target.setHours(
      currentShiftConfig.jamBukaPulangHour,
      currentShiftConfig.jamBukaPulangMinute,
      0,
      0
    );
    const diffMs = target.getTime() - currentTime.getTime();
    if (diffMs <= 0) return null;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHrs > 0) {
      return `${diffHrs} jam ${diffMins} menit lagi`;
    }
    return `${diffMins} menit lagi`;
  }, [currentTime, isAfterShiftEnd, currentShiftConfig]);

  // Mode Dinas Luar / Penugasan Luar Kawasan
  const [isDinasLuar, setIsDinasLuar] = useState<boolean>(false);
  const [dinasLuarPerihal, setDinasLuarPerihal] = useState<string>("");

  // Capaian LKH Hari Ini
  const totalLkhKegiatan = lkhData?.kegiatan?.length || 0;
  const totalLkhPoin = lkhData?.totalPoinHarian || 0;
  const lkhPercentage = Math.min(100, Math.round((totalLkhPoin / TARGET_POIN_HARIAN) * 100));
  const hasSubmittedLkh = totalLkhKegiatan >= 1; // Syarat mutlak: minimal 1 laporan kegiatan

  // Otomatisasi Pengingat Presensi & LKH (Browser Web Notification)
  useEffect(() => {
    if (presensiData) {
      checkAndTriggerPresensiReminder({
        hasCheckedIn: Boolean(presensiData.checkIn?.waktu),
        hasCheckedOut: Boolean(presensiData.checkOut?.waktu),
        hasLkh: hasSubmittedLkh,
      });
    }
  }, [presensiData, hasSubmittedLkh]);

  // State alur presensi pulang
  // Secara default FALSE setelah check-in: tidak langsung ready checkout agar pegawai fokus mencatat aktivitas LKH
  const [isReadyForCheckout, setIsReadyForCheckout] = useState<boolean>(false);
  const [showEarlyCheckoutConfirm, setShowEarlyCheckoutConfirm] = useState<boolean>(false);

  // State Modal Input Cepat LKH / Aktivitas
  const [showQuickLkhModal, setShowQuickLkhModal] = useState<boolean>(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickKategori, setQuickKategori] = useState("Teknis");
  const [quickDeskripsi, setQuickDeskripsi] = useState("");
  const [quickDurasi, setQuickDurasi] = useState<number>(60);
  const [quickOutput, setQuickOutput] = useState("");
  const [quickPoin, setQuickPoin] = useState<number>(60);
  const [isSavingLkh, setIsSavingLkh] = useState(false);

  // Voice-to-Text Input LKH State
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const voiceListenerRef = React.useRef<VoiceLkhListener | null>(null);

  const toggleVoiceInput = () => {
    if (isVoiceListening) {
      voiceListenerRef.current?.stop();
      setIsVoiceListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert("Browser Anda belum mendukung input suara langsung. Anda dapat mengetik manual.");
      return;
    }

    voiceListenerRef.current = new VoiceLkhListener({
      lang: "id-ID",
      onStart: () => setIsVoiceListening(true),
      onResult: (transcript) => {
        setQuickTitle(transcript);
        if (!quickDeskripsi) {
          setQuickDeskripsi(`Uraian pelaksanaan: ${transcript}`);
        }
      },
      onError: (msg) => {
        setIsVoiceListening(false);
        console.warn("[Voice LKH] Error:", msg);
      },
      onEnd: () => setIsVoiceListening(false),
    });

    voiceListenerRef.current.start();
  };

  // Terapkan templat aktivitas rutin STP (1-Klik)
  const handleApplyTemplate = (tpl: TemplatAktivitasSTP) => {
    setQuickTitle(tpl.nama);
    setQuickKategori(tpl.kategori);
    setQuickDurasi(tpl.durasiMenit);
    setQuickOutput(tpl.output);
    setQuickPoin(tpl.poin);
    setQuickDeskripsi(tpl.deskripsi);
  };

  // State Modal Cepat Pengajuan Lembur
  const [showQuickLemburModal, setShowQuickLemburModal] = useState<boolean>(false);
  const [quickLemburMulai, setQuickLemburMulai] = useState("16:30");
  const [quickLemburSelesai, setQuickLemburSelesai] = useState("19:00");
  const [quickLemburAlasan, setQuickLemburAlasan] = useState("");
  const [isSubmittingLembur, setIsSubmittingLembur] = useState(false);

  // Salin uraian tugas lembur aktif ke form LKH (1-klik integrasi)
  const handleCopyLemburToLkh = () => {
    if (!lemburHariIni) return;
    setQuickTitle(`[Tugas Lembur] ${lemburHariIni.alasanLembur}`);
    setQuickKategori("Teknis");
    setQuickDeskripsi(
      `Melaksanakan tugas lembur kedinasan resmi (${
        lemburHariIni.jenis === "hari_kerja" ? "Hari Kerja" : "Hari Libur"
      }). Waktu pelaksanaan: ${lemburHariIni.jamMulaiRencana} - ${
        lemburHariIni.jamSelesaiRencana
      } WIB. Disetujui oleh: ${lemburHariIni.atasanNama || "Atasan Langsung"}.`
    );
    setQuickOutput("Laporan Pelaksanaan Tugas Lembur Kedinasan");
    setQuickDurasi(lemburHariIni.durasiLemburMenit || 120);
    setQuickPoin(100);
    setShowQuickLkhModal(true);
  };

  // Kirim pesan WhatsApp konfirmasi lembur ke atasan
  const handleSendWhatsAppLemburReminder = () => {
    if (!lemburHariIni) return;
    const pesan = `*Pemberitahuan Pengajuan Tugas Lembur - Techno Sign Solo Technopark*\n\nYth. Bapak/Ibu ${
      lemburHariIni.atasanNama || "Atasan"
    },\nSaya mengajukan permohonan tugas lembur hari ini (${todayDateStr}) pukul ${
      lemburHariIni.jamMulaiRencana
    } s.d. ${lemburHariIni.jamSelesaiRencana} WIB.\nAlasan/Uraian: "${
      lemburHariIni.alasanLembur
    }".\nMohon kesediaannya untuk meninjau dan menyetujui di sistem Techno Sign:\nhttps://katalog.solotechnopark.id/presensi/approval\n\nTerima kasih.`;
    const encoded = encodeURIComponent(pesan);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  // Submit pengajuan lembur cepat
  const handleQuickLemburSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!user.atasanId) {
      alert("Atasan langsung Anda belum ditetapkan. Hubungi Admin BKPSDM.");
      return;
    }
    if (!quickLemburAlasan.trim() || quickLemburAlasan.trim().length < 10) {
      alert("Alasan lembur wajib diisi minimal 10 karakter.");
      return;
    }

    setIsSubmittingLembur(true);
    try {
      const res = await pengajuanLemburMutation.mutateAsync({
        userId: user.id,
        nip: user.nip,
        nama: user.nama,
        orgId: user.orgId,
        tanggal: todayDateStr,
        jenis: "hari_kerja",
        alasanLembur: quickLemburAlasan.trim(),
        jamMulaiRencana: quickLemburMulai,
        jamSelesaiRencana: quickLemburSelesai,
        atasanId: user.atasanId,
        atasanNama: user.atasanNama || "Atasan Langsung",
      });

      if (res.success) {
        playSuccessChime();
        setShowQuickLemburModal(false);
        setQuickLemburAlasan("");
        await refetchLembur();
      } else {
        alert(res.message || "Gagal mengajukan lembur.");
      }
    } catch (err) {
      alert("Terjadi kesalahan: " + (err as Error).message);
    } finally {
      setIsSubmittingLembur(false);
    }
  };

  // Koordinat user dari GPS (null sampai GPS berhasil)
  const [gpsStatus, setGpsStatus] = useState<"locating" | "success" | "denied">("locating");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | undefined>(undefined);
  const [isMockDetected, setIsMockDetected] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // State foto dari kamera nyata
  const [capturedFotoUrl, setCapturedFotoUrl] = useState<string | null>(
    presensiData?.checkIn?.fotoUrl || null
  );
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkOutError, setCheckOutError] = useState<string | null>(null);

  // Kalibrasi GPS Hardware Satelit
  const calibrateGps = (forceHighAccuracy = true) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsError("Browser tidak mendukung GPS.");
      setGpsStatus("denied");
      return;
    }

    setIsCalibrating(true);
    setGpsStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const integrity = checkGpsIntegrity(position);
        setGpsAccuracy(integrity.accuracy);

        if (integrity.isMock) {
          setIsMockDetected(true);
          setGpsStatus("denied");
          setGpsError(integrity.warning || "Terdeteksi aplikasi Mock Location (Fake GPS).");
          setIsCalibrating(false);
          return;
        }

        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsStatus("success");
        setGpsError(null);
        setIsCalibrating(false);
      },
      (err) => {
        let msg = "Sinyal GPS satelit belum terkunci.";
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          msg = "Izin lokasi GPS ditolak di browser. Aktifkan izin lokasi lalu muat ulang.";
        } else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
          msg = "Sinyal GPS satelit tidak tersedia. Pastikan berada di area dengan visibilitas langit memadai.";
        } else if (err.code === GeolocationPositionError.TIMEOUT) {
          msg = "Waktu pencarian satelit GPS habis. Menghubungkan ulang...";
        }
        setGpsError(msg);
        setIsCalibrating(false);
      },
      {
        enableHighAccuracy: forceHighAccuracy,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsError("Browser tidak mendukung GPS. Presensi tidak dapat dilakukan.");
      setGpsStatus("denied");
      return;
    }

    calibrateGps(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const integrity = checkGpsIntegrity(position);
        setGpsAccuracy(integrity.accuracy);

        if (integrity.isMock) {
          setIsMockDetected(true);
          setGpsStatus("denied");
          setGpsError(integrity.warning || "Terdeteksi aplikasi Mock Location (Fake GPS).");
          return;
        }

        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsStatus("success");
        setGpsError(null);
      },
      (err) => {
        let msg = "GPS tidak tersedia.";
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          msg = "Izin lokasi GPS ditolak. Aktifkan izin lokasi di browser lalu muat ulang halaman.";
        } else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
          msg = "Sinyal GPS tidak tersedia di lokasi Anda saat ini.";
        } else if (err.code === GeolocationPositionError.TIMEOUT) {
          msg = "GPS timeout. Pastikan Anda berada di tempat dengan sinyal GPS yang baik.";
        }
        setGpsError(msg);
        setGpsStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Perhitungan jarak untuk semua kantor
  const nearestResult = useMemo(() => {
    if (!coords) return null;
    return detectNearestOffice(coords, kantorList, gpsAccuracy);
  }, [coords, kantorList, gpsAccuracy]);

  const activeOffice: KantorUnit | undefined = useMemo(() => {
    const office = nearestResult?.nearestOffice || kantorList[0];
    if (!office) return undefined;
    if (isSoloTechnoparkOffice(office)) {
      return {
        ...office,
        radiusMeter: Math.max(office.radiusMeter || 150, 200),
      };
    }
    return office;
  }, [nearestResult, kantorList]);

  const currentDistance = useMemo(() => {
    if (!coords || !activeOffice) return null;
    if (isSoloTechnoparkOffice(activeOffice)) {
      return getDistanceToStpCampus(coords).minDistanceMeters;
    }
    return calculateHaversineDistance(coords, activeOffice.koordinat);
  }, [coords, activeOffice]);

  const closestFacilityName = useMemo(() => {
    if (!coords || !activeOffice) return null;
    if (isSoloTechnoparkOffice(activeOffice)) {
      return getDistanceToStpCampus(coords).closestAnchorName;
    }
    return activeOffice.namaKantor;
  }, [coords, activeOffice]);

  const effectiveDistance = useMemo(() => {
    if (currentDistance === null) return null;
    return calculateEffectiveDistance(currentDistance, gpsAccuracy);
  }, [currentDistance, gpsAccuracy]);

  const isStp = useMemo(() => {
    return isSoloTechnoparkOffice(activeOffice);
  }, [activeOffice]);

  const isWithinRadius = activeOffice
    ? effectiveDistance !== null && effectiveDistance <= activeOffice.radiusMeter
    : false;

  const isWithinPolygon = useMemo(() => {
    if (!coords) return false;
    return isPointInPolygon(coords, activeOffice?.polygonCoordinates);
  }, [coords, activeOffice]);

  const isValidLocation = Boolean(isDinasLuar || isWithinRadius || (isStp && isWithinPolygon));

  const formatTimeString = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return (
      date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  const checkInTime = formatTimeString(presensiData?.checkIn?.waktu);
  const checkOutTime = formatTimeString(presensiData?.checkOut?.waktu);
  const isProcessing = checkInMutation.isPending || checkOutMutation.isPending;

  // Durasi jam kerja yang sedang/sudah berjalan
  const workDurationStr = useMemo(() => {
    if (!presensiData?.checkIn?.waktu) return null;
    const inTime = new Date(presensiData.checkIn.waktu).getTime();
    const outTime = presensiData?.checkOut?.waktu
      ? new Date(presensiData.checkOut.waktu).getTime()
      : currentTime.getTime();
    const diffMs = Math.max(0, outTime - inTime);
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs} Jam ${diffMins} Menit`;
  }, [presensiData, currentTime]);

  const isCutiOrIzin =
    presensiData?.status === "cuti" ||
    presensiData?.status === "izin" ||
    presensiData?.status === "sakit" ||
    presensiData?.status === "dinas";

  const handleFotoCaptured = (fotoUrl: string, sizeBytes: number) => {
    setCapturedFotoUrl(fotoUrl);
    console.info(`[Presensi] Foto diupload: ${fotoUrl}, ukuran: ${sizeBytes} bytes`);
  };

  // Check-In
  const handleCheckIn = async () => {
    if (!user || !coords || !activeOffice) return;
    if (!capturedFotoUrl) {
      playWarningBeep();
      setCheckInError("Harap ambil swafoto terlebih dahulu sebelum check-in.");
      return;
    }
    if (!isValidLocation) {
      playWarningBeep();
      setCheckInError(
        `Lokasi presensi belum valid (${currentDistance}m dari ${activeOffice.namaKantor}, batas: ${activeOffice.radiusMeter}m). Silakan gunakan tombol 'Kalibrasi GPS' di atas atau aktifkan 'Mode Dinas Luar' jika bertugas di luar kawasan.`
      );
      return;
    }

    setCheckInError(null);
    try {
      const checkInCatatan = isDinasLuar
        ? `[Dinas Luar: ${dinasLuarPerihal.trim() || "Penugasan Luar Kawasan"}] Presensi Masuk (Shift ${currentShiftConfig.label}) di ${activeOffice.namaKantor}`
        : `Presensi Masuk (Shift ${currentShiftConfig.label}) di ${activeOffice.namaKantor}`;

      const result = await checkInMutation.mutateAsync({
        userId: user.id,
        nip: user.nip,
        nama: user.nama,
        orgId: user.orgId,
        tanggal: todayDateStr,
        kantorId: activeOffice.id,
        namaKantor: isDinasLuar
          ? `Dinas Luar: ${dinasLuarPerihal.trim() || "Luar Kawasan"}`
          : activeOffice.namaKantor,
        jarakMeter: isDinasLuar ? 0 : (effectiveDistance ?? currentDistance ?? undefined),
        koordinat: coords,
        fotoUrl: capturedFotoUrl,
        isValidLocation: isValidLocation,
        alamat: isDinasLuar && dinasLuarPerihal ? `Lokasi Dinas Luar: ${dinasLuarPerihal}` : activeOffice.alamat,
        catatan: checkInCatatan,
        gpsAccuracyMeter: gpsAccuracy,
        isMockDetected,
      });
      if (!result.success) {
        if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate([50, 100, 50]);
        playWarningBeep();
        setCheckInError(result.message || "Check-in gagal. Coba lagi.");
      } else {
        if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        playSuccessChime();
        // Reset foto captured agar foto check-in tidak otomatis terbawa ke checkout
        setCapturedFotoUrl(null);
        setIsReadyForCheckout(false);
      }
    } catch (err) {
      playWarningBeep();
      setCheckInError((err as Error).message || "Check-in gagal. Hubungi administrator.");
    }
  };

  // Check-Out
  const handleCheckOut = async () => {
    if (!user || !coords || !activeOffice) return;

    // Validasi Mutlak: Wajib mengisi minimal 1 LKH hari ini
    if (!hasSubmittedLkh) {
      playWarningBeep();
      setCheckOutError(
        "Wajib mengisi setidaknya 1 laporan aktivitas harian (LKH) sebelum melakukan presensi pulang."
      );
      return;
    }

    if (!capturedFotoUrl) {
      playWarningBeep();
      setCheckOutError("Harap ambil swafoto kepulangan terlebih dahulu.");
      return;
    }
    if (capturedFotoUrl === presensiData?.checkIn?.fotoUrl) {
      playWarningBeep();
      setCheckOutError("Anda tidak dapat menggunakan foto Check-In untuk Check-Out. Harap ambil swafoto baru.");
      return;
    }
    if (!isValidLocation) {
      playWarningBeep();
      setCheckOutError(
        `Lokasi presensi belum valid (${currentDistance}m dari ${activeOffice.namaKantor}, batas: ${activeOffice.radiusMeter}m). Silakan tekan tombol 'Kalibrasi GPS' di atas atau aktifkan 'Mode Dinas Luar' jika bertugas di luar kawasan.`
      );
      return;
    }

    setCheckOutError(null);
    try {
      const isLemburApproved = lemburHariIni && lemburHariIni.status === "disetujui";
      const lemburNote = isLemburApproved
        ? ` (Lembur Kedinasan Disetujui: ${lemburHariIni.jamMulaiRencana}-${lemburHariIni.jamSelesaiRencana})`
        : "";

      const checkOutCatatan = isDinasLuar
        ? `[Dinas Luar: ${dinasLuarPerihal.trim() || "Penugasan Luar Kawasan"}] Presensi Pulang (Shift ${currentShiftConfig.label})${lemburNote} di ${activeOffice.namaKantor}`
        : `Presensi Pulang (Shift ${currentShiftConfig.label})${lemburNote} di ${activeOffice.namaKantor}`;

      const result = await checkOutMutation.mutateAsync({
        userId: user.id,
        tanggal: todayDateStr,
        kantorId: activeOffice.id,
        namaKantor: isDinasLuar
          ? `Dinas Luar: ${dinasLuarPerihal.trim() || "Luar Kawasan"}`
          : activeOffice.namaKantor,
        jarakMeter: isDinasLuar ? 0 : (effectiveDistance ?? currentDistance ?? undefined),
        koordinat: coords,
        fotoUrl: capturedFotoUrl,
        isValidLocation: isValidLocation,
        alamat: isDinasLuar && dinasLuarPerihal ? `Lokasi Dinas Luar: ${dinasLuarPerihal}` : activeOffice.alamat,
        catatan: checkOutCatatan,
        gpsAccuracyMeter: gpsAccuracy,
        isMockDetected,
      });

      if (!result.success) {
        if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate([50, 100, 50]);
        playWarningBeep();
        setCheckOutError(result.message || "Check-out gagal. Coba lagi.");
      } else {
        // Sinkronisasi penyelesaian status lembur (jika lembur aktif)
        if (isLemburApproved && lemburHariIni.checkInLembur && !lemburHariIni.checkOutLembur) {
          try {
            await checkOutLemburMutation.mutateAsync({
              userId: user.id,
              tanggal: todayDateStr,
              kantorId: activeOffice.id,
              koordinat: coords,
              fotoUrl: capturedFotoUrl,
              isValidLocation: isValidLocation,
              jarakMeter: effectiveDistance ?? currentDistance ?? undefined,
              gpsAccuracyMeter: gpsAccuracy,
              isMockDetected,
            });
            await refetchLembur();
          } catch (lemburErr) {
            console.warn("[Presensi Pulang] Sinkronisasi lembur checkout background:", lemburErr);
          }
        }

        if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        playSuccessChime();
        setIsReadyForCheckout(false);
      }
    } catch (err) {
      playWarningBeep();
      setCheckOutError((err as Error).message || "Check-out gagal. Hubungi administrator.");
    }
  };

  // Simpan Aktivitas Cepat LKH
  const handleSaveQuickLkh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quickTitle.trim()) {
      alert("Harap isi nama kegiatan atau aktivitas.");
      return;
    }

    setIsSavingLkh(true);
    try {
      const existingKegiatan = lkhData?.kegiatan || [];
      const nowStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      const newItem: LKHItem = {
        id: `act_${Date.now()}`,
        jamMulai: nowStr,
        jamSelesai: nowStr,
        namaAktivitasBaku: quickTitle.trim(),
        kategoriAktivitas: quickKategori,
        deskripsi: quickDeskripsi.trim() || quickTitle.trim(),
        outputKegiatan: quickOutput.trim() || "Terselesaikan / Kegiatan Berjalan",
        volumeKegiatan: 1,
        satuanKegiatan: "Kegiatan",
        nilaiPoin: Number(quickPoin) || 60,
        totalPoin: Number(quickPoin) || 60,
      };

      await saveLKHMutation.mutateAsync({
        userId: user.id,
        nip: user.nip,
        nama: user.nama,
        orgId: user.orgId,
        tanggal: todayDateStr,
        kegiatan: [...existingKegiatan, newItem],
        status: lkhData?.status || "draft",
      });

      playSuccessChime();
      setShowQuickLkhModal(false);
      setQuickTitle("");
      setQuickDeskripsi("");
      setQuickOutput("");
      await refetchLkh();
    } catch (err) {
      console.error("Gagal menyimpan aktivitas:", err);
      alert("Gagal menyimpan aktivitas: " + (err as Error).message);
    } finally {
      setIsSavingLkh(false);
    }
  };

  if (isPresensiLoading || isKehadiranLoading) {
    return (
      <div className="space-y-6 animate-pulse pt-2">
        <div className="h-[120px] bg-slate-200/60 rounded-none sm:rounded-3xl w-full"></div>
        <div className="flex justify-between items-center px-4 sm:px-0">
          <div className="space-y-2">
            <div className="h-5 bg-slate-200/60 w-32 rounded-full"></div>
            <div className="h-3 bg-slate-200/60 w-48 rounded-full"></div>
          </div>
          <div className="h-8 bg-slate-200/60 w-24 rounded-full"></div>
        </div>
        <div className="h-16 bg-slate-200/60 rounded-none sm:rounded-3xl w-full"></div>
        <div className="h-[300px] bg-slate-200/60 rounded-none sm:rounded-3xl w-full"></div>
      </div>
    );
  }

  return (
    <MotionStaggerContainer className="space-y-6">
      {/* Hero Card */}
      <MotionFadeUp>
        <ContextHeroCard
          status={kehadiranStatus?.statusKehadiran}
          presensiData={presensiData}
          user={user}
        />
      </MotionFadeUp>

      {/* Header Status Bar */}
      <MotionFadeUp className="flex items-center justify-between px-4 sm:px-0">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
            {checkInTime && !checkOutTime && !isReadyForCheckout
              ? "Status Jam Kerja & Aktivitas"
              : isReadyForCheckout
              ? "Kamera Presensi Pulang"
              : "Kamera Presensi Masuk"}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isDinasLuar ? (
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1.5 text-[10px] font-bold border-indigo-200 bg-indigo-50 text-indigo-700 shadow-xs"
            >
              <Compass className="w-3 h-3 mr-1 text-indigo-600" />
              Mode Dinas Luar (Valid)
            </Badge>
          ) : gpsStatus === "success" && activeOffice ? (
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold border shadow-xs ${
                isValidLocation
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {isValidLocation
                ? isWithinRadius
                  ? `✓ ${currentDistance}m (Radius)`
                  : `✓ Kawasan STP (Poligon Valid)`
                : `✗ ${currentDistance}m (Luar)`}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1.5 text-[10px] font-bold border-amber-200 bg-amber-50 text-amber-700 shadow-xs animate-pulse"
            >
              <MapPin className="w-3 h-3 mr-1" /> GPS Loading...
            </Badge>
          )}
        </div>
      </MotionFadeUp>

      {isCutiOrIzin ? (
        <MotionFadeUp className="mt-4 px-4 sm:px-0">
          <div className="card-base p-6 text-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border border-violet-200/80 shadow-md sm:rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center mx-auto mb-3.5 shadow-md">
              <FileText className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200 text-[11px] font-bold uppercase mb-2">
              Dispensasi Presensi Kedinasan
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">
              Hari Ini Berstatus: {presensiData?.status?.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed mb-4">
              {presensiData?.keterangan ||
                "Pengajuan izin/cuti kedinasan Anda telah disetujui secara resmi oleh atasan penilai."}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Link href="/presensi/scan?tab=izin">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-violet-200 text-violet-700 hover:bg-violet-100/60 rounded-xl"
                >
                  Lihat Berkas Cuti / Izin
                </Button>
              </Link>
            </div>
          </div>
        </MotionFadeUp>
      ) : !activeOffice ? (
        <MotionFadeUp className="mt-4 px-4 sm:px-0">
          <div className="card-base p-8 text-center bg-amber-50/80 backdrop-blur-xl border-amber-100 sm:border-amber-100">
            <Building2 className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-extrabold text-amber-900 mb-2">Belum Ada Lokasi</h3>
            <p className="text-xs text-amber-700/80 leading-relaxed max-w-[250px] mx-auto">
              Admin belum mendaftarkan titik koordinat kantor untuk unit kerja Anda.
            </p>
          </div>
        </MotionFadeUp>
      ) : (
        <MotionFadeUp className="space-y-4 mt-4">
          {/* Card Pengaturan Shift Operasional & Mode Dinas Luar */}
          <div className="card-base bg-white/95 backdrop-blur-md p-3.5 sm:p-4 border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Shift Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Shift Kerja Operasional
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(WORK_SHIFTS) as Array<keyof typeof WORK_SHIFTS>).map((shiftKey) => {
                    const cfg = WORK_SHIFTS[shiftKey];
                    const isSelected = selectedShift === shiftKey;
                    return (
                      <button
                        key={shiftKey}
                        type="button"
                        onClick={() => setSelectedShift(shiftKey)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode Dinas Luar Toggle */}
              <div className="sm:border-l sm:border-slate-200 sm:pl-4 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  Penugasan Luar Kawasan
                </label>
                <button
                  type="button"
                  onClick={() => setIsDinasLuar(!isDinasLuar)}
                  className={`w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between sm:justify-start gap-2 border cursor-pointer ${
                    isDinasLuar
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{isDinasLuar ? "✓ Mode Dinas Luar Aktif" : "Aktifkan Dinas Luar"}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isDinasLuar ? "bg-amber-300 animate-ping" : "bg-slate-300"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Field Input Perihal Dinas Luar saat mode dinas luar aktif */}
            {isDinasLuar && (
              <div className="pt-2 border-t border-indigo-100 animate-in fade-in space-y-1">
                <label className="text-[10px] font-semibold text-indigo-900">
                  Perihal / Lokasi Penugasan Dinas Luar:
                </label>
                <Input
                  type="text"
                  placeholder="misal: Rapat koordinasi di Bappeda Kota Surakarta / Kunjungan industri Semarang"
                  value={dinasLuarPerihal}
                  onChange={(e) => setDinasLuarPerihal(e.target.value)}
                  className="h-8 text-xs bg-indigo-50/50 border-indigo-200 text-indigo-950 focus:border-indigo-500"
                />
                <p className="text-[10px] text-indigo-600">
                  ℹ️ Lokasi GPS di luar kawasan tetap diizinkan dan dicatat resmi sebagai penugasan dinas luar.
                </p>
              </div>
            )}
          </div>

          {/* Office Pill Indicator */}
          <div className="card-base bg-white/70 backdrop-blur-xl p-4 flex items-center gap-3.5 relative group border-white/50">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0 border border-emerald-50">
              <Building className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0 z-10">
              <h2 className="font-bold text-slate-800 text-sm truncate">{activeOffice.namaKantor}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {isStp && closestFacilityName && closestFacilityName !== activeOffice.namaKantor
                    ? `Fasilitas: ${closestFacilityName} (Radius ${activeOffice.radiusMeter}m)`
                    : `Target radius ${activeOffice.radiusMeter}m`}
                </p>
              </div>
            </div>
          </div>

          {/* Live GPS Precision Inspector */}
          <div className="card-base bg-white/90 backdrop-blur-md p-3.5 space-y-2.5 border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    gpsAccuracy && gpsAccuracy <= 20
                      ? "bg-emerald-500 ring-2 ring-emerald-200 animate-pulse"
                      : gpsAccuracy && gpsAccuracy <= 50
                      ? "bg-blue-500 ring-2 ring-blue-200"
                      : "bg-amber-500 ring-2 ring-amber-200 animate-ping"
                  }`}
                />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {isCalibrating
                    ? "Mengunci Satelit GPS..."
                    : gpsAccuracy
                    ? `Akurasi GPS: ±${Math.round(gpsAccuracy)}m (${
                        gpsAccuracy <= 20
                          ? "Sangat Presisi"
                          : gpsAccuracy <= 50
                          ? "Cukup Baik"
                          : "Triangulasi Sinyal"
                      })`
                    : "Mendeteksi Posisi..."}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {coords && (
                  <a
                    href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    Peta
                  </a>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => calibrateGps(true)}
                  disabled={isCalibrating}
                  className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isCalibrating ? "animate-spin text-emerald-600" : ""}`} />
                  {isCalibrating ? "Mengunci..." : "Kalibrasi GPS"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] border-t border-slate-100">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] text-slate-400 font-medium">Koordinat Anda:</span>
                <p className="font-mono text-slate-700 font-semibold truncate text-[10px]">
                  {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Mencari sinyal..."}
                </p>
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] text-slate-400 font-medium">
                  {isStp ? "Jarak ke Fasilitas:" : "Jarak ke Kantor:"}
                </span>
                <p className="font-semibold text-slate-800 truncate text-[10px]">
                  {currentDistance !== null ? `${currentDistance}m` : "Menghitung..."}
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* KONDISI 1: SUDAH CHECK-IN DAN BELUM SIAP CHECKOUT               */}
          {/* Tampilkan Hub Aktivitas Kerja & Laporan Kinerja (LKH)            */}
          {/* ============================================================== */}
          {checkInTime && !checkOutTime && !isReadyForCheckout ? (
            <div className="space-y-5">
              {/* Kartu Status Kerja Berjalan */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-md relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                      <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold uppercase mb-1 border border-emerald-400/30">
                        Presensi Masuk Tercatat
                      </div>
                      <h3 className="text-base font-extrabold text-white">
                        Hadir Pukul {checkInTime}
                      </h3>
                      <p className="text-[11px] text-emerald-100/90 mt-0.5">
                        Lokasi: {activeOffice.namaKantor}
                      </p>
                    </div>
                  </div>

                  {workDurationStr && (
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-emerald-200 font-medium">Jam Kerja Berjalan</div>
                      <div className="text-xs font-black text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md mt-0.5 border border-amber-400/20">
                        ⏱️ {workDurationStr}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* In-App Smart Reminder Card (Jika jam >= 13:00 dan LKH masih 0) */}
              {!hasSubmittedLkh && currentHour >= 13 && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300/80 shadow-xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bell className="w-5 h-5 animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-amber-950">
                        Pengingat Pengisian LKH Harian
                      </span>
                      <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 border-none font-bold">
                        Wajib Hari Ini
                      </Badge>
                    </div>
                    <p className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                      Waktu kepulangan ({currentShiftConfig.jamBukaPulangHour}:
                      {currentShiftConfig.jamBukaPulangMinute < 10
                        ? `0${currentShiftConfig.jamBukaPulangMinute}`
                        : currentShiftConfig.jamBukaPulangMinute}{" "}
                      WIB) semakin dekat. Mohon isi minimal 1 laporan aktivitas kerja Anda agar sistem tidak mengunci tombol presensi pulang.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowQuickLkhModal(true)}
                        className="h-7 px-2.5 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Catat Kegiatan Sekarang
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel Hub Aktivitas & Laporan Kinerja Harian (LKH) */}
              <div className="card-base bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ListTodo className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Aktivitas & Kinerja Hari Ini</span>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                          {totalLkhKegiatan} Kegiatan
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Capaian: <strong>{totalLkhPoin}</strong> / {TARGET_POIN_HARIAN} Poin ({lkhPercentage}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowQuickLkhModal(true)}
                      className="btn-primary btn-sm text-[11px] h-8 px-3 font-semibold shadow-xs gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Catat Kegiatan
                    </Button>
                    <Link href="/presensi/laporan">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-8 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs gap-1"
                        title="Buka halaman logbook laporan penuh"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        LKH Lengkap
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Progress Bar Poin Kinerja */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                    <span>Progress Target Poin Harian (300 Poin)</span>
                    <span className={totalLkhPoin >= TARGET_POIN_HARIAN ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                      {totalLkhPoin >= TARGET_POIN_HARIAN ? "Target Tercapai ✓" : `${TARGET_POIN_HARIAN - totalLkhPoin} Poin Lagi`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        totalLkhPoin >= TARGET_POIN_HARIAN ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-emerald-500"
                      }`}
                      style={{ width: `${lkhPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Preview Daftar Kegiatan Hari Ini */}
                {totalLkhKegiatan > 0 ? (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-slate-700">Daftar Kegiatan Tercatat:</div>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                      {lkhData?.kegiatan.map((item, idx) => (
                        <div key={item.id || idx} className="p-3 text-xs flex items-start justify-between gap-2 hover:bg-white transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              <span className="truncate">{item.namaAktivitasBaku || item.deskripsi}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                              {item.deskripsi || item.outputKegiatan}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
                              +{item.totalPoin || item.nilaiPoin || 60} Poin
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5">{item.jamMulai} - {item.jamSelesai}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-2">
                    <Briefcase className="w-6 h-6 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">Belum Ada Aktivitas Dilaporkan Hari Ini</div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Silakan catat tugas, rapat, perbaikan, atau agenda teknis Anda hari ini agar tercatat dalam Lembar Kinerja Harian (LKH).
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowQuickLkhModal(true)}
                      className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 px-3 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Tambah Aktivitas Sekarang
                    </Button>
                  </div>
                )}
              </div>

              {/* ============================================================== */}
              {/* KONEKSI MEKANISME LEMBUR (OVERTIME INTEGRATION)               */}
              {/* ============================================================== */}
              {lemburHariIni && lemburHariIni.status === "disetujui" ? (
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50/70 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Zap className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            Tugas Lembur Kedinasan Aktif
                          </span>
                          <Badge className="bg-emerald-600 text-white text-[9px] px-2 py-0 border-none font-bold">
                            ✓ Disetujui Atasan
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Jadwal: <strong>{lemburHariIni.jamMulaiRencana} — {lemburHariIni.jamSelesaiRencana} WIB</strong>{" "}
                          ({lemburHariIni.durasiLemburMenit ? `${lemburHariIni.durasiLemburMenit} Menit` : "Hari Kerja"})
                          • Disetujui oleh: <strong>{lemburHariIni.atasanNama || "Atasan Langsung"}</strong>
                        </p>
                        <div className="mt-1.5 text-xs text-violet-950 font-medium bg-white/80 p-2 rounded-lg border border-violet-100">
                          📌 <em>"{lemburHariIni.alasanLembur}"</em>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-violet-200/60">
                    <span className="text-[10px] text-slate-500">
                      💡 Tugas lembur otomatis tersambung saat Anda melakukan Presensi Pulang.
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyLemburToLkh}
                      className="h-8 px-3 rounded-lg text-[11px] font-bold bg-violet-700 hover:bg-violet-800 text-white shadow-xs gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                      Salin Tugas Lembur ke LKH (1-Klik)
                    </Button>
                  </div>
                </div>
              ) : lemburHariIni && lemburHariIni.status === "diajukan" ? (
                <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/80 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <Timer className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-amber-900">
                        Pengajuan Lembur Menunggu Persetujuan Atasan
                      </div>
                      <div className="text-[10px] text-amber-700">
                        Rencana: {lemburHariIni.jamMulaiRencana} - {lemburHariIni.jamSelesaiRencana} WIB • "{lemburHariIni.alasanLembur}"
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleSendWhatsAppLemburReminder}
                    className="h-7 text-[10px] font-bold border-amber-300 text-amber-800 hover:bg-amber-100 gap-1 rounded-lg"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                    Ingatkan via WhatsApp
                  </Button>
                </div>
              ) : currentHour >= 15 ? (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-600">
                    Masih harus bekerja melebihi jam kantor normal hari ini?
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowQuickLemburModal(true)}
                    className="h-7 px-2.5 text-[10px] font-bold text-violet-700 border-violet-200 hover:bg-violet-50 gap-1 rounded-lg cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-violet-600" />
                    Ajukan Lembur Hari Ini
                  </Button>
                </div>
              ) : null}

              {/* ============================================================== */}
              {/* SEKSI KONTROL PRESENSI PULANG (CHECK-OUT GATEKEEPER & LKH)     */}
              {/* ============================================================== */}
              <div
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border space-y-3 transition-colors ${
                  !hasSubmittedLkh
                    ? "border-amber-200 bg-amber-50/70"
                    : isAfterShiftEnd
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-200 bg-slate-50/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        !hasSubmittedLkh
                          ? "bg-amber-200/80 text-amber-800 border border-amber-300"
                          : isAfterShiftEnd
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-slate-200/80 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {!hasSubmittedLkh ? (
                        <Lock className="w-5 h-5 text-amber-800" />
                      ) : isAfterShiftEnd ? (
                        <Unlock className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                        <span>Presensi Pulang (Check Out)</span>
                        {!hasSubmittedLkh ? (
                          <Badge className="bg-amber-600 text-white text-[9px] px-1.5 py-0 border-none font-bold">
                            ⚠️ Wajib Isi Minimal 1 LKH
                          </Badge>
                        ) : isAfterShiftEnd ? (
                          <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 border-none font-bold">
                            ✓ Menu Pulang Terbuka
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0 border-none font-bold"
                          >
                            Dibuka Pukul {currentShiftConfig.jamBukaPulangHour}:
                            {currentShiftConfig.jamBukaPulangMinute < 10
                              ? `0${currentShiftConfig.jamBukaPulangMinute}`
                              : currentShiftConfig.jamBukaPulangMinute}{" "}
                            WIB ({currentShiftConfig.label})
                          </Badge>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {!hasSubmittedLkh
                          ? "Sesuai regulasi kepegawaian kawasan, Anda wajib mengisi setidaknya 1 laporan aktivitas kerja (LKH) sebelum tombol presensi pulang dapat diakses."
                          : isAfterShiftEnd
                          ? `Laporan aktivitas hari ini telah tercatat (${totalLkhKegiatan} Kegiatan, ${totalLkhPoin} Poin) dan waktu kepulangan shift ${currentShiftConfig.label} telah tercapai. Anda dapat membuka kamera presensi untuk mengambil swafoto kepulangan.`
                          : `Laporan aktivitas hari ini telah tercatat (${totalLkhKegiatan} kegiatan). Menu presensi kepulangan shift ${currentShiftConfig.label} otomatis aktif pada pukul ${currentShiftConfig.jamBukaPulangHour}:${
                              currentShiftConfig.jamBukaPulangMinute < 10
                                ? `0${currentShiftConfig.jamBukaPulangMinute}`
                                : currentShiftConfig.jamBukaPulangMinute
                            } WIB.`}
                      </p>

                      {hasSubmittedLkh && !isAfterShiftEnd && remainingTimeToShiftEndStr && (
                        <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-slate-200/70 text-[10px] font-semibold text-slate-700">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Estimasi dibuka: <strong>{remainingTimeToShiftEndStr}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60">
                  {!hasSubmittedLkh ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                      <span className="text-[10px] text-amber-800 font-medium">
                        🔒 Laporkan apa yang Anda kerjakan hari ini agar tombol pulang terbuka.
                      </span>
                      <Button
                        type="button"
                        onClick={() => setShowQuickLkhModal(true)}
                        className="w-full sm:w-auto h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Catat 1 Kegiatan LKH Sekarang</span>
                      </Button>
                    </div>
                  ) : isAfterShiftEnd ? (
                    <Button
                      type="button"
                      onClick={() => setIsReadyForCheckout(true)}
                      className="w-full sm:w-auto h-11 px-5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-black hover:from-black hover:to-slate-900 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>Buka Kamera & Presensi Pulang (Check Out)</span>
                      <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                    </Button>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                      <span className="text-[10px] text-slate-500">
                        💡 Sistem mengunci checkout sebelum jadwal pulang ({currentShiftConfig.label}) untuk mencegah ketidaksengajaan presensi.
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEarlyCheckoutConfirm(true)}
                        className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2 cursor-pointer"
                      >
                        Pulang Lebih Awal / Izin Kedinasan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : checkInTime && !checkOutTime && isReadyForCheckout ? (
            /* ============================================================== */
            /* KONDISI 2: MODE SIAP PRESENSI PULANG (KAMERA CHECK-OUT AKTIF)  */
            /* ============================================================== */
            <div className="space-y-4">
              {/* Tombol Kembali ke Dashboard Aktivitas */}
              <div className="flex items-center justify-between px-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReadyForCheckout(false)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold gap-1 pl-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Kembali ke Daftar Aktivitas Kerja</span>
                </Button>

                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                  Mode Check Out Aktif
                </Badge>
              </div>

              {/* Kamera Swafoto Kepulangan */}
              <div className="relative">
                <CameraCapture
                  mode="check-out"
                  userId={user?.id || ""}
                  orgId={user?.orgId || ""}
                  onCapture={handleFotoCaptured}
                  onError={(msg) => setCheckOutError(msg)}
                  capturedUrl={capturedFotoUrl}
                  nip={user?.nip || ""}
                  nama={user?.nama || ""}
                  namaKantor={isDinasLuar ? `Dinas Luar: ${dinasLuarPerihal.trim() || "Luar Kawasan"}` : activeOffice.namaKantor}
                  koordinat={coords}
                  accuracyMeter={gpsAccuracy}
                />
              </div>

              {/* Error Banner */}
              {checkOutError && (
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">{checkOutError}</p>
                </div>
              )}

              {/* Tombol Final Check Out */}
              <div className="pt-2">
                <Button
                  onClick={handleCheckOut}
                  disabled={
                    isProcessing ||
                    !capturedFotoUrl ||
                    !isValidLocation ||
                    gpsStatus !== "success" ||
                    capturedFotoUrl === presensiData?.checkIn?.fotoUrl
                  }
                  className={`w-full rounded-2xl h-[56px] flex items-center justify-center gap-2 shadow-lg transition-all font-bold text-sm ${
                    !capturedFotoUrl || !isValidLocation || gpsStatus !== "success"
                      ? "bg-slate-100 text-slate-400 border-none shadow-none cursor-not-allowed"
                      : "bg-gradient-to-b from-slate-800 to-slate-950 text-white shadow-slate-900/25 hover:scale-[0.99] active:scale-95 border-b-4 border-black"
                  }`}
                >
                  <Clock className="w-5 h-5 text-teal-400" />
                  <span>KONFIRMASI PRESENSI PULANG (CHECK OUT)</span>
                </Button>
                <p className="text-center text-[10px] text-slate-500 mt-2">
                  Pastikan swafoto kepulangan telah terambil dan berada di dalam batas kawasan kantor.
                </p>
              </div>
            </div>
          ) : checkInTime && checkOutTime ? (
            /* ============================================================== */
            /* KONDISI 3: SELESAI BEKERJA HARI INI                            */
            /* ============================================================== */
            <div className="card-base p-6 sm:p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200/80 rounded-2xl sm:rounded-3xl text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1">
                  Presensi Hari Ini Selesai
                </Badge>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  Terima Kasih Atas Dedikasi Anda!
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Seluruh presensi masuk dan pulang telah terekam aman ke sistem kepegawaian.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto p-3.5 bg-white rounded-2xl border border-emerald-100 text-left">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Jam Masuk:</div>
                  <div className="text-xs font-bold text-slate-800">{checkInTime}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Jam Pulang:</div>
                  <div className="text-xs font-bold text-slate-800">{checkOutTime}</div>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-100 flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Total Jam Kerja:</span>
                  <span className="font-bold text-emerald-700">{workDurationStr}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-2">
                <Link href="/presensi/laporan">
                  <Button variant="outline" size="sm" className="text-xs border-emerald-300 text-emerald-800 bg-white">
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    Review Logbook LKH ({totalLkhKegiatan} Kegiatan)
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* KONDISI 4: BELUM CHECK-IN (PRESENSI MASUK PAGI)                */
            /* ============================================================== */
            <div className="space-y-4">
              <div className="relative">
                <CameraCapture
                  mode="check-in"
                  userId={user?.id || ""}
                  orgId={user?.orgId || ""}
                  onCapture={handleFotoCaptured}
                  onError={(msg) => setCheckInError(msg)}
                  capturedUrl={capturedFotoUrl}
                  nip={user?.nip || ""}
                  nama={user?.nama || ""}
                  namaKantor={isDinasLuar ? `Dinas Luar: ${dinasLuarPerihal.trim() || "Luar Kawasan"}` : activeOffice.namaKantor}
                  koordinat={coords}
                  accuracyMeter={gpsAccuracy}
                />
              </div>

              {checkInError && (
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">{checkInError}</p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleCheckIn}
                  disabled={isProcessing || !capturedFotoUrl || !isValidLocation || gpsStatus !== "success"}
                  className={`w-full rounded-2xl h-[56px] flex items-center justify-center gap-2 shadow-lg transition-all font-bold text-sm ${
                    !capturedFotoUrl || !isValidLocation || gpsStatus !== "success"
                      ? "bg-slate-100 text-slate-400 border-none shadow-none cursor-not-allowed"
                      : "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-emerald-500/25 hover:scale-[0.99] active:scale-95 border-b-4 border-emerald-800"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>PRESENSI MASUK SEKARANG (CHECK IN)</span>
                </Button>
              </div>
            </div>
          )}
        </MotionFadeUp>
      )}

      {/* ============================================================== */}
      {/* MODAL DIALOG: INPUT CEPAT LAPORAN KEGIATAN HARIAN (LKH)        */}
      {/* ============================================================== */}
      {showQuickLkhModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Catat Aktivitas Kerja Hari Ini</h3>
                  <p className="text-[11px] text-slate-500">Laporan Kinerja Harian (LKH) Pegawai</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickLkhModal(false)}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickLkh} className="space-y-3.5 text-xs">
              {/* Templat 1-Klik Aktivitas Rutin Kawasan STP */}
              <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Pilih Templat Cepat Aktivitas Rutin Kawasan:
                  </label>
                  <span className="text-[10px] text-slate-400">1-Klik Otomatis Terisi</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {TEMPLAT_AKTIVITAS_STP.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 transition-colors text-left truncate max-w-full cursor-pointer shadow-2xs"
                      title={tpl.deskripsi}
                    >
                      + {tpl.nama}
                    </button>
                  ))}
                </div>
              </div>

              {/* Judul Kegiatan dengan Voice-to-Text Button */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">Nama / Judul Kegiatan *</Label>
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      isVoiceListening
                        ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse ring-2 ring-rose-200"
                        : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200"
                    }`}
                    title="Diktekan laporan menggunakan suara (Voice-to-Text Bahasa Indonesia)"
                  >
                    {isVoiceListening ? (
                      <>
                        <MicOff className="w-3 h-3 text-rose-600 animate-spin" />
                        <span>Mendengarkan... (Klik untuk stop)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3 text-emerald-600" />
                        <span>Input Suara (Mic)</span>
                      </>
                    )}
                  </button>
                </div>
                <Input
                  required
                  placeholder="misal: Melakukan koordinasi teknis operasional tenant"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Kategori Pekerjaan</Label>
                  <select
                    value={quickKategori}
                    onChange={(e) => setQuickKategori(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-800"
                  >
                    <option value="Teknis">Teknis Operasional</option>
                    <option value="Manajerial">Manajerial / Rapat</option>
                    <option value="Pelayanan">Pelayanan Publik</option>
                    <option value="Persuratan">Persuratan & Dokumen</option>
                    <option value="Umum">Tugas Umum / Piket</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Durasi (Menit)</Label>
                  <Input
                    type="number"
                    min="10"
                    max="480"
                    value={quickDurasi}
                    onChange={(e) => setQuickDurasi(Number(e.target.value))}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Deskripsi / Uraian Pelaksanaan</Label>
                <Textarea
                  placeholder="Uraikan poin-poin yang dikerjakan pada agenda ini..."
                  value={quickDeskripsi}
                  onChange={(e) => setQuickDeskripsi(e.target.value)}
                  rows={2}
                  className="bg-white text-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Output / Bukti Hasil Kegiatan</Label>
                <Input
                  placeholder="misal: Notulen rapat, Dokumen teknis, Berita Acara"
                  value={quickOutput}
                  onChange={(e) => setQuickOutput(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickLkhModal(false)}
                  className="text-xs border-slate-200 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingLkh}
                  className="btn-primary text-xs font-semibold px-4 cursor-pointer"
                >
                  {isSavingLkh ? "Menyimpan..." : "Simpan Kegiatan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL KONFIRMASI: PULANG LEBIH AWAL (SEBELUM JAM 15:00 WIB)    */}
      {/* ============================================================== */}
      {showEarlyCheckoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Presensi Pulang Awal</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Saat ini belum pukul 15:00 WIB (Jam 3 Sore). Apakah Anda memiliki tugas dinas luar atau keperluan mendesak yang mengharuskan presensi kepulangan sekarang?
              </p>
              {!hasSubmittedLkh && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-left text-[11px] text-rose-800">
                  ⚠️ <strong>Peringatan LKH:</strong> Anda belum mencatat aktivitas kerja hari ini. Anda tetap diwajibkan mencatat minimal 1 laporan kegiatan LKH.
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEarlyCheckoutConfirm(false)}
                className="text-xs border-slate-200 cursor-pointer"
              >
                Batal
              </Button>
              {!hasSubmittedLkh ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setShowEarlyCheckoutConfirm(false);
                    setShowQuickLkhModal(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 cursor-pointer gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Isi LKH Dulu
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setShowEarlyCheckoutConfirm(false);
                    setIsReadyForCheckout(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 cursor-pointer"
                >
                  Ya, Buka Presensi Pulang
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL CEPAT: PENGAJUAN TUGAS LEMBUR KEDINASAN                 */}
      {/* ============================================================== */}
      {showQuickLemburModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ajukan Tugas Lembur Hari Ini</h3>
                  <p className="text-[11px] text-slate-500">Kawasan Solo Technopark</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickLemburModal(false)}
                className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickLemburSubmit} className="space-y-3.5 text-xs">
              <div className="p-2.5 rounded-xl bg-violet-50/80 border border-violet-100 text-violet-900 text-[11px]">
                Penugasan akan diteruskan ke atasan langsung: <strong>{user?.atasanNama || "Atasan Langsung"}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Rencana Jam Mulai *</Label>
                  <Input
                    type="time"
                    required
                    value={quickLemburMulai}
                    onChange={(e) => setQuickLemburMulai(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Rencana Jam Selesai *</Label>
                  <Input
                    type="time"
                    required
                    value={quickLemburSelesai}
                    onChange={(e) => setQuickLemburSelesai(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Alasan / Uraian Tugas Lembur *</Label>
                <Textarea
                  required
                  placeholder="Uraikan pekerjaan atau target darurat yang mengharuskan lembur hari ini..."
                  value={quickLemburAlasan}
                  onChange={(e) => setQuickLemburAlasan(e.target.value)}
                  rows={3}
                  className="bg-white text-xs resize-none"
                />
                <span className="text-[10px] text-slate-400">Minimal 10 karakter penjelasan.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickLemburModal(false)}
                  className="text-xs border-slate-200 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingLembur}
                  className="bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold px-4 cursor-pointer gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingLembur ? "Mengirim..." : "Kirim Pengajuan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MotionStaggerContainer>
  );
}
