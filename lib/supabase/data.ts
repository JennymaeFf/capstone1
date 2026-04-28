"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type MenuRow = Database["public"]["Tables"]["menu_items"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type ContactMessageRow = Database["public"]["Tables"]["contact_messages"]["Row"];
export type InventoryRow = Database["public"]["Tables"]["inventory_items"]["Row"];
export type MenuRequirementRow = Database["public"]["Tables"]["menu_item_inventory_requirements"]["Row"];
export type MenuAddonRow = Database["public"]["Tables"]["menu_item_addons"]["Row"];
export type ContactMessage = ContactMessageRow;

export type AppMenuItem = {
  id: string;
  name: string;
  category: string;
  image: string;
  price: string;
  basePrice: number;
  isAvailable: boolean;
  isManuallyAvailable: boolean;
  description?: string;
  addons?: MenuAddonOption[];
};

export type MenuAddonOption = {
  id: string;
  inventoryItemId: string;
  name: string;
  priceDelta: number;
  quantityRequired: number;
  isAvailable: boolean;
};

export type CheckoutInfo = {
  name: string;
  email: string;
  phone: string;
  address: string;
  payment: string;
  selectedBank?: string;
  paymentReference?: string;
  paymentProofUrl?: string;
  deliveryOption?: string;
  deliveryDistanceKm?: number;
  deliveryFee?: number;
};

export type CartItemForOrder = {
  id?: string;
  name: string;
  image: string;
  quantity: number;
  size?: string;
  finalPrice: number;
  addons?: MenuAddonOption[];
};

export type OrderWithItems = {
  id: string;
  date: string;
  updatedAt: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  deliveryDistanceKm: number;
  deliveryOption: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    payment: string;
    selectedBank?: string;
    paymentReference?: string;
    paymentProofUrl?: string;
  };
  items: { name: string; image: string; quantity: number; size?: string; finalPrice: number }[];
};

export type StoreStatus = {
  isOpen: boolean;
  message: string;
};

export const CONTACT_MESSAGE_MAX_LENGTH = 1000;
export const CONTACT_MESSAGE_COOLDOWN_SECONDS = 60;

const DEFAULT_STORE_STATUS: StoreStatus = {
  isOpen: true,
  message: "",
};

function mapMenuItem(row: MenuRow): AppMenuItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    image: row.image_url,
    price: `P${Number(row.base_price).toFixed(2)}`,
    basePrice: Number(row.base_price),
    isAvailable: row.is_available,
    isManuallyAvailable: row.is_manually_available,
    description: row.description ?? undefined,
  };
}

function mapStoreStatus(value: Database["public"]["Tables"]["app_settings"]["Row"]["value"] | undefined): StoreStatus {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_STORE_STATUS;
  return {
    isOpen: typeof value.is_open === "boolean" ? value.is_open : DEFAULT_STORE_STATUS.isOpen,
    message: typeof value.message === "string" && value.message.trim() ? value.message : DEFAULT_STORE_STATUS.message,
  };
}

export async function getCurrentSessionUser() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getMenuItems() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMenuItem);
}

export async function getStoreStatus() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "store_status")
    .maybeSingle();

  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("app_settings") ||
      message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("could not find")
    ) {
      return DEFAULT_STORE_STATUS;
    }

    throw error;
  }

  return mapStoreStatus(data?.value);
}

export async function updateStoreStatus(status: StoreStatus) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("app_settings")
    .upsert({
      key: "store_status",
      value: {
        is_open: status.isOpen,
        message: status.message,
      },
    }, { onConflict: "key" })
    .select("value")
    .single();

  if (error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("app_settings") ||
      message.includes("row-level security") ||
      message.includes("violates row-level security") ||
      message.includes("permission denied") ||
      message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("could not find")
    ) {
      throw new Error("Store status setup is not complete. Run supabase/store_status_setup.sql in Supabase SQL Editor, then refresh admin.");
    }
    throw error;
  }
  return mapStoreStatus(data.value);
}

