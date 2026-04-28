import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const [addonsResult, inventoryResult] = await Promise.all([
      supabase
        .from("menu_item_addons")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("inventory_items")
        .select("*")
        .eq("inventory_type", "addon"),
    ]);

    if (addonsResult.error) throw addonsResult.error;
    if (inventoryResult.error) throw inventoryResult.error;

    return NextResponse.json({
      addons: addonsResult.data ?? [],
      inventory: inventoryResult.data ?? [],
    });
  } catch (error) {
    console.error("[menu/addons]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load menu add-ons." },
      { status: 500 }
    );
  }
}
