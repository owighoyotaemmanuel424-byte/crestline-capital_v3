import { NextRequest, NextResponse } from "next/server";
import { demoFunctions, getConvexClient } from "@/lib/convex";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getConvexClient();
    const seeded = await client.mutation(demoFunctions.seed as any, {});
    const value = await client.mutation(demoFunctions.toggleCard as any, { userId: seeded.userId, cardId: body.cardId });
    return NextResponse.json({ frozen: value });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Convex unavailable" }, { status: 503 });
  }
}
