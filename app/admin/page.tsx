"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  createMenuAddon,
  createMenuItem,
  createMenuRequirement,
  deleteInventoryItem,
  deleteMenuAddon,
  deleteMenuItem,
  deleteMenuRequirement,
  getAdminMetrics,
  getAdminContactMessages,
  getAdminOrders,
  getInventoryItems,
  getMenuAddons,
  getMenuItems,
  getMenuRequirements,
  getCurrentAppUserRole,
  markContactMessageRead,
  replyToContactMessage,
  uploadMenuItemImage,
  updateMenuItem,
  upsertInventoryItem,
  type InventoryRow,
} from "@/lib/supabase/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type MenuItem = Awaited<ReturnType<typeof getMenuItems>>[number];
type Requirement = Awaited<ReturnType<typeof getMenuRequirements>>[number];
type MenuAddon = Awaited<ReturnType<typeof getMenuAddons>>[number];
type AdminOrder = Awaited<ReturnType<typeof getAdminOrders>>[number];
type AdminMessage = Awaited<ReturnType<typeof getAdminContactMessages>>[number];
type InventoryType = InventoryRow["inventory_type"];

const CATEGORIES = [
  "Lemonade Series",
  "Float Series",
  "Macchiato",
  "Zagu Delight",
  "Pizza",
  "Silog Combo Meals",
  "Bites Express",
  "Extras",
  "Siopao",
  "Beers",
];

const INVENTORY_TYPES: InventoryType[] = ["ingredient", "packaging", "addon", "beverage"];
const ORDER_STATUSES = ["Pending", "Preparing", "On the way", "Delivered", "Completed", "Cancelled"];
const ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "reports", label: "Reports" },
  { id: "messages", label: "Messages" },
  { id: "menu", label: "Menu" },
  { id: "inventory", label: "Inventory" },
  { id: "links", label: "Links" },
  { id: "orders", label: "Orders" },
];

const REPORT_RANGES = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "all", label: "All Time" },
] as const;

type ReportRange = (typeof REPORT_RANGES)[number]["id"];

const EMPTY_MENU = {
  name: "",
  category: "Lemonade Series",
  base_price: "0",
  image_url: "",
  description: "",
  is_manually_available: true,
};