export async function getAvailableMenuItems() {
  const items = await getMenuItems();
  let addons: Awaited<ReturnType<typeof getMenuAddons>> = [];
  let inventory: Awaited<ReturnType<typeof getInventoryItems>> = [];

  try {
    [addons, inventory] = await Promise.all([getMenuAddons(), getInventoryItems()]);
  } catch {
    addons = [];
    inventory = [];
  }

  return items.map((item) => ({
    ...item,
    addons: addons
      .filter((addon) => addon.menu_item_id === item.id)
      .map((addon) => ({
        id: addon.id,
        inventoryItemId: addon.inventory_item_id,
        name: inventory.find((stockItem) => stockItem.id === addon.inventory_item_id)?.name ?? "Add-on",
        priceDelta: Number(addon.price_delta),
        quantityRequired: Number(addon.quantity_required),
        isAvailable: addon.is_available,
      })),
  }));
}

export async function createMenuItem(item: Database["public"]["Tables"]["menu_items"]["Insert"]) {
  const supabase = getSupabaseBrowserClient();
  const normalizedName = item.name.trim().toLowerCase();
  const { data: existingItem, error: existingError } = await supabase
    .from("menu_items")
    .select("id")
    .ilike("name", item.name.trim())
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingItem) throw new Error("A menu item with this name already exists.");

  const { data, error } = await supabase.from("menu_items").insert(item).select("*").single();
  if (error?.message.toLowerCase().includes("duplicate")) {
    throw new Error("A menu item with this name already exists.");
  }
  if (error) throw error;
  if (data.name.trim().toLowerCase() !== normalizedName) {
    throw new Error("Menu item was saved with an unexpected name.");
  }
  return mapMenuItem(data);
}

export async function updateMenuItem(id: string, patch: Database["public"]["Tables"]["menu_items"]["Update"]) {
  const supabase = getSupabaseBrowserClient();
  if (patch.name) {
    const { data: existingItem, error: existingError } = await supabase
      .from("menu_items")
      .select("id")
      .ilike("name", patch.name.trim())
      .neq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingItem) throw new Error("A menu item with this name already exists.");
  }

  const { data, error } = await supabase.from("menu_items").update(patch).eq("id", id).select("*").single();
  if (error?.message.toLowerCase().includes("duplicate")) {
    throw new Error("A menu item with this name already exists.");
  }
  if (error) throw error;

  if ("is_manually_available" in patch) {
    await supabase.rpc("sync_menu_item_availability", { p_menu_item_id: id });
    const { data: syncedData, error: syncedError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", id)
      .single();

    if (syncedError) throw syncedError;
    return mapMenuItem(syncedData);
  }

  return mapMenuItem(data);
}

export async function deleteMenuItem(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadMenuItemImage(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, or WebP image.");
  }

  const maxBytes = 3 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Image is too large. Please choose an image under 3MB.");
  }

  const supabase = getSupabaseBrowserClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const path = `menu-items/${Date.now()}-${safeName || "image"}.${extension}`;

  const { error } = await supabase.storage.from("menu-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    if (error.message.toLowerCase().includes("bucket not found")) {
      throw new Error("Menu image storage is not set up yet. Run supabase/storage_setup.sql in Supabase SQL Editor, then try uploading again.");
    }
    throw error;
  }

  const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPaymentProof(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, or WebP image.");
  }

  const maxBytes = 3 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Payment proof is too large. Please choose an image under 3MB.");
  }

  const user = await getCurrentSessionUser();
  if (!user) throw new Error("You must be logged in to upload payment proof.");

  const supabase = getSupabaseBrowserClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const path = `${user.id}/${Date.now()}-${safeName || "proof"}.${extension}`;

  const { error } = await supabase.storage.from("payment-proofs").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    if (error.message.toLowerCase().includes("bucket not found")) {
      throw new Error("Payment proof storage is not set up yet. Run supabase/payment_proof_setup.sql in Supabase SQL Editor.");
    }
    throw error;
  }

  const { data } = supabase.storage.from("payment-proofs").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProfilePicture(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, or WebP image.");
  }

  const maxBytes = 3 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Profile picture is too large. Please choose an image under 3MB.");
  }

  const user = await getCurrentSessionUser();
  if (!user) throw new Error("You must be logged in to upload a profile picture.");

  const supabase = getSupabaseBrowserClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from("profile-pictures").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    if (error.message.toLowerCase().includes("bucket not found")) {
      throw new Error("Profile picture storage is not set up yet. Run supabase/profile_picture_setup.sql in Supabase SQL Editor.");
    }
    throw error;
  }

  const { data } = supabase.storage.from("profile-pictures").getPublicUrl(path);
  return data.publicUrl;
}

