import { NextResponse } from "next/server";
import { sendOrderStatusEmail } from "@/lib/email/order-status";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ORDER_STATUSES = new Map([
  ["pending", "Pending"],
  ["preparing", "Preparing"],
  ["on the way", "On the way"],
  ["on the-way", "On the way"],
  ["ontheway", "On the way"],
  ["on theway", "On the way"],
  ["delivered", "Delivered"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
]);
const EMAIL_STATUSES = new Set(["Pending", "Preparing", "On the way", "Delivered", "Completed"]);

function normalizeOrderStatus(status: string) {
  return ORDER_STATUSES.get(status.trim().toLowerCase()) ?? "";
}

type OrderItemForEmail = {
  item_name: string;
  quantity: number;
  unit_price: number;
  size_label: string | null;
};

type SupabaseServiceClient = ReturnType<typeof getSupabaseServiceClient>;

type InventoryRequirement = {
  inventory_item_id: string;
  quantity_required: number;
  inventory_items: { id: string; name: string; quantity: number } | { id: string; name: string; quantity: number }[] | null;
};

async function deductOrderInventory(serviceSupabase: SupabaseServiceClient, orderId: string) {
  const { data: orderItems, error: orderItemsError } = await serviceSupabase
    .from("order_items")
    .select("menu_item_id, item_name, quantity")
    .eq("order_id", orderId);

  if (orderItemsError) throw orderItemsError;

  const menuItemIds = Array.from(new Set((orderItems ?? []).map((item) => item.menu_item_id).filter((id): id is string => Boolean(id))));
  if (menuItemIds.length === 0) return 0;

  const { data: requirements, error: requirementsError } = await serviceSupabase
    .from("menu_item_inventory_requirements")
    .select("menu_item_id, inventory_item_id, quantity_required, inventory_items(id, name, quantity)")
    .in("menu_item_id", menuItemIds);

  if (requirementsError) throw requirementsError;

  const requiredByInventoryId = new Map<string, { name: string; currentQuantity: number; requiredQuantity: number }>();

  (orderItems ?? []).forEach((orderItem) => {
    if (!orderItem.menu_item_id) return;

    (requirements ?? [])
      .filter((requirement) => requirement.menu_item_id === orderItem.menu_item_id)
      .forEach((requirement) => {
        const typedRequirement = requirement as unknown as InventoryRequirement;
        const inventory = Array.isArray(typedRequirement.inventory_items)
          ? typedRequirement.inventory_items[0]
          : typedRequirement.inventory_items;
        if (!inventory) return;

        const orderQuantity = Math.max(1, Number(orderItem.quantity ?? 1));
        const requiredQuantity = Number(typedRequirement.quantity_required) * orderQuantity;
        const previous = requiredByInventoryId.get(typedRequirement.inventory_item_id);

        requiredByInventoryId.set(typedRequirement.inventory_item_id, {
          name: inventory.name,
          currentQuantity: Number(inventory.quantity),
          requiredQuantity: (previous?.requiredQuantity ?? 0) + requiredQuantity,
        });
      });
  });

  for (const item of requiredByInventoryId.values()) {
    if (item.currentQuantity < item.requiredQuantity) {
      throw new Error(`${item.name} stock is not enough. Available: ${item.currentQuantity}, needed: ${item.requiredQuantity}.`);
    }
  }

  for (const [inventoryId, item] of requiredByInventoryId) {
    const { error: stockUpdateError } = await serviceSupabase
      .from("inventory_items")
      .update({ quantity: item.currentQuantity - item.requiredQuantity })
      .eq("id", inventoryId)
      .gte("quantity", item.requiredQuantity);

    if (stockUpdateError) throw stockUpdateError;
  }

  if (requiredByInventoryId.size > 0) {
    const { error: syncError } = await serviceSupabase.rpc("sync_menu_item_availability", { p_menu_item_id: null });
    if (syncError) throw syncError;
  }

  return requiredByInventoryId.size;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json({ error: "Admin session is required." }, { status: 401 });
    }

    const body = await request.json();
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const status = typeof body.status === "string" ? normalizeOrderStatus(body.status) : "";
    const rider = typeof body.rider === "object" && body.rider !== null ? body.rider : undefined;

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and a valid status are required." }, { status: 400 });
    }

    const serverSupabase = getSupabaseServerClient();
    const serviceSupabase = getSupabaseServiceClient();
    const { data: sessionUser, error: sessionError } = await serverSupabase.auth.getUser(token);

    if (sessionError || !sessionUser.user) {
      return NextResponse.json({ error: "Invalid admin session." }, { status: 401 });
    }

    const { data: adminRole, error: adminRoleError } = await serviceSupabase
      .from("app_users")
      .select("role")
      .eq("id", sessionUser.user.id)
      .maybeSingle();

    if (adminRoleError) throw adminRoleError;
    if (adminRole?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { data: currentOrder, error: currentOrderError } = await serviceSupabase
      .from("orders")
      .select("id, status, inventory_deducted_at")
      .eq("id", orderId)
      .single();

    if (currentOrderError) throw currentOrderError;

    const { error: updateError } = await serviceSupabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("id")
      .single();

    if (updateError) throw updateError;

    let inventoryDeducted = false;

    if (status === "Completed" && !currentOrder.inventory_deducted_at) {
      try {
        await deductOrderInventory(serviceSupabase, orderId);
        const { error: deductedAtError } = await serviceSupabase
          .from("orders")
          .update({ inventory_deducted_at: new Date().toISOString() })
          .eq("id", orderId)
          .is("inventory_deducted_at", null);

        if (deductedAtError) throw deductedAtError;
      } catch (error) {
        await serviceSupabase.from("orders").update({ status: currentOrder.status }).eq("id", orderId);
        throw error;
      }
      inventoryDeducted = true;
    }

    const { data: updatedOrder, error: updatedOrderError } = await serviceSupabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (updatedOrderError) throw updatedOrderError;

    const { data: orderItems, error: orderItemsError } = await serviceSupabase
      .from("order_items")
      .select("item_name, quantity, unit_price, size_label")
      .eq("order_id", updatedOrder.id);

    if (orderItemsError) throw orderItemsError;

    let emailSent = false;
    let emailWarning = "";

    if (EMAIL_STATUSES.has(updatedOrder.status)) {
      const [{ data: profile }, { data: authUser, error: authUserError }] = await Promise.all([
        serviceSupabase.from("profiles").select("full_name").eq("id", updatedOrder.user_id).maybeSingle(),
        serviceSupabase.auth.admin.getUserById(updatedOrder.user_id),
      ]);

      if (authUserError) {
        emailWarning = "Order updated, but customer email could not be loaded.";
      } else if (!authUser.user?.email) {
        emailWarning = "Order updated, but customer email is missing.";
      } else {
        try {
          await sendOrderStatusEmail({
            to: authUser.user.email,
            customerName: profile?.full_name || authUser.user.email,
            orderNumber: updatedOrder.id.slice(-12),
            status: updatedOrder.status,
            items: ((orderItems ?? []) as OrderItemForEmail[]).map((item) => ({
              name: item.item_name,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unit_price),
              size: item.size_label,
            })),
            totalAmount: Number(updatedOrder.total_amount),
            deliveryAddress: updatedOrder.address,
            rider,
          });
          emailSent = true;
        } catch (error) {
          console.error("[orders/status email]", error);
          emailWarning = "Order updated, but the status email failed to send.";
        }
      }
    }

    return NextResponse.json({ order: updatedOrder, emailSent, warning: emailWarning, inventoryDeducted });
  } catch (error) {
    console.error("[orders/status]", error);
    return NextResponse.json({ error: "Unable to update order status right now." }, { status: 500 });
  }
}
