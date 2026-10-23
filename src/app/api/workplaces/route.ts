import { NextResponse } from "next/server";
import { listPresets } from "@/lib/server/searches";
import { handle } from "../_lib";

/** GET /api/workplaces：常見工作地 */
export const GET = handle(async () => NextResponse.json({ workplaces: await listPresets() }));
