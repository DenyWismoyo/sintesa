import { redirect } from "next/navigation";

export default function IzinPage() {
  redirect("/presensi/scan?tab=izin");
}
