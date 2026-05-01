import { NextResponse } from "next/server";
import { sendOrderStatusEmail } from "@/lib/email/order-status";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const EMAIL_STATUSES = new Set(["pending", "preparing", "on the way", "delivered"]);

type OrderItemForEmail = {
  item_name: string;
  quantity: number;
  unit_price: number;
  size_label: string | null;
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json({ error: "Admin session is required." }, { status: 401 });
    }

    const body = await request.json();
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";
    const rider = typeof body.rider === "object" && body.rider !== null ? body.rider : undefined;

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status are required." }, { status: 400 });
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

    const { data: updatedOrder, error: updateError } = await serviceSupabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("*")
      .single();

    if (updateError) throw updateError;

    const { data: orderItems, error: orderItemsError } = await serviceSupabase
      .from("order_items")
      .select("item_name, quantity, unit_price, size_label")
      .eq("order_id", updatedOrder.id);

    if (orderItemsError) throw orderItemsError;

    let emailSent = false;
    let emailWarning = "";

    if (EMAIL_STATUSES.has(status.toLowerCase())) {
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
            status,
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

    return NextResponse.json({ order: updatedOrder, emailSent, warning: emailWarning });
  } catch (error) {
    console.error("[orders/status]", error);
    return NextResponse.json({ error: "Unable to update order status right now." }, { status: 500 });
  }
}
