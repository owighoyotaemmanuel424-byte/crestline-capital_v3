import { NextResponse } from "next/server";
import { demoFunctions, getConvexClient } from "@/lib/convex";

export async function GET() {
  try {
    const client = getConvexClient();
    const seeded = await client.mutation(demoFunctions.seed as any, {});
    const data = await client.query(demoFunctions.dashboard as any, { userId: seeded.userId });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Convex unavailable" }, { status: 503 });
  }
}