const EMPTY_INVENTORY = {
  name: "",
  inventory_type: "ingredient" as InventoryType,
  quantity: "0",
  unit: "pcs",
  low_stock_level: "0",
  package_scope: "",
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reportRange, setReportRange] = useState<ReportRange>("30d");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [addons, setAddons] = useState<MenuAddon[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [contactMessages, setContactMessages] = useState<AdminMessage[]>([]);
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof getAdminMetrics>> | null>(null);
  const [editingMenuId, setEditingMenuId] = useState("");
  const [editingInventoryId, setEditingInventoryId] = useState("");
  const [isMenuFormOpen, setIsMenuFormOpen] = useState(false);
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  const [isUploadingMenuImage, setIsUploadingMenuImage] = useState(false);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU);
  const [inventoryForm, setInventoryForm] = useState(EMPTY_INVENTORY);
  const [requirementForm, setRequirementForm] = useState({ menu_item_id: "", inventory_item_id: "", quantity_required: "1" });
  const [addonForm, setAddonForm] = useState({ menu_item_id: "", inventory_item_id: "", price_delta: "0", quantity_required: "1" });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const lowStockItems = useMemo(
    () => inventory.filter((item) => Number(item.quantity) <= Number(item.low_stock_level)),
    [inventory]
  );

  const unavailableMenuItems = useMemo(() => menuItems.filter((item) => !item.isAvailable), [menuItems]);
  const salesReport = useMemo(() => buildSalesReport(orders, reportRange), [orders, reportRange]);
  const unreadMessages = useMemo(() => contactMessages.filter((item) => item.status === "Unread").length, [contactMessages]);

  const loadAdminData = async () => {
    const [menuRows, inventoryRows, requirementRows, addonRows, orderRows, metricRows, messageRows] = await Promise.all([
      getMenuItems(),
      getInventoryItems(),
      getMenuRequirements(),
      getMenuAddons(),
      getAdminOrders(),
      getAdminMetrics(),
      getAdminContactMessages(),
    ]);

    setMenuItems(menuRows);
    setInventory(inventoryRows);
    setRequirements(requirementRows);
    setAddons(addonRows);
    setOrders(orderRows);
    setMetrics(metricRows);
    setContactMessages(messageRows);
  };

  useEffect(() => {
    let isMounted = true;
    let adminChannel: RealtimeChannel | null = null;

    const start = async () => {
      try {
        const role = await getCurrentAppUserRole();
        if (!isMounted) return;

        if (role !== "admin") {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);
        await loadAdminData();
        if (!isMounted) return;

        const supabase = getSupabaseBrowserClient();
        supabase
          .getChannels()
          .filter((channel) => channel.topic === "realtime:admin-inventory-sync")
          .forEach((channel) => {
            void supabase.removeChannel(channel);
          });

        adminChannel = supabase.channel("admin-inventory-sync");
        adminChannel
          .on("postgres_changes", { event: "*", schema: "public" }, () => {
            void loadAdminData();
          })
          .subscribe();
      } catch (err) {
        if (isMounted) setMessage(err instanceof Error ? err.message : "Unable to load admin data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void start();

    return () => {
      isMounted = false;
      if (adminChannel) {
        void getSupabaseBrowserClient().removeChannel(adminChannel);
      }
    };
  }, []);

  const saveMenuItem = async () => {
    setMessage("");
    if (!menuForm.image_url.trim()) {
      setMessage("Please add a menu item picture before saving.");
      return;
    }

    const payload: Database["public"]["Tables"]["menu_items"]["Insert"] = {
      name: menuForm.name,
      category: menuForm.category,
      base_price: Number(menuForm.base_price),
      image_url: menuForm.image_url.trim(),
      description: menuForm.description || null,
      is_manually_available: menuForm.is_manually_available,
    };

    try {
      if (editingMenuId) {
        await updateMenuItem(editingMenuId, payload);
      } else {
        await createMenuItem(payload);
      }

      setEditingMenuId("");
      setMenuForm(EMPTY_MENU);
      setIsMenuFormOpen(false);
      await loadAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save menu item.");
    }
  };

  const handleMenuImageUpload = async (file: File | undefined) => {
    if (!file) return;

    try {
      setMessage("");
      setIsUploadingMenuImage(true);
      const imageUrl = await uploadMenuItemImage(file);
      setMenuForm((previous) => ({ ...previous, image_url: imageUrl }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to upload menu image.");
    } finally {
      setIsUploadingMenuImage(false);
    }
  };

  const saveInventoryItem = async () => {
    await upsertInventoryItem({
      id: editingInventoryId || undefined,
      name: inventoryForm.name,
      inventory_type: inventoryForm.inventory_type,
      quantity: Number(inventoryForm.quantity),
      unit: inventoryForm.unit,
      low_stock_level: Number(inventoryForm.low_stock_level),
      package_scope: inventoryForm.package_scope || null,
    });

    setEditingInventoryId("");
    setInventoryForm(EMPTY_INVENTORY);
    setIsInventoryFormOpen(false);
    await loadAdminData();
  };

  const submitRequirement = async () => {
    await createMenuRequirement({
      menu_item_id: requirementForm.menu_item_id,
      inventory_item_id: requirementForm.inventory_item_id,
      quantity_required: Number(requirementForm.quantity_required),
    });
    setRequirementForm({ menu_item_id: "", inventory_item_id: "", quantity_required: "1" });
    await loadAdminData();
  };

  const submitAddon = async () => {
    await createMenuAddon({
      menu_item_id: addonForm.menu_item_id,
      inventory_item_id: addonForm.inventory_item_id,
      price_delta: Number(addonForm.price_delta),
      quantity_required: Number(addonForm.quantity_required),
    });
    setAddonForm({ menu_item_id: "", inventory_item_id: "", price_delta: "0", quantity_required: "1" });
    await loadAdminData();
  };

  const sendMessageReply = async (id: string) => {
    try {
      setMessage("");
      await replyToContactMessage(id, replyDrafts[id] ?? "");
      setReplyDrafts((previous) => ({ ...previous, [id]: "" }));
      await loadAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to send reply.");
    }
  };

  const setMessageRead = async (id: string) => {
    try {
      setMessage("");
      await markContactMessageRead(id);
      await loadAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to mark message read.");
    }
  };

  const changeOrderStatus = async (orderId: string, status: string) => {
    try {
      setMessage("");
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("Admin session expired. Please log in again.");
      }

      const response = await fetch("/api/orders/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ orderId, status }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update order status.");
      }

      if (result.warning) {
        setMessage(result.warning);
      } else if (result.emailSent) {
        setMessage("Order status updated and customer email sent.");
      } else {
        setMessage("Order status updated.");
      }

      await loadAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update order status.");
      await loadAdminData();
    }
  };

  if (isLoading) return <main className="min-h-screen bg-[#f5f8ee] p-8 text-[#1b5e20]">Loading admin...</main>;

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#f5f8ee] p-8">
        <div className="mx-auto max-w-lg rounded-lg border border-[#dfe9d5] bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-[#1b5e20]">Admin access required</h1>
          <p className="mb-4 text-sm text-[#5d4037]">Your account must be marked as admin in Supabase profiles.</p>
          <Link href="/" className="text-sm font-semibold text-[#4caf50]">Back to site</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f8ee] px-4 py-5 text-[#3f322b] md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#dce8cf] pb-5 md:flex-row md:items-end">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-bold uppercase text-[#4f8a3b]">INDABEST admin</p>
            <h1 className="text-3xl font-extrabold text-[#174b21]">Admin Console</h1>
            <p className="text-sm text-[#6f625a]">Menu, inventory, add-ons, packaging, beverages, and orders.</p>
          </div>
          <Link href="/" className="w-fit rounded-lg border border-[#cbdcbe] bg-white px-4 py-2 text-sm font-semibold text-[#174b21] shadow-sm transition hover:border-[#8bbd66] hover:bg-[#f8fbf4]">View Store</Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-5">
            <nav className="rounded-lg border border-[#d8e5cc] bg-white p-2 shadow-sm">
              <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase text-[#70925f]">Manage</p>
              <div className="grid gap-1 sm:grid-cols-6 lg:grid-cols-1">
                {ADMIN_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
                      activeTab === tab.id
                        ? "bg-[#174b21] text-white shadow-sm"
                        : "text-[#31502a] hover:bg-[#edf5e5]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          <div className="min-w-0">
            {message && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>}

            {activeTab === "dashboard" && (
              <section className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  <Stat label="Menu Items" value={metrics?.totalMenuItems ?? menuItems.length} />
                  <Stat label="Orders" value={metrics?.totalOrders ?? orders.length} />
                  <Stat label="Customers" value={metrics?.totalCustomers ?? 0} />
                  <Stat label="Messages" value={unreadMessages} />
                  <Stat label="Low Stock" value={lowStockItems.length} />
                  <Stat label="Unavailable" value={unavailableMenuItems.length} />
                </div>
                <InventoryAlerts lowStockItems={lowStockItems} unavailableMenuItems={unavailableMenuItems} />
              </section>
            )}

            {activeTab === "reports" && (
              <SalesReportsPanel report={salesReport} range={reportRange} onRangeChange={setReportRange} />
            )}

            {activeTab === "messages" && (
              <AdminMessagesPanel
                messages={contactMessages}
                replyDrafts={replyDrafts}
                onReplyChange={(id, value) => setReplyDrafts((previous) => ({ ...previous, [id]: value }))}
                onReply={sendMessageReply}
                onMarkRead={setMessageRead}
              />
            )}

            {activeTab === "menu" && (
              <section>
                <Panel
                  title="Menu Inventory"
                  action={
                    <button
                      onClick={() => {
                        setEditingMenuId("");
                        setMenuForm(EMPTY_MENU);
                        setIsMenuFormOpen((open) => !open);
                      }}
                      className="rounded-lg bg-[#246b2d] px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b5e20]"
                    >
                      {isMenuFormOpen && !editingMenuId ? "Close" : "Add +"}
                    </button>
                  }
                >
              {isMenuFormOpen && (
                <div className="mb-4 rounded-lg border border-[#d8e5cc] bg-[#fbfdf8] p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold text-[#174b21]">{editingMenuId ? "Edit Menu Item" : "Add Menu Item"}</h3>
                    <button
                      onClick={() => {
                        setEditingMenuId("");
                        setMenuForm(EMPTY_MENU);
                        setIsMenuFormOpen(false);
                      }}
                      className="rounded-md border border-[#cbdcbe] px-2 py-1 text-xs font-bold text-[#31502a] transition hover:bg-[#edf5e5]"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid gap-x-3 md:grid-cols-2 xl:grid-cols-3">
                    <Input label="Name" value={menuForm.name} onChange={(value) => setMenuForm((p) => ({ ...p, name: value }))} />
                    <Select label="Category" value={menuForm.category} options={CATEGORIES} onChange={(value) => setMenuForm((p) => ({ ...p, category: value }))} />
                    <Input label="Price" type="number" value={menuForm.base_price} onChange={(value) => setMenuForm((p) => ({ ...p, base_price: value }))} />
                    <div className="md:col-span-2 xl:col-span-3">
                      <ImageUploadField
                        imageUrl={menuForm.image_url}
                        isUploading={isUploadingMenuImage}
                        onUpload={handleMenuImageUpload}
                        onUrlChange={(value) => setMenuForm((p) => ({ ...p, image_url: value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input label="Description" value={menuForm.description} onChange={(value) => setMenuForm((p) => ({ ...p, description: value }))} />
                    </div>
                    <Select
                      label="Menu Status"
                      value={menuForm.is_manually_available ? "available" : "unavailable"}
                      options={["available", "unavailable"]}
                      labels={{ available: "Available", unavailable: "Unavailable" }}
                      onChange={(value) => setMenuForm((p) => ({ ...p, is_manually_available: value === "available" }))}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button disabled={isUploadingMenuImage} onClick={saveMenuItem} className="rounded-lg bg-[#246b2d] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b5e20] disabled:cursor-not-allowed disabled:opacity-60">
                      {editingMenuId ? "Save Changes" : "Save Menu Item"}
                    </button>
                  </div>
                </div>
              )}
                  <DataTable
                    headers={["Name", "Category", "Price", "Status", "Actions"]}
                    rows={menuItems.map((item) => [
                      item.name,
                      item.category,
                      `P${item.basePrice.toFixed(2)}`,
                      <div key={`${item.id}-status`} className="space-y-1">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${item.isAvailable ? "bg-[#DDF8B1] text-[#174b21]" : "bg-red-50 text-red-600"}`}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </span>
                        {!item.isManuallyAvailable && <p className="text-xs text-[#6f625a]">Manual off</p>}
                      </div>,
                      <RowActions
                        key={item.id}
                        onEdit={() => {
                          setEditingMenuId(item.id);
                          setIsMenuFormOpen(true);
                          setMenuForm({
                            name: item.name,
                            category: item.category,
                            base_price: String(item.basePrice),
                            image_url: item.image,
                            description: item.description ?? "",
                            is_manually_available: item.isManuallyAvailable,
                          });
                        }}
                        onDelete={async () => {
                          await deleteMenuItem(item.id);
                          await loadAdminData();
                        }}
                        extraAction={{
                          label: item.isManuallyAvailable ? "Set Unavailable" : "Set Available",
                          onClick: async () => {
                            await updateMenuItem(item.id, { is_manually_available: !item.isManuallyAvailable });
                            await loadAdminData();
                          },
                        }}
                      />,
                    ])}
                  />
            </Panel>
              </section>
            )}

            {activeTab === "inventory" && (
              <section>
                <Panel
                  title="Stock List"
                  action={
                    <button
                      onClick={() => {
                        setEditingInventoryId("");
                        setInventoryForm(EMPTY_INVENTORY);
                        setIsInventoryFormOpen((open) => !open);
                      }}
                      className="rounded-lg bg-[#246b2d] px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b5e20]"
                    >
                      {isInventoryFormOpen && !editingInventoryId ? "Close" : "Add +"}
                    </button>
                  }
                >
                  {isInventoryFormOpen && (
                    <div className="mb-4 rounded-lg border border-[#d8e5cc] bg-[#fbfdf8] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-extrabold text-[#174b21]">{editingInventoryId ? "Edit Inventory Item" : "Add Inventory Item"}</h3>
                        <button
                          onClick={() => {
                            setEditingInventoryId("");
                            setInventoryForm(EMPTY_INVENTORY);
                            setIsInventoryFormOpen(false);
                          }}
                          className="rounded-md border border-[#cbdcbe] px-2 py-1 text-xs font-bold text-[#31502a] transition hover:bg-[#edf5e5]"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid gap-x-3 md:grid-cols-2 xl:grid-cols-3">
                        <Input label="Name" value={inventoryForm.name} onChange={(value) => setInventoryForm((p) => ({ ...p, name: value }))} />
                        <Select label="Type" value={inventoryForm.inventory_type} options={INVENTORY_TYPES} onChange={(value) => setInventoryForm((p) => ({ ...p, inventory_type: value as InventoryType }))} />
                        <Input label="Quantity" type="number" value={inventoryForm.quantity} onChange={(value) => setInventoryForm((p) => ({ ...p, quantity: value }))} />
                        <Input label="Unit" value={inventoryForm.unit} onChange={(value) => setInventoryForm((p) => ({ ...p, unit: value }))} />
                        <Input label="Low stock level" type="number" value={inventoryForm.low_stock_level} onChange={(value) => setInventoryForm((p) => ({ ...p, low_stock_level: value }))} />
                        <Input label="Packaging scope" value={inventoryForm.package_scope} onChange={(value) => setInventoryForm((p) => ({ ...p, package_scope: value }))} />
                      </div>
                      <div className="flex justify-end">
                        <button onClick={saveInventoryItem} className="rounded-lg bg-[#246b2d] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b5e20]">
                          {editingInventoryId ? "Save Changes" : "Save Inventory Item"}
                        </button>
                      </div>
                    </div>
                  )}
                  <DataTable
                    headers={["Name", "Type", "Stock", "Low At", "Actions"]}
                    rows={inventory.map((item) => [
                      item.name,
                      item.inventory_type,
                      `${Number(item.quantity)} ${item.unit}`,
                      `${Number(item.low_stock_level)} ${item.unit}`,
                      <RowActions
                        key={item.id}
                        onEdit={() => {
                          setEditingInventoryId(item.id);
                          setIsInventoryFormOpen(true);
                          setInventoryForm({
                            name: item.name,
                            inventory_type: item.inventory_type,
                            quantity: String(item.quantity),
                            unit: item.unit,
                            low_stock_level: String(item.low_stock_level),
                            package_scope: item.package_scope ?? "",
                          });
                        }}
                        onDelete={async () => {
                          await deleteInventoryItem(item.id);
                          await loadAdminData();
                        }}
                      />,
                    ])}
                  />
                </Panel>
              </section>
            )}

            {activeTab === "links" && (
              <section className="grid gap-5 xl:grid-cols-2">
            <Panel title="Menu Item Requirements">
              <Select label="Menu Item" value={requirementForm.menu_item_id} options={menuItems.map((item) => item.id)} labels={Object.fromEntries(menuItems.map((item) => [item.id, item.name]))} onChange={(value) => setRequirementForm((p) => ({ ...p, menu_item_id: value }))} />
              <Select label="Inventory Item" value={requirementForm.inventory_item_id} options={inventory.map((item) => item.id)} labels={Object.fromEntries(inventory.map((item) => [item.id, `${item.name} (${item.inventory_type})`]))} onChange={(value) => setRequirementForm((p) => ({ ...p, inventory_item_id: value }))} />
              <Input label="Quantity used per order" type="number" value={requirementForm.quantity_required} onChange={(value) => setRequirementForm((p) => ({ ...p, quantity_required: value }))} />
              <button onClick={submitRequirement} className="mb-4 w-full rounded-lg bg-[#246b2d] py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b5e20]">Add Requirement</button>
              <DataTable
                headers={["Menu", "Stock Item", "Qty", ""]}
                rows={requirements.map((req) => [
                  menuItems.find((item) => item.id === req.menu_item_id)?.name ?? "Menu item",
                  inventory.find((item) => item.id === req.inventory_item_id)?.name ?? "Inventory item",
                  String(req.quantity_required),
                  <button key={req.id} onClick={async () => { await deleteMenuRequirement(req.id); await loadAdminData(); }} className="text-xs font-bold text-red-600">Delete</button>,
                ])}
              />
            </Panel>

            <Panel title="Add-ons / Extras">
              <Select label="Menu Item" value={addonForm.menu_item_id} options={menuItems.map((item) => item.id)} labels={Object.fromEntries(menuItems.map((item) => [item.id, item.name]))} onChange={(value) => setAddonForm((p) => ({ ...p, menu_item_id: value }))} />
              <Select label="Add-on Stock" value={addonForm.inventory_item_id} options={inventory.filter((item) => item.inventory_type === "addon").map((item) => item.id)} labels={Object.fromEntries(inventory.filter((item) => item.inventory_type === "addon").map((item) => [item.id, item.name]))} onChange={(value) => setAddonForm((p) => ({ ...p, inventory_item_id: value }))} />
              <Input label="Extra price" type="number" value={addonForm.price_delta} onChange={(value) => setAddonForm((p) => ({ ...p, price_delta: value }))} />
              <Input label="Stock used per add-on" type="number" value={addonForm.quantity_required} onChange={(value) => setAddonForm((p) => ({ ...p, quantity_required: value }))} />
              <button onClick={submitAddon} className="mb-4 w-full rounded-lg bg-[#246b2d] py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b5e20]">Add Add-on</button>
              <DataTable
                headers={["Menu", "Add-on", "Price", ""]}
                rows={addons.map((addon) => [
                  menuItems.find((item) => item.id === addon.menu_item_id)?.name ?? "Menu item",
                  inventory.find((item) => item.id === addon.inventory_item_id)?.name ?? "Add-on",
                  `P${Number(addon.price_delta).toFixed(2)}`,
                  <button key={addon.id} onClick={async () => { await deleteMenuAddon(addon.id); await loadAdminData(); }} className="text-xs font-bold text-red-600">Delete</button>,
                ])}
              />
            </Panel>
              </section>
            )}

            {activeTab === "orders" && (
              <Panel title="Orders Management">
            <DataTable
              headers={["Customer", "Order", "Total", "Payment", "Delivery", "Status"]}
              rows={orders.map((order) => [
                <div key={order.id} className="min-w-[150px]">
                  <p className="font-bold text-[#174b21]">{order.customer_name ?? "Customer"}</p>
                  <p className="mt-1 text-xs text-[#6f625a]">{order.phone}</p>
                </div>,
                <div key={`${order.id}-items`} className="min-w-[190px]">
                  <p>{new Date(order.created_at).toLocaleString("en-PH")} | {order.order_items?.length ?? 0} item(s)</p>
                  <div className="mt-1 space-y-0.5">
                    {((order.order_items ?? []) as unknown as Array<{
                      id: string;
                      quantity: number;
                      item_name: string;
                      size_label: string | null;
                      order_addons?: Array<{ id: string; addon_name: string; quantity: number }>;
                    }>).slice(0, 3).map((item) => (
                      <div key={item.id} className="text-xs text-[#6f625a]">
                        <p>{item.quantity}x {item.item_name}{item.size_label ? ` (${item.size_label})` : ""}</p>
                        {(item.order_addons ?? []).map((addon) => (
                          <p key={addon.id} className="pl-2 text-[#8a7a70]">
                            + {addon.addon_name} x{addon.quantity}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>,
                `P${Number(order.total_amount).toFixed(2)}`,
                <div key={`${order.id}-payment`} className="min-w-[180px]">
                  <p>{order.payment_method}{order.selected_bank ? ` - ${order.selected_bank}` : ""}</p>
                  {order.payment_reference && <p className="text-xs text-[#6f625a]">Ref: {order.payment_reference}</p>}
                  {order.payment_proof_url && (
                    <a href={order.payment_proof_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#174b21] hover:underline">
                      View Proof
                    </a>
                  )}
                </div>,
                `P${Number(order.delivery_fee ?? 0).toFixed(2)}`,
                <select
                  key={order.id}
                  value={order.status}
                  onChange={async (e) => {
                    await changeOrderStatus(order.id, e.target.value);
                  }}
                  className="rounded-lg border border-[#c8e6c9] bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#8bbd66]"
                >
                  {ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>,
              ])}
            />
              </Panel>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function AdminMessagesPanel({
  messages,
  replyDrafts,
  onReplyChange,
  onReply,
  onMarkRead,
}: {
  messages: AdminMessage[];
  replyDrafts: Record<string, string>;
  onReplyChange: (id: string, value: string) => void;
  onReply: (id: string) => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
}) {
  return (
    <Panel title="Customer Messages">
      {messages.length === 0 ? (
        <p className="rounded-lg border border-[#eef3e8] bg-[#fbfdf8] px-3 py-8 text-center text-sm text-[#7b7169]">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((item) => (
            <article key={item.id} className="rounded-lg border border-[#eef3e8] bg-[#fbfdf8] p-4">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-[#174b21]">{item.name}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                      item.status === "Replied"
                        ? "bg-[#DDF8B1] text-[#174b21]"
                        : item.status === "Read"
                          ? "bg-[#edf5e5] text-[#31502a]"
                          : "bg-[#fff3e0] text-[#f57c00]"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6f625a]">{item.email} | {new Date(item.created_at).toLocaleString("en-PH")}</p>
                </div>
                {item.status === "Unread" && (
                  <button onClick={() => void onMarkRead(item.id)} className="w-fit rounded-md border border-[#cbdcbe] px-2 py-1 text-xs font-bold text-[#174b21] transition hover:bg-[#edf5e5]">
                    Mark Read
                  </button>
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-sm text-[#3f322b]">{item.message}</p>

              {item.customer_reply && (
                <div className="mt-3 rounded-lg border border-[#d8e5cc] bg-white px-3 py-2">
                  <p className="mb-1 text-xs font-bold uppercase text-[#5f8f49]">Customer Reply</p>
                  <p className="whitespace-pre-wrap text-sm text-[#3f322b]">{item.customer_reply}</p>
                  {item.customer_replied_at && <p className="mt-1 text-xs text-[#6f625a]">{new Date(item.customer_replied_at).toLocaleString("en-PH")}</p>}
                </div>
              )}

              {item.admin_reply && (
                <div className="mt-3 rounded-lg border border-[#d8e5cc] bg-white px-3 py-2">
                  <p className="mb-1 text-xs font-bold uppercase text-[#5f8f49]">Reply sent</p>
                  <p className="whitespace-pre-wrap text-sm text-[#3f322b]">{item.admin_reply}</p>
                  {item.replied_at && <p className="mt-1 text-xs text-[#6f625a]">{new Date(item.replied_at).toLocaleString("en-PH")}</p>}
                </div>
              )}

              <div className="mt-3">
                <textarea
                  value={replyDrafts[item.id] ?? ""}
                  onChange={(event) => onReplyChange(item.id, event.target.value)}
                  placeholder={item.admin_reply ? "Write a new reply..." : "Write admin reply..."}
                  className="h-24 w-full resize-none rounded-lg border border-[#cbdcbe] bg-white px-3 py-2 text-sm text-[#2f2924] outline-none transition focus:border-[#8bbd66] focus:ring-2 focus:ring-[#cfe8bc]"
                />
                <div className="mt-2 flex justify-end">
                  <button onClick={() => void onReply(item.id)} className="rounded-lg bg-[#246b2d] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b5e20]">
                    Send Reply
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#d8e5cc] bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-[#5f8f49]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#174b21]">{value}</p>
    </div>
  );
}

function buildSalesReport(orders: AdminOrder[], range: ReportRange) {
  const now = new Date();
  const start = new Date(now);
  if (range === "today") start.setHours(0, 0, 0, 0);
  if (range === "7d") start.setDate(now.getDate() - 6);
  if (range === "30d") start.setDate(now.getDate() - 29);

  const rangedOrders = range === "all"
    ? orders
    : orders.filter((order) => new Date(order.created_at) >= start);
  const salesOrders = rangedOrders.filter((order) => order.status !== "Cancelled");
  const completedOrders = rangedOrders.filter((order) => ["Delivered", "Completed"].includes(order.status));
  const totalSales = salesOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const completedSales = completedOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const averageOrder = salesOrders.length > 0 ? totalSales / salesOrders.length : 0;

  const statusCounts = ORDER_STATUSES.map((status) => ({
    status,
    count: rangedOrders.filter((order) => order.status === status).length,
  }));

  const dailySalesMap = new Map<string, { date: string; orders: number; sales: number }>();
  const itemMap = new Map<string, { name: string; quantity: number; sales: number }>();

  salesOrders.forEach((order) => {
    const date = new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    const day = dailySalesMap.get(date) ?? { date, orders: 0, sales: 0 };
    day.orders += 1;
    day.sales += Number(order.total_amount);
    dailySalesMap.set(date, day);

    const items = (order.order_items ?? []) as unknown as { item_name: string; quantity: number; unit_price: number }[];
    items.forEach((item) => {
      const existing = itemMap.get(item.item_name) ?? { name: item.item_name, quantity: 0, sales: 0 };
      existing.quantity += Number(item.quantity);
      existing.sales += Number(item.unit_price) * Number(item.quantity);
      itemMap.set(item.item_name, existing);
    });
  });

  return {
    totalSales,
    completedSales,
    totalOrders: rangedOrders.length,
    salesOrders: salesOrders.length,
    cancelledOrders: rangedOrders.filter((order) => order.status === "Cancelled").length,
    averageOrder,
    statusCounts,
    dailySales: Array.from(dailySalesMap.values()).slice(-10),
    bestSellers: Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 8),
  };
}

function formatPeso(value: number) {
  return `P${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ReportStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#d8e5cc] bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-[#5f8f49]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-[#174b21]">{value}</p>
    </div>
  );
}

function SalesReportsPanel({
  report,
  range,
  onRangeChange,
}: {
  report: ReturnType<typeof buildSalesReport>;
  range: ReportRange;
  onRangeChange: (range: ReportRange) => void;
}) {
  return (
    <section className="space-y-5">
      <Panel
        title="Sales Reports"
        action={
          <div className="flex flex-wrap gap-2">
            {REPORT_RANGES.map((option) => (
              <button
                key={option.id}
                onClick={() => onRangeChange(option.id)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  range === option.id ? "bg-[#174b21] text-white" : "bg-[#edf5e5] text-[#31502a] hover:bg-[#dceccf]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <ReportStat label="Gross Sales" value={formatPeso(report.totalSales)} />
          <ReportStat label="Completed Sales" value={formatPeso(report.completedSales)} />
          <ReportStat label="Orders" value={report.totalOrders} />
          <ReportStat label="Avg. Order" value={formatPeso(report.averageOrder)} />
          <ReportStat label="Cancelled" value={report.cancelledOrders} />
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Daily Sales">
          <DataTable
            headers={["Date", "Orders", "Sales"]}
            rows={report.dailySales.map((day) => [
              day.date,
              String(day.orders),
              formatPeso(day.sales),
            ])}
          />
        </Panel>

        <Panel title="Best Sellers">
          <DataTable
            headers={["Item", "Qty Sold", "Sales"]}
            rows={report.bestSellers.map((item) => [
              item.name,
              String(item.quantity),
              formatPeso(item.sales),
            ])}
          />
        </Panel>
      </div>

      <Panel title="Order Status Breakdown">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {report.statusCounts.map((status) => (
            <div key={status.status} className="rounded-lg border border-[#eef3e8] bg-[#fbfdf8] p-3">
              <p className="text-xs font-bold uppercase text-[#5f8f49]">{status.status}</p>
              <p className="mt-1 text-2xl font-extrabold text-[#174b21]">{status.count}</p>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d8e5cc] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#eef3e8] pb-3">
        <h2 className="text-lg font-bold text-[#174b21]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function InventoryAlerts({ lowStockItems, unavailableMenuItems }: { lowStockItems: InventoryRow[]; unavailableMenuItems: MenuItem[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Panel title="Low Stock Alerts">
        {lowStockItems.length === 0 ? <p className="text-sm">No low stock items.</p> : (
          <ul className="space-y-2">
            {lowStockItems.map((item) => <li key={item.id} className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{item.name}: {Number(item.quantity)} {item.unit}</li>)}
          </ul>
        )}
      </Panel>
      <Panel title="Unavailable Menu Items">
        {unavailableMenuItems.length === 0 ? <p className="text-sm">All menu items are available.</p> : (
          <ul className="space-y-2">
            {unavailableMenuItems.map((item) => <li key={item.id} className="rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{item.name}</li>)}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="mb-3 block text-sm font-semibold text-[#4b433d]">
      {label}
      <input value={value} type={type} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-[#cbdcbe] bg-[#fbfdf8] px-3 py-2.5 text-sm text-[#2f2924] outline-none transition focus:border-[#8bbd66] focus:bg-white focus:ring-2 focus:ring-[#cfe8bc]" />
    </label>
  );
}

function Select({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="mb-3 block text-sm font-semibold text-[#4b433d]">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-[#cbdcbe] bg-[#fbfdf8] px-3 py-2.5 text-sm text-[#2f2924] outline-none transition focus:border-[#8bbd66] focus:bg-white focus:ring-2 focus:ring-[#cfe8bc]">
        <option value="">Select...</option>
        {options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}
      </select>
    </label>
  );
}

function ImageUploadField({
  imageUrl,
  isUploading,
  onUpload,
  onUrlChange,
}: {
  imageUrl: string;
  isUploading: boolean;
  onUpload: (file: File | undefined) => void;
  onUrlChange: (value: string) => void;
}) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-sm font-semibold text-[#4b433d]">Picture</p>
      <div className="rounded-lg border border-dashed border-[#b7d3a2] bg-[#fbfdf8] p-3">
        {imageUrl ? (
          <div className="mb-3 flex items-center gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-lg border border-[#d8e5cc] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Menu item preview" className="h-full w-full object-contain p-1" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase text-[#5f8f49]">Image ready</p>
              <p className="truncate text-xs text-[#6f625a]">{imageUrl}</p>
            </div>
          </div>
        ) : (
          <p className="mb-3 text-xs text-[#6f625a]">Choose a JPG, PNG, or WebP image under 3MB.</p>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isUploading}
          onChange={(event) => {
            void onUpload(event.target.files?.[0]);
            event.target.value = "";
          }}
          className="block w-full text-sm text-[#4b433d] file:mr-3 file:rounded-lg file:border-0 file:bg-[#246b2d] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#1b5e20] disabled:opacity-60"
        />

        <label className="mt-3 block text-xs font-semibold text-[#6f625a]">
          Image URL or path
          <input
            value={imageUrl}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="/example.png or uploaded URL"
            className="mt-1 w-full rounded-lg border border-[#cbdcbe] bg-white px-3 py-2 text-xs text-[#2f2924] outline-none transition focus:border-[#8bbd66] focus:ring-2 focus:ring-[#cfe8bc]"
          />
        </label>
        {isUploading && <p className="mt-2 text-xs font-semibold text-[#246b2d]">Uploading picture...</p>}
      </div>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#eef3e8]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-[#f3f8ec]">
          <tr className="border-b border-[#d8e5cc]">
            {headers.map((header) => <th key={header} className="px-3 py-2.5 text-xs font-extrabold uppercase text-[#5f8f49]">{header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef3e8]">
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-8 text-center text-sm text-[#7b7169]" colSpan={headers.length}>No records yet.</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="bg-white transition hover:bg-[#fbfdf8]">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3 align-top text-[#3f322b]">{cell}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  extraAction,
}: {
  onEdit: () => void;
  onDelete: () => Promise<void>;
  extraAction?: { label: string; onClick: () => Promise<void> };
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={onEdit} className="rounded-md border border-[#cbdcbe] px-2 py-1 text-xs font-bold text-[#174b21] transition hover:bg-[#edf5e5]">Edit</button>
      {extraAction && (
        <button onClick={() => { void extraAction.onClick(); }} className="rounded-md border border-[#cbdcbe] px-2 py-1 text-xs font-bold text-[#174b21] transition hover:bg-[#edf5e5]">
          {extraAction.label}
        </button>
      )}
      <button onClick={onDelete} className="rounded-md border border-red-100 px-2 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50">Delete</button>
    </div>
  );
}