export async function getInventoryItems() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("inventory_type", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertInventoryItem(item: Database["public"]["Tables"]["inventory_items"]["Insert"]) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("inventory_items").upsert(item).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);
  if (error) throw error;
}

export async function getMenuRequirements() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("menu_item_inventory_requirements")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createMenuRequirement(item: Database["public"]["Tables"]["menu_item_inventory_requirements"]["Insert"]) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("menu_item_inventory_requirements").upsert(item).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteMenuRequirement(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("menu_item_inventory_requirements").delete().eq("id", id);
  if (error) throw error;
}

export async function getMenuAddons() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("menu_item_addons")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createMenuAddon(item: Database["public"]["Tables"]["menu_item_addons"]["Insert"]) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("menu_item_addons").upsert(item).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteMenuAddon(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("menu_item_addons").delete().eq("id", id);
  if (error) throw error;
}

export async function getMyProfile() {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentSessionUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCurrentAppUserRole(userId?: string, userEmail?: string) {
  const supabase = getSupabaseBrowserClient();
  const sessionUser = userId ? null : await getCurrentSessionUser();
  const id = userId ?? sessionUser?.id;
  const emailForLog = userEmail ?? sessionUser?.email ?? "";

  if (!id) {
    console.log("[auth-role] No Supabase auth user id found.", { email: emailForLog });
    return null;
  }

  const { data, error } = await supabase.from("app_users").select("role").eq("id", id).maybeSingle();
  if (error) throw error;

  if (!data?.role) {
    console.log("[auth-role] Missing app_users role. Creating customer role.", { userId: id, email: emailForLog });
    const { data: insertedRole, error: insertError } = await supabase
      .from("app_users")
      .insert({ id, role: "customer" })
      .select("role")
      .single();

    if (insertError) throw insertError;
    console.log("[auth-role] Created app_users role.", { userId: id, email: emailForLog, role: insertedRole.role });
    return insertedRole.role;
  }

  console.log("[auth-role] Fetched app_users role.", { userId: id, email: emailForLog, role: data.role });
  return data.role;
}

export async function upsertMyProfile(patch: Partial<Pick<ProfileRow, "full_name" | "phone" | "address" | "avatar_url">>) {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentSessionUser();
  if (!user) throw new Error("You must be logged in.");

  const payload: Database["public"]["Tables"]["profiles"]["Insert"] = { id: user.id };
  if ("full_name" in patch) payload.full_name = patch.full_name ?? null;
  if ("phone" in patch) payload.phone = patch.phone ?? null;
  if ("address" in patch) payload.address = patch.address ?? null;
  if ("avatar_url" in patch) payload.avatar_url = patch.avatar_url ?? null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("avatar_url")) {
      throw new Error("Profile picture setup is not complete yet. Run supabase/profile_picture_setup.sql in Supabase SQL Editor.");
    }
    throw error;
  }
  return data;
}

