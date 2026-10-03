// src/app/api/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { recordCheckIn, recordCheckOut } from "@/actions/presensi/presensi";
import { saveLKH } from "@/actions/presensi/lkh";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actionName, payload } = body;

    if (!actionName || !payload) {
      return NextResponse.json(
        { success: false, message: "Payload dan nama aksi (actionName) wajib disertakan." },
        { status: 400 }
      );
    }

    if (actionName === "checkIn") {
      const result = await recordCheckIn(payload);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (actionName === "checkOut") {
      const result = await recordCheckOut(payload);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    if (actionName === "submitLKH") {
      const result = await saveLKH(payload);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    return NextResponse.json(
      { success: false, message: `Aksi antrean mutasi tidak didukung: ${actionName}` },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("[API Offline Sync Error]:", error);
    return NextResponse.json(
      { success: false, message: (error as Error)?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
