// Lokasi file: src/app/daftar/page.tsx
import AuthSplitShell from '@/components/auth/AuthSplitShell';

export const metadata = {
  title: 'Daftar Akun Baru | Portal Solo Technopark',
  description: 'Buat akun layanan Solo Technopark untuk E-Katalog, Reservasi Fasilitas, Pelatihan Vokasi, serta Klaim Alumni STP & RSKB Surakarta.',
};

export default function DaftarPage() {
  return <AuthSplitShell defaultTab="register" />;
}

