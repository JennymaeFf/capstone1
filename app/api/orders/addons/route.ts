import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type AddonPayload = {
  inventoryItemId?: string | null;
  name: string;
  priceDelta: number;
  quantityRequired?: number;
  quantity?: number;
  saveAsOrderAddon?: boolean;
};

type OrderItemPayload = {
  menuItemId?: string | null;
  itemName: string;
  size?: string | null;
  quantity: number;
  addons?: AddonPayload[];
};

type ExistingOrderItem = {
  id: string;
  menu_item_id: string | null;
  item_name: string;
  size_label: string | null;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function sameOrderItem(payload: OrderItemPayload, row: ExistingOrderItem) {
  const sameMenuItem = payload.menuItemId ? row.menu_item_id === payload.menuItemId : true;
  return (
    sameMenuItem &&
    normalizeText(payload.itemName) === normalizeText(row.item_name) &&
    normalizeText(payload.size) === normalizeText(row.size_label)
  );
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json({ error: "User session is required." }, { status: 401 });
    }

    const body = await request.json();
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const items = Array.isArray(body.items) ? (body.items as OrderItemPayload[]) : [];

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const itemsWithAddons = items.filter((item) => (item.addons ?? []).length > 0);
    if (itemsWithAddons.length === 0) {
      return NextResponse.json({ inserted: 0, message: "No add-ons to save." });
    }

    const serverSupabase = getSupabaseServerClient();
    const serviceSupabase = getSupabaseServiceClient();
    const { data: sessionUser, error: sessionError } = await serverSupabase.auth.getUser(token);

    if (sessionError || !sessionUser.user) {
      return NextResponse.json({ error: "Invalid user session." }, { status: 401 });
    }

    const { data: order, error: orderError } = await serviceSupabase
      .from("orders")
      .select("id, user_id")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;
    if (order.user_id !== sessionUser.user.id) {
      return NextResponse.json({ error: "You can only update your own order add-ons." }, { status: 403 });
    }

    const { data: orderItems, error: orderItemsError } = await serviceSupabase
      .from("order_items")
      .select("id, menu_item_id, item_name, size_label")
      .eq("order_id", orderId);

    if (orderItemsError) throw orderItemsError;

    const orderItemRows = (orderItems ?? []) as ExistingOrderItem[];
    const orderItemIds = orderItemRows.map((item) => item.id);
    const { data: existingAddons, error: existingAddonsError } = orderItemIds.length
      ? await serviceSupabase
          .from("order_addons")
          .select("order_item_id, inventory_item_id, addon_name")
          .in("order_item_id", orderItemIds)
      : { data: [], error: null };

    if (existingAddonsError) throw existingAddonsError;

    const inventoryIds = Array.from(new Set(
      itemsWithAddons.flatMap((item) =>
        (item.addons ?? [])
          .map((addon) => addon.inventoryItemId)
          .filter((id): id is string => Boolean(id))
      )
    ));
    const inventoryById = new Map<string, { id: string; name: string; quantity: number }>();

    if (inventoryIds.length > 0) {
      const { data: inventoryRows, error: inventoryError } = await serviceSupabase
        .from("inventory_items")
        .select("id, name, quantity")
        .in("id", inventoryIds);

      if (inventoryError) throw inventoryError;
      inventoryRows?.forEach((row) => {
        inventoryById.set(row.id, { id: row.id, name: row.name, quantity: Number(row.quantity) });
      });
    }

    const stockUseByInventoryId = new Map<string, number>();
    itemsWithAddons.forEach((item) => {
      (item.addons ?? []).forEach((addon) => {
        if (!addon.inventoryItemId) return;
        const addonQty = Math.max(1, Number(addon.quantity ?? 1));
        const itemQty = Math.max(1, Number(item.quantity || 1));
        const requiredPerAddon = Math.max(1, Number(addon.quantityRequired ?? 1));
        const totalStockUse = addonQty * itemQty * requiredPerAddon;
        stockUseByInventoryId.set(addon.inventoryItemId, (stockUseByInventoryId.get(addon.inventoryItemId) ?? 0) + totalStockUse);
      });
    });

    for (const [inventoryId, requiredQuantity] of stockUseByInventoryId) {
      const inventoryItem = inventoryById.get(inventoryId);
      if (!inventoryItem) {
        return NextResponse.json({ error: "Selected add-on inventory item was not found." }, { status: 400 });
      }
      if (inventoryItem.quantity < requiredQuantity) {
        return NextResponse.json(
          { error: `${inventoryItem.name} stock is not enough. Available: ${inventoryItem.quantity}, needed: ${requiredQuantity}.` },
          { status: 400 }
        );
      }
    }

    const usedOrderItemIds = new Set<string>();
    const existingKeys = new Set(
      (existingAddons ?? []).map((addon) =>
        `${addon.order_item_id}:${addon.inventory_item_id ?? ""}:${normalizeText(addon.addon_name)}`
      )
    );

    const addonsToInsert = itemsWithAddons.flatMap((item) => {
      const matchedOrderItem = orderItemRows.find((row) => !usedOrderItemIds.has(row.id) && sameOrderItem(item, row));
      if (!matchedOrderItem) return [];

      usedOrderItemIds.add(matchedOrderItem.id);
      return (item.addons ?? [])
        .filter((addon) => addon.name?.trim())
        .filter((addon) => addon.saveAsOrderAddon !== false)
        .filter((addon) => {
          const key = `${matchedOrderItem.id}:${addon.inventoryItemId ?? ""}:${normalizeText(addon.name)}`;
          if (existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        })
        .map((addon) => ({
          order_item_id: matchedOrderItem.id,
          inventory_item_id: addon.inventoryItemId || null,
          addon_name: addon.name.trim(),
          price_delta: Number(addon.priceDelta ?? 0),
          quantity: Math.max(1, Number(addon.quantity ?? 1)) * Math.max(1, Number(item.quantity || 1)),
          total_price: Number(addon.priceDelta ?? 0) * Math.max(1, Number(addon.quantity ?? 1)) * Math.max(1, Number(item.quantity || 1)),
        }));
    });

    if (addonsToInsert.length > 0) {
      const { error: insertError } = await serviceSupabase.from("order_addons").insert(addonsToInsert);
      if (insertError) throw insertError;
    }

    for (const [inventoryId, requiredQuantity] of stockUseByInventoryId) {
      const inventoryItem = inventoryById.get(inventoryId);
      if (!inventoryItem) continue;
      const { error: stockUpdateError } = await serviceSupabase
        .from("inventory_items")
        .update({ quantity: inventoryItem.quantity - requiredQuantity })
        .eq("id", inventoryId);

      if (stockUpdateError) throw stockUpdateError;
    }

    return NextResponse.json({ inserted: addonsToInsert.length, deducted: stockUseByInventoryId.size });
  } catch (error) {
    console.error("[orders/addons]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save order add-ons." },
      { status: 500 }
    );
  }
}