export async function createOrder(args: { checkoutInfo: CheckoutInfo; cart: CartItemForOrder[]; totalPrice: number }) {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentSessionUser();
  if (!user) throw new Error("You must be logged in to place an order.");
  if (args.cart.length === 0) throw new Error("Your cart is empty.");
  if (!args.checkoutInfo.phone || !args.checkoutInfo.address) throw new Error("Please complete your delivery details.");

  const storeStatus = await getStoreStatus();
  if (!storeStatus.isOpen) {
    throw new Error(storeStatus.message || "Store is closed right now.");
  }

  const subtotal = Number(args.totalPrice);
  const deliveryFee = Number(args.checkoutInfo.deliveryFee ?? 0);
  const totalAmount = subtotal + deliveryFee;
  const deliveryDistanceKm = Number(args.checkoutInfo.deliveryDistanceKm ?? 0);
  const paymentMethod = args.checkoutInfo.payment;

  if (paymentMethod === "GCash" && !args.checkoutInfo.paymentReference?.trim()) {
    throw new Error("Please enter your GCash reference number.");
  }

  if (paymentMethod === "Card/Bank" && (!args.checkoutInfo.selectedBank || !args.checkoutInfo.paymentReference?.trim())) {
    throw new Error("Please select a bank and enter your transaction reference number.");
  }

  if (["GCash", "Card/Bank"].includes(paymentMethod) && !args.checkoutInfo.paymentProofUrl) {
    throw new Error("Please upload your payment proof.");
  }

  const rpcItems = args.cart.map((item) => ({
    menu_item_id: item.id ?? null,
    item_name: item.name,
    image_url: item.image,
    size_label: item.size ?? null,
    unit_price: item.finalPrice,
    quantity: item.quantity,
    addons: (item.addons ?? []).map((addon) => ({
      inventory_item_id: addon.inventoryItemId,
      addon_name: addon.name,
      price_delta: addon.priceDelta,
      quantity_required: addon.quantityRequired,
    })),
  }));

  const { data: orderId, error: orderError } = await supabase.rpc("place_order_with_inventory", {
    p_phone: args.checkoutInfo.phone,
    p_address: args.checkoutInfo.address,
    p_payment_method: paymentMethod,
    p_total_amount: totalAmount,
    p_items: rpcItems,
    p_subtotal_amount: subtotal,
    p_delivery_option: args.checkoutInfo.deliveryOption ?? "Delivery",
    p_delivery_distance_km: deliveryDistanceKm,
    p_delivery_fee: deliveryFee,
    p_selected_bank: args.checkoutInfo.selectedBank ?? null,
    p_payment_reference: args.checkoutInfo.paymentReference?.trim() || null,
    p_payment_proof_url: args.checkoutInfo.paymentProofUrl ?? null,
  });

  if (!orderError) {
    await upsertMyProfile({
      full_name: args.checkoutInfo.name,
      phone: args.checkoutInfo.phone,
      address: args.checkoutInfo.address,
    });

    return orderId;
  }

  const shouldFallbackToDirectInsert =
    orderError.message.includes("Could not find the function") ||
    orderError.message.includes("function public.place_order_with_inventory") ||
    orderError.message.includes("schema cache") ||
    orderError.message.includes("does not exist") ||
    orderError.message.includes("Could not find") ||
    orderError.message.includes("PGRST");

  if (!shouldFallbackToDirectInsert) {
    throw new Error(orderError.message || "Supabase could not place the order.");
  }

  let { data: order, error: directOrderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "Pending",
      subtotal_amount: subtotal,
      total_amount: totalAmount,
      phone: args.checkoutInfo.phone,
      address: args.checkoutInfo.address,
      delivery_option: args.checkoutInfo.deliveryOption ?? "Delivery",
      delivery_distance_km: deliveryDistanceKm,
      delivery_fee: deliveryFee,
      payment_method: paymentMethod,
      selected_bank: args.checkoutInfo.selectedBank ?? null,
      payment_reference: args.checkoutInfo.paymentReference?.trim() || null,
      payment_proof_url: args.checkoutInfo.paymentProofUrl ?? null,
    })
    .select("*")
    .single();

  if (directOrderError) {
    const paymentForLegacySchema = paymentMethod === "Card/Bank" ? "Cash on Delivery" : paymentMethod;
    const legacyInsert = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "Pending",
        total_amount: totalAmount,
        phone: args.checkoutInfo.phone,
        address: args.checkoutInfo.address,
        payment_method: paymentForLegacySchema,
      })
      .select("*")
      .single();

    order = legacyInsert.data;
    directOrderError = legacyInsert.error;
  }

  if (directOrderError || !order) {
    throw new Error(directOrderError?.message || "Supabase could not create the order row.");
  }

  const itemsPayload: Database["public"]["Tables"]["order_items"]["Insert"][] = args.cart.map((item) => ({
    order_id: order.id,
    menu_item_id: item.id ?? null,
    item_name: item.name,
    image_url: item.image,
    size_label: item.size ?? null,
    unit_price: item.finalPrice,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
  if (itemsError) throw new Error(itemsError.message || "Supabase could not create order items.");

  await upsertMyProfile({
    full_name: args.checkoutInfo.name,
    phone: args.checkoutInfo.phone,
    address: args.checkoutInfo.address,
  });

  return order.id;
}

export async function getMyOrders() {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentSessionUser();
  if (!user) return [];

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "Customer";

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, order_addons(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  type OrderWithNestedItems = OrderRow & { order_items: OrderItemRow[] };
  return ((data ?? []) as unknown as OrderWithNestedItems[]).map((order) => ({
    id: order.id.slice(-12),
    date: new Date(order.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
    updatedAt: new Date(order.updated_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
    status: order.status,
    total: Number(order.total_amount),
    subtotal: Number(order.subtotal_amount ?? order.total_amount),
    deliveryFee: Number(order.delivery_fee ?? 0),
    deliveryDistanceKm: Number(order.delivery_distance_km ?? 0),
    deliveryOption: order.delivery_option ?? "Delivery",
    customer: {
      name: displayName,
      phone: order.phone,
      address: order.address,
      payment: order.payment_method,
      selectedBank: order.selected_bank ?? undefined,
      paymentReference: order.payment_reference ?? undefined,
      paymentProofUrl: order.payment_proof_url ?? undefined,
    },
    items: (order.order_items ?? []).map((item) => ({
      name: item.item_name,
      image: item.image_url,
      quantity: item.quantity,
      size: item.size_label ?? undefined,
      finalPrice: Number(item.unit_price),
    })),
  })) as OrderWithItems[];
}

export async function getAdminOrders() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, order_addons(*))")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const orders = data ?? [];
  const userIds = Array.from(new Set(orders.map((order) => order.user_id)));
  const customerNames = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (profilesError) throw profilesError;
    profiles?.forEach((profile) => {
      if (profile.full_name) customerNames.set(profile.id, profile.full_name);
    });
  }

  return orders.map((order) => ({
    ...order,
    customer_name: customerNames.get(order.user_id) ?? null,
  }));
}

export async function getAdminMetrics() {
  const [menuItems, inventory, orders, profiles] = await Promise.all([
    getMenuItems(),
    getInventoryItems(),
    getAdminOrders(),
    getSupabaseBrowserClient().from("app_users").select("*"),
  ]);

  return {
    totalMenuItems: menuItems.length,
    totalOrders: orders.length,
    totalCustomers: profiles.data?.filter((profile) => profile.role === "customer").length ?? 0,
    lowStockItems: inventory.filter((item) => Number(item.quantity) <= Number(item.low_stock_level)),
    unavailableMenuItems: menuItems.filter((item) => !item.isAvailable),
  };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMyOrder(orderId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw error;
}

function isMissingContactMessagesTable(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("contact_messages") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find")
  );
}

function contactMessagesSetupError() {
  return new Error("Customer messages database is not set up yet. Open Supabase Dashboard > SQL Editor, run supabase/contact_messages_setup.sql, then refresh this page.");
}

export async function createContactMessage(input: { name: string; email: string; message: string }) {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentSessionUser();
  if (!user) throw new Error("Please log in before sending a message so we can notify you when admin replies.");

  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  if (!name || !email || !message) throw new Error("Please complete your name, email, and message.");
  if (message.length > CONTACT_MESSAGE_MAX_LENGTH) {
    throw new Error(`Message is too long. Please keep it under ${CONTACT_MESSAGE_MAX_LENGTH} characters.`);
  }

  const { data: latestMessage, error: latestError } = await supabase
    .from("contact_messages")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    if (isMissingContactMessagesTable(latestError)) throw contactMessagesSetupError();
    throw latestError;
  }

  if (latestMessage?.created_at) {
    const secondsSinceLastMessage = (Date.now() - new Date(latestMessage.created_at).getTime()) / 1000;
    if (secondsSinceLastMessage < CONTACT_MESSAGE_COOLDOWN_SECONDS) {
      const secondsLeft = Math.ceil(CONTACT_MESSAGE_COOLDOWN_SECONDS - secondsSinceLastMessage);
      throw new Error(`Please wait ${secondsLeft} second${secondsLeft === 1 ? "" : "s"} before sending another message.`);
    }
  }

  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      user_id: user.id,
      name,
      email,
      message,
      status: "Unread",
      customer_seen: true,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingContactMessagesTable(error)) throw contactMessagesSetupError();
    throw error;
  }

  return data;
}

