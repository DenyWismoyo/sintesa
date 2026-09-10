// Lokasi file: src/utils/terbilang.ts

export const terbilang = (nilai: number): string => {
  nilai = Math.abs(nilai);
  const huruf = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];
  let hasil = "";

  if (nilai < 12) {
    hasil = " " + huruf[nilai];
  } else if (nilai < 20) {
    hasil = terbilang(nilai - 10) + " Belas";
  } else if (nilai < 100) {
    hasil = terbilang(Math.floor(nilai / 10)) + " Puluh" + terbilang(nilai % 10);
  } else if (nilai < 200) {
    hasil = " Seratus" + terbilang(nilai - 100);
  } else if (nilai < 1000) {
    hasil = terbilang(Math.floor(nilai / 100)) + " Ratus" + terbilang(nilai % 100);
  } else if (nilai < 2000) {
    hasil = " Seribu" + terbilang(nilai - 1000);
  } else if (nilai < 1000000) {
    hasil = terbilang(Math.floor(nilai / 1000)) + " Ribu" + terbilang(nilai % 1000);
  } else if (nilai < 1000000000) {
    hasil = terbilang(Math.floor(nilai / 1000000)) + " Juta" + terbilang(nilai % 1000000);
  } else if (nilai < 1000000000000) {
    hasil = terbilang(Math.floor(nilai / 1000000000)) + " Milyar" + terbilang(nilai % 1000000000);
  } else if (nilai < 1000000000000000) {
    hasil = terbilang(Math.floor(nilai / 1000000000000)) + " Trilyun" + terbilang(nilai % 1000000000000);
  }

  return hasil;
};

export const formatTerbilangRupiah = (nilai: number): string => {
  if (nilai === 0) return "Nol Rupiah";
  let hasilText = terbilang(nilai).trim() + " Rupiah";
  // Memastikan huruf pertama selalu kapital
  return hasilText.charAt(0).toUpperCase() + hasilText.slice(1);
};