export async function getMyContactMessages() {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentSessionUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingContactMessagesTable(error)) throw contactMessagesSetupError();
    throw error;
  }

  return data ?? [];
}

export async function getUnreadContactReplyCount() {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentSessionUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("admin_reply", "is", null)
    .eq("customer_seen", false);

  if (error) {
    if (isMissingContactMessagesTable(error)) return 0;
    throw error;
  }

  return count ?? 0;
}

export async function markMyContactRepliesSeen() {
  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentSessionUser();
  if (!user) return;

  const { error } = await supabase
    .from("contact_messages")
    .update({ customer_seen: true })
    .eq("user_id", user.id)
    .not("admin_reply", "is", null)
    .eq("customer_seen", false);

  if (error) {
    if (isMissingContactMessagesTable(error)) throw contactMessagesSetupError();
    throw error;
  }
}

export async function replyToMyContactMessage(id: string, reply: string) {
  const trimmedReply = reply.trim();
  if (!trimmedReply) throw new Error("Please write a reply before sending.");
  if (trimmedReply.length > CONTACT_MESSAGE_MAX_LENGTH) {
    throw new Error(`Reply is too long. Please keep it under ${CONTACT_MESSAGE_MAX_LENGTH} characters.`);
  }

  const supabase = getSupabaseBrowserClient();
  const user = await getCurrentSessionUser();
  if (!user) throw new Error("Please log in before replying.");

  const { data, error } = await supabase
    .from("contact_messages")
    .update({
      customer_reply: trimmedReply,
      customer_replied_at: new Date().toISOString(),
      status: "Unread",
      customer_seen: true,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    if (isMissingContactMessagesTable(error)) throw contactMessagesSetupError();
    if (error.message.toLowerCase().includes("customer_reply") || error.message.toLowerCase().includes("customer_replied_at")) {
      throw new Error("Customer replies are not set up yet. Run supabase/contact_messages_setup.sql in Supabase SQL Editor, then refresh this page.");
    }
    throw error;
  }

  return data;
}

export async function getAdminContactMessages() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingContactMessagesTable(error)) throw contactMessagesSetupError();
    throw error;
  }

  return data ?? [];
}

export async function markContactMessageRead(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ status: "Read" })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (isMissingContactMessagesTable(error)) throw contactMessagesSetupError();
    throw error;
  }

  return data;
}

export async function replyToContactMessage(id: string, reply: string) {
  const trimmedReply = reply.trim();
  if (!trimmedReply) throw new Error("Please write a reply before sending.");

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .update({
      admin_reply: trimmedReply,
      status: "Replied",
      customer_seen: false,
      replied_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (isMissingContactMessagesTable(error)) throw contactMessagesSetupError();
    throw error;
  }

  return data;
}
