"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { useAuthProfile } from "@/components/use-auth-profile";
import { createOrder, getAvailableMenuItems, getMyProfile, uploadPaymentProof, type MenuAddonOption } from "@/lib/supabase/data";

type MenuItem = {
  id: string;
  name: string;
  price: string;
  basePrice: number;
  image: string;
  category: string;
  isAvailable: boolean;
  addons?: MenuAddonOption[];
  standaloneAddon?: MenuAddonOption;
};
type CartItem = MenuItem & { quantity: number; size?: string; finalPrice: number; addons?: MenuAddonOption[] };
type CheckoutInfo = {
  name: string;
  email: string;
  phone: string;
  address: string;
  payment: string;
  selectedBank?: string;
  paymentReference?: string;
  paymentProofUrl?: string;
  deliveryOption?: string;
  deliveryFee?: number;
};

const DEFAULT_CHECKOUT_INFO: CheckoutInfo = {
  name: "",
  email: "",
  phone: "",
  address: "",
  payment: "Cash on Delivery",
  selectedBank: "",
  paymentReference: "",
  paymentProofUrl: "",
  deliveryOption: "Delivery",
  deliveryFee: 30,
};

const GCASH_NUMBER = "09486123571";
const GCASH_ACCOUNT_NAME = "JE**Y M** F.";
const BANK_ACCOUNTS: Record<string, string> = {
  Landbank: "2368-1174-9943",
  BDO: "8734-0098-6783",
  BPI: "9879-0098-2351",
};
const DEFAULT_DELIVERY_FEE = 30;

const DRINK_CATEGORIES = ["Lemonade Series", "Float Series", "Macchiato", "Zagu Delight"];
const SIZE_OPTIONS: Record<string, { label: string; extra: number }[]> = {
  "Lemonade Series":   [{ label: "Small", extra: 0 }, { label: "Medium", extra: 10 }, { label: "Large", extra: 20 }],
  "Float Series":      [{ label: "Small", extra: 0 }, { label: "Medium", extra: 10 }, { label: "Large", extra: 20 }],
  "Macchiato":         [{ label: "Small", extra: 0 }, { label: "Medium", extra: 10 }, { label: "Large", extra: 20 }],
  "Zagu Delight":      [{ label: "Small", extra: 0 }, { label: "Medium", extra: 10 }, { label: "Large", extra: 20 }],
  "Pizza":             [{ label: "Regular", extra: 0 }, { label: "Large", extra: 30 }],
  "Siopao":            [{ label: "Regular", extra: 0 }, { label: "Large", extra: 15 }],
  "Silog Combo Meals": [{ label: "Solo", extra: 0 }, { label: "Add Rice", extra: 15 }],
  "Bites Express":     [{ label: "Small", extra: 0 }, { label: "Medium", extra: 15 }, { label: "Large", extra: 25 }],
};
const SIZES = [{ label: "Small", extra: 0 }, { label: "Medium", extra: 10 }, { label: "Large", extra: 20 }];
const CART_STORAGE_KEY = "indabest_cart";
const CART_COUNT_STORAGE_KEY = "indabest_cart_count";
const RICE_MENU_ITEM: MenuItem = {
  id: "",
  name: "Rice",
  price: "P15.00",
  basePrice: 15,
  image: "/rice.png",
  category: "Extras",
  isAvailable: true,
  addons: [],
};

type MenuAddonApiRow = {
  id: string;
  inventory_item_id: string;
  price_delta: number;
  quantity_required: number;
  is_available: boolean;
};

type InventoryApiRow = {
  id: string;
  name: string;
  quantity: number;
};

function imageForAddon(name: string) {
  return name.toLowerCase().includes("rice") ? "/rice.png" : "/logo.png";
}

async function getStandaloneAddonItems(): Promise<MenuItem[]> {
  const response = await fetch("/api/menu/addons", { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to load add-on category.");

  const addons = (result.addons ?? []) as MenuAddonApiRow[];
  const inventory = (result.inventory ?? []) as InventoryApiRow[];
  const addonByInventoryId = new Map<string, MenuAddonApiRow>();

  addons
    .filter((addon) => addon.is_available)
    .forEach((addon) => {
      if (!addonByInventoryId.has(addon.inventory_item_id)) {
        addonByInventoryId.set(addon.inventory_item_id, addon);
      }
    });

  return inventory
    .filter((item) => Number(item.quantity) > 0)
    .filter((item) => addonByInventoryId.has(item.id))
    .map((item) => {
      const addon = addonByInventoryId.get(item.id)!;
      const price = Number(addon.price_delta ?? 0);
      return {
        id: `addon-item-${item.id}`,
        name: item.name,
        price: `P${price.toFixed(2)}`,
        basePrice: price,
        image: imageForAddon(item.name),
        category: "Add-ons",
        isAvailable: true,
        addons: [],
        standaloneAddon: {
          id: `stock-${addon.id}`,
          inventoryItemId: item.id,
          name: item.name,
          priceDelta: 0,
          quantityRequired: Math.max(1, Number(addon.quantity_required ?? 1)),
          isAvailable: true,
          stockQuantity: Number(item.quantity),
          saveAsOrderAddon: false,
        },
      };
    });
}

function updateNavbarCartCount(count: number) {
  window.localStorage.setItem(CART_COUNT_STORAGE_KEY, String(count));
  window.dispatchEvent(new CustomEvent("indabest:cart-count-changed", { detail: { count } }));
}

function getCartCount(cartItems: CartItem[]) {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

function saveCart(cartItems: CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  updateNavbarCartCount(getCartCount(cartItems));
}

function clearSavedCart() {
  window.localStorage.removeItem(CART_STORAGE_KEY);
  updateNavbarCartCount(0);
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { isLoggedIn, userName, userEmail } = useAuthProfile();
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalQty, setModalQty] = useState(1);
  const [modalSize, setModalSize] = useState("Small");
  const [modalAddonQuantities, setModalAddonQuantities] = useState<Record<string, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo>(DEFAULT_CHECKOUT_INFO);
  const [profileCheckoutInfo, setProfileCheckoutInfo] = useState<CheckoutInfo>(DEFAULT_CHECKOUT_INFO);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuError, setMenuError] = useState("");
  const [paymentProofError, setPaymentProofError] = useState("");
  const [cartNotice, setCartNotice] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isUploadingPaymentProof, setIsUploadingPaymentProof] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setMenuError("");
        const items = await getAvailableMenuItems();
        const addonItems = await getStandaloneAddonItems();
        const withRice = items.some((item) => item.name.toLowerCase() === "rice") ? items : [...items, RICE_MENU_ITEM];
        setMenuItems([...withRice, ...addonItems]);
      } catch (err) {
        setMenuError(err instanceof Error ? err.message : "Unable to load menu items.");
      }
    };

    void loadMenu();
  }, []);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]") as CartItem[];
      if (!Array.isArray(savedCart)) return;

      const validCart = savedCart.filter((item) =>
        item &&
        typeof item.name === "string" &&
        typeof item.image === "string" &&
        typeof item.finalPrice === "number" &&
        typeof item.quantity === "number" &&
        item.quantity > 0
      );

      setCart(validCart);
      updateNavbarCartCount(getCartCount(validCart));
    } catch (error) {
      console.warn("[cart] Unable to load saved cart.", error);
      clearSavedCart();
    }
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cart") === "open") {
      setShowCart(true);
      updateNavbarCartCount(0);
    }

    const openCart = () => {
      setShowCart(true);
      updateNavbarCartCount(0);
    };
    const clearCart = () => {
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
    };
    window.addEventListener("indabest:open-cart", openCart);
    window.addEventListener("indabest:cart-cleared", clearCart);
    return () => {
      window.removeEventListener("indabest:open-cart", openCart);
      window.removeEventListener("indabest:cart-cleared", clearCart);
    };
  }, []);

  useEffect(() => {
    if (!cartNotice) return;
    const timeoutId = window.setTimeout(() => setCartNotice(""), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [cartNotice]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadProfile = async () => {
      try {
        const profile = await getMyProfile();
        setProfileCheckoutInfo({
          name: profile?.full_name || userName || "",
          email: userEmail || "",
          phone: profile?.phone || "",
          address: profile?.address || "",
          payment: "Cash on Delivery",
          selectedBank: "",
          paymentReference: "",
          paymentProofUrl: "",
          deliveryOption: "Delivery",
          deliveryFee: DEFAULT_DELIVERY_FEE,
        });
      } catch {
        setProfileCheckoutInfo({
          name: userName || "",
          email: userEmail || "",
          phone: "",
          address: "",
          payment: "Cash on Delivery",
          selectedBank: "",
          paymentReference: "",
          paymentProofUrl: "",
          deliveryOption: "Delivery",
          deliveryFee: DEFAULT_DELIVERY_FEE,
        });
      }
    };

    void loadProfile();
  }, [isLoggedIn, userName, userEmail]);

  const getSavedCheckoutInfo = (): CheckoutInfo => {
    const savedInfo = JSON.parse(localStorage.getItem("checkoutInfo") || "{}") as Partial<CheckoutInfo>;

    return {
      name: profileCheckoutInfo.name,
      email: profileCheckoutInfo.email,
      phone: profileCheckoutInfo.phone || savedInfo.phone || "",
      address: profileCheckoutInfo.address || savedInfo.address || "",
      payment: savedInfo.payment || "Cash on Delivery",
      selectedBank: savedInfo.selectedBank || "",
      paymentReference: "",
      paymentProofUrl: "",
      deliveryOption: savedInfo.deliveryOption || "Delivery",
      deliveryFee: savedInfo.deliveryOption === "Pickup" ? 0 : DEFAULT_DELIVERY_FEE,
    };
  };

  const openCheckout = () => {
    setCheckoutInfo(getSavedCheckoutInfo());
    setShowCart(false);
    setShowCheckout(true);
  };

  const categories = [
    { label: "All", icon: "🍽️" },
    { label: "Lemonade Series", icon: "🍋" },
    { label: "Float Series", icon: "🥤" },
    { label: "Macchiato", icon: "☕" },
    { label: "Zagu Delight", icon: "🧋" },
    { label: "Pizza", icon: "🍕" },
    { label: "Silog Combo Meals", icon: "🍳" },
    { label: "Bites Express", icon: "🍢" },
    { label: "Extras", icon: "🍚" },
    { label: "Add-ons", icon: "➕" },
    { label: "Siopao", icon: "🥟" },
    { label: "Beers", icon: "🍺" },
  ];

  const filteredItems = activeCategory === "All"
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

  const hasSizes = (category: string) => category in SIZE_OPTIONS;
  const getSizes = (category: string) => SIZE_OPTIONS[category] ?? SIZES;

  const addonKey = (addons?: MenuAddonOption[]) =>
    (addons ?? [])
      .filter((addon) => (addon.quantity ?? 0) > 0)
      .map((addon) => `${addon.id}:${addon.quantity}`)
      .sort()
      .join("|");
  const cartKey = (name: string, size?: string, addons?: MenuAddonOption[]) => `${name}__${size ?? ""}__${addonKey(addons)}`;
  const getQty = (name: string, size?: string) => cart.find((c) => cartKey(c.name, c.size, c.addons) === cartKey(name, size))?.quantity ?? 0;
  const getTotalQtyByName = (name: string) => cart.filter((c) => c.name === name).reduce((s, c) => s + c.quantity, 0);

  const handleAddToCart = (item: MenuItem, qty = 1, size?: string, selectedAddons: MenuAddonOption[] = []) => {
    if (!isLoggedIn) { setShowModal(true); return; }
    if (!item.isAvailable) return;
    const visibleSelectedAddons = selectedAddons.filter((addon) => addon.saveAsOrderAddon !== false);
    const basePrice = parseFloat(item.price.replace("P", ""));
    const sizes = getSizes(item.category);
    const selectedSize = size ? sizes.find((s) => s.label === size) : undefined;
    const sizeExtra = selectedSize?.extra ?? 0;
    const sizeAddon = selectedSize && selectedSize.extra > 0 && selectedSize.label.toLowerCase().includes("add")
      ? [{
          id: `size-addon-${selectedSize.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          inventoryItemId: "",
          name: selectedSize.label,
          priceDelta: selectedSize.extra,
          quantityRequired: 1,
          isAvailable: true,
      }]
      : [];
    const stockAddon = item.standaloneAddon
      ? [{ ...item.standaloneAddon, quantity: 1 }]
      : [];
    const cartAddons = [...visibleSelectedAddons, ...sizeAddon, ...stockAddon];
    const addonTotal = visibleSelectedAddons.reduce((sum, addon) => sum + addon.priceDelta * Number(addon.quantity ?? 1), 0);
    const finalPrice = basePrice + sizeExtra + addonTotal;
    const key = cartKey(item.name, size, cartAddons);
    setCart((prev) => {
      const existing = prev.find((c) => cartKey(c.name, c.size, c.addons) === key);
      const nextCart = existing
        ? prev.map((c) => cartKey(c.name, c.size, c.addons) === key ? { ...c, quantity: c.quantity + qty } : c)
        : [...prev, { ...item, addons: cartAddons, quantity: qty, size, finalPrice }];
      saveCart(nextCart);
      return nextCart;
    });
    setCartNotice("Added to cart!");
  };

  const handleDecrement = (name: string, size?: string, addons?: MenuAddonOption[]) => {
    const key = cartKey(name, size, addons);
    setCart((prev) => {
      const existing = prev.find((c) => cartKey(c.name, c.size, c.addons) === key);
      if (!existing) return prev;
      const nextCart = existing.quantity === 1
        ? prev.filter((c) => cartKey(c.name, c.size, c.addons) !== key)
        : prev.map((c) => cartKey(c.name, c.size, c.addons) === key ? { ...c, quantity: c.quantity - 1 } : c);
      saveCart(nextCart);
      return nextCart;
    });
  };

  const closeModal = () => { setSelectedItem(null); setModalQty(1); setModalAddonQuantities({}); setModalSize(getSizes(selectedItem?.category ?? "")[0]?.label ?? "Small"); };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setMenuError("");

    try {
      await createOrder({ checkoutInfo, cart, totalPrice: subtotalPrice });
      localStorage.setItem("checkoutInfo", JSON.stringify(checkoutInfo));
      setCart([]);
      clearSavedCart();
      setShowCheckout(false);
      setCheckoutInfo(getSavedCheckoutInfo());
      router.push("/orders");
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePaymentProofUpload = async (file: File | undefined) => {
    if (!file) return;

    try {
      setMenuError("");
      setPaymentProofError("");
      setIsUploadingPaymentProof(true);
      const proofUrl = await uploadPaymentProof(file);
      setCheckoutInfo((previous) => ({ ...previous, paymentProofUrl: proofUrl }));
    } catch (err) {
      setPaymentProofError(err instanceof Error ? err.message : "Unable to upload payment proof.");
    } finally {
      setIsUploadingPaymentProof(false);
    }
  };

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const subtotalPrice = cart.reduce((sum, c) => sum + c.finalPrice * c.quantity, 0);
  const deliveryFee = checkoutInfo.deliveryOption === "Pickup" ? 0 : Number(checkoutInfo.deliveryFee ?? 0);
  const totalPrice = subtotalPrice + deliveryFee;
  const checkoutMissingReason =
    !checkoutInfo.name ? "Your profile name is missing." :
    !checkoutInfo.phone ? "Please enter your phone number." :
    checkoutInfo.deliveryOption !== "Pickup" && !checkoutInfo.address ? "Please enter your delivery address." :
    checkoutInfo.payment === "GCash" && !checkoutInfo.paymentReference ? "Please enter your GCash reference number." :
    checkoutInfo.payment === "Card/Bank" && !checkoutInfo.selectedBank ? "Please select a bank." :
    checkoutInfo.payment === "Card/Bank" && !checkoutInfo.paymentReference ? "Please enter your bank transaction reference number." :
    ["GCash", "Card/Bank"].includes(checkoutInfo.payment) && !checkoutInfo.paymentProofUrl ? "Please upload your payment proof." :
    "";

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">

      <SiteHeader />

      {cartNotice && (
        <div className="fixed right-5 top-28 z-[180] rounded-xl border border-[#ffe082] bg-[#FFF6DE] px-5 py-3 text-sm font-bold text-[#1b5e20] shadow-lg">
          {cartNotice}
        </div>
      )}

      {/* HEADER */}
      <section className="bg-[#DDF8B1] pt-32 md:pt-40 pb-6 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1b5e20] mb-2">OUR MENU</h2>
          <p className="text-base text-[#2e7d32] max-w-2xl mx-auto">
          Our crowd favorites - fresh, delicious, and always satisfying!
          </p>
          <div className="mt-8 bg-[#FFF6DE] border border-[#ffe082] shadow-sm rounded-2xl p-4">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-xl transition-all duration-200 border ${
                    activeCategory === cat.label
                      ? "bg-[#DDF8B1] border-[#4caf50] text-[#1b5e20]"
                      : "bg-white border-transparent text-[#5d4037] hover:text-[#1b5e20] hover:border-[#4caf50]"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MENU LAYOUT */}
      <main className="max-w-7xl mx-auto px-6 py-10 md:py-14">
          <section className="min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#1b5e20]">{activeCategory}</h3>
              <p className="text-xs text-[#a1887f]">{filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} available</p>
            </div>
            {!isLoggedIn && (
              <p className="text-xs text-[#a1887f] hidden md:block">
                Log in: <Link href="/login" className="text-[#4caf50] font-semibold hover:underline">Log in</Link> to place an order
              </p>
            )}
          </div>
          {menuError && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{menuError}</p>
          )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
            <div
              key={item.id || index}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-shadow ${item.isAvailable ? "hover:shadow-xl cursor-pointer" : "opacity-60"}`}
              onClick={() => item.isAvailable && setSelectedItem(item)}
            >
              <div className="relative h-56 bg-[#f8fafc] overflow-hidden">
                <Image src={item.image} alt={item.name} fill className="object-contain p-4 hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-5 text-center">
                <h4 className="text-lg font-semibold text-[#5d4037] mb-1">{item.name}</h4>
                <p className="text-[#2e7d32] font-bold text-xl mb-3">{item.price}</p>
                {(item.addons ?? []).length > 0 && (
                  <p className="mb-3 text-[11px] font-semibold text-[#a1887f]">
                    Add-ons available
                  </p>
                )}
                {!item.isAvailable ? (
                  <button disabled className="w-full bg-gray-300 text-gray-600 font-semibold py-2 rounded-lg text-sm">
                    Unavailable
                  </button>
                ) : DRINK_CATEGORIES.includes(item.category) || hasSizes(item.category) || (item.addons ?? []).length > 0 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setModalQty(1); setModalAddonQuantities({}); setModalSize(getSizes(item.category)[0].label); }}
                    className="w-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-semibold py-2 rounded-lg transition shadow-sm text-sm"
                  >
                    {getTotalQtyByName(item.name) > 0 ? `In Cart (${getTotalQtyByName(item.name)}) - Add More` : "Add to Cart"}
                  </button>
                ) : getQty(item.name) === 0 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                    className="w-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-semibold py-2 rounded-lg transition shadow-sm text-sm"
                  >
                    Add to Cart
                  </button>
                ) : (
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-3">
                    <button onClick={() => handleDecrement(item.name)} className="w-8 h-8 rounded-full bg-[#f57c00] hover:bg-[#ef6c00] text-white font-bold text-lg flex items-center justify-center">-</button>
                    <span className="text-lg font-bold text-[#1b5e20] w-6 text-center">{getQty(item.name)}</span>
                    <button onClick={() => handleAddToCart(item)} className="w-8 h-8 rounded-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-bold text-lg flex items-center justify-center">+</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
          </section>
      </main>

      {/* FOOTER */}
      <SiteFooter />

      {/* PRODUCT DETAIL MODAL */}
      {selectedItem && (() => {
        const itemSizes = getSizes(selectedItem.category);
        const hasSize = hasSizes(selectedItem.category);
        const basePrice = parseFloat(selectedItem.price.replace("P", ""));
        const sizeExtra = hasSize ? (itemSizes.find((s) => s.label === modalSize)?.extra ?? 0) : 0;
        const selectedAddons = (selectedItem.addons ?? [])
          .map((addon) => ({ ...addon, quantity: modalAddonQuantities[addon.id] ?? 0 }))
          .filter((addon) => addon.quantity > 0);
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.priceDelta * Number(addon.quantity ?? 0), 0);
        const computedPrice = basePrice + sizeExtra + addonTotal;
        const getAddonMaxQty = (addon: MenuAddonOption) =>
          Math.max(0, Math.floor(Number(addon.stockQuantity ?? 0) / Math.max(1, Number(addon.quantityRequired || 1)) / Math.max(1, modalQty)));
        const selectedAddonStockError = selectedAddons.some((addon) => Number(addon.quantity ?? 0) > getAddonMaxQty(addon));
        return (
          <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center px-4" onClick={closeModal}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-64 bg-[#f8fafc]">
                <Image src={selectedItem.image} alt={selectedItem.name} fill className="object-contain p-6" />
                <button onClick={closeModal} className="absolute top-3 right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow text-[#5d4037] hover:bg-[#DDF8B1] text-lg font-bold">x</button>
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold text-[#4caf50] uppercase tracking-widest">{selectedItem.category}</span>
                <h3 className="text-xl font-bold text-[#1b5e20] mt-1 mb-1">{selectedItem.name}</h3>
                <p className="text-[#2e7d32] font-extrabold text-2xl mb-3">P{computedPrice.toFixed(2)}</p>
                <p className="text-sm text-[#a1887f] mb-4">Fresh and delicious {selectedItem.name} made with quality ingredients. Perfect for any craving!</p>

                {hasSize && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#5d4037] mb-2">Choose Size</p>
                    <div className="flex gap-2">
                      {itemSizes.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => setModalSize(s.label)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${
                            modalSize === s.label
                              ? "border-[#4caf50] bg-[#DDF8B1] text-[#1b5e20]"
                              : "border-[#e0e0e0] text-[#5d4037] hover:border-[#4caf50]"
                          }`}
                        >
                          {s.label}<br />
                          <span className="font-normal text-[10px]">{s.extra === 0 ? `P${basePrice}` : `+P${s.extra}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedItem.addons ?? []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#5d4037] mb-2">Add-ons</p>
                    <div className="space-y-2">
                      {selectedItem.addons?.map((addon) => {
                        const addonQty = modalAddonQuantities[addon.id] ?? 0;
                        const maxAddonQty = getAddonMaxQty(addon);
                        return (
                          <div key={addon.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e0e0e0] px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-[#5d4037]">{addon.name}</p>
                              <p className="text-[10px] text-[#2e7d32]">+P{addon.priceDelta.toFixed(2)} each</p>
                              <p className="text-[10px] text-[#a1887f]">Available: {maxAddonQty}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setModalAddonQuantities((previous) => ({ ...previous, [addon.id]: Math.max(0, addonQty - 1) }))}
                                className="w-7 h-7 rounded-full bg-[#f57c00] hover:bg-[#ef6c00] text-white font-bold text-sm flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-[#1b5e20]">{addonQty}</span>
                              <button
                                onClick={() => setModalAddonQuantities((previous) => ({ ...previous, [addon.id]: Math.min(maxAddonQty, addonQty + 1) }))}
                                disabled={addonQty >= maxAddonQty}
                                className="w-7 h-7 rounded-full bg-[#4caf50] hover:bg-[#388e3c] disabled:bg-gray-300 disabled:text-gray-600 text-white font-bold text-sm flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 mb-4">
                  <button onClick={() => setModalQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-full bg-[#f57c00] hover:bg-[#ef6c00] text-white font-bold text-xl flex items-center justify-center">-</button>
                  <span className="text-xl font-bold text-[#1b5e20] w-8 text-center">{modalQty}</span>
                  <button onClick={() => setModalQty((q) => q + 1)} className="w-9 h-9 rounded-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-bold text-xl flex items-center justify-center">+</button>
                </div>
                <button
                  onClick={() => { handleAddToCart(selectedItem, modalQty, hasSize ? modalSize : undefined, selectedAddons); closeModal(); }}
                  disabled={selectedAddonStockError}
                  className="w-full bg-[#4caf50] hover:bg-[#388e3c] disabled:bg-gray-300 disabled:text-gray-600 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  Add to Cart - P{(computedPrice * modalQty).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CART MODAL */}
      {showCart && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center px-4" onClick={() => setShowCart(false)}>
          <div className="bg-[#FFF6DE] border border-[#ffe082] rounded-2xl shadow-2xl w-full max-w-sm max-h-[88vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#1b5e20]">Your Cart</h3>
              <button onClick={() => setShowCart(false)} className="text-[#a1887f] hover:text-[#5d4037] text-lg font-bold">x</button>
            </div>
            {cart.length === 0 ? (
              <p className="text-xs text-[#a1887f] text-center py-6">Your cart is empty.</p>
            ) : (
              <>
                <ul className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {cart.map((c) => (
                    <li key={cartKey(c.name, c.size, c.addons)} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#ffe082]">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image src={c.image} alt={c.name} fill className="object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#5d4037]">{c.name}{c.size && <span className="ml-1 text-xs text-[#4caf50] font-bold">({c.size})</span>}</p>
                        {(c.addons ?? []).some((addon) => addon.saveAsOrderAddon !== false) && (
                          <p className="text-[11px] text-[#a1887f]">
                            {(c.addons ?? [])
                              .filter((addon) => addon.saveAsOrderAddon !== false)
                              .map((addon) => `+ ${addon.name} x${addon.quantity ?? 1}`)
                              .join(", ")}
                          </p>
                        )}
                        <p className="text-xs text-[#2e7d32] font-bold">P{(c.finalPrice * c.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDecrement(c.name, c.size, c.addons)} className="w-6 h-6 rounded-full bg-[#f57c00] hover:bg-[#ef6c00] text-white font-bold text-sm flex items-center justify-center">-</button>
                        <span className="text-sm font-bold text-[#1b5e20] w-5 text-center">{c.quantity}</span>
                        <button onClick={() => handleAddToCart(c, 1, c.size, c.addons ?? [])} className="w-6 h-6 rounded-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-bold text-sm flex items-center justify-center">+</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="text-xs text-[#a1887f]">Total ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                  <span className="text-sm font-bold text-[#1b5e20]">P{subtotalPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={openCheckout}
                  disabled={false}
                  className="w-full bg-[#4caf50] hover:bg-[#388e3c] disabled:bg-gray-300 disabled:text-gray-600 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  Proceed to Checkout
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-start justify-center overflow-y-auto px-4 py-5 md:py-8" onClick={() => setShowCheckout(false)}>
          <div className="bg-[#FFF6DE] border border-[#ffe082] rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2.5rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="sticky -top-5 md:-top-6 z-10 flex justify-between items-center mb-4 bg-[#FFF6DE] border-b border-[#ffe082] py-3">
              <h3 className="text-base font-bold text-[#1b5e20]">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="text-[#a1887f] hover:text-[#5d4037] text-lg font-bold">x</button>
            </div>
            {menuError && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{menuError}</p>
            )}

            <div className="space-y-4 mb-4">
              <div className="rounded-xl bg-white/70 border border-[#ffe082] p-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4caf50] mb-3">Saved Customer Info</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#5d4037] block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Juan Dela Cruz"
                      value={checkoutInfo.name}
                      readOnly
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5d4037] block mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="e.g. customer@email.com"
                      value={checkoutInfo.email}
                      readOnly
                      className="w-full px-3 py-2 bg-[#f8fafc] border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#5d4037] block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 09XXXXXXXXX"
                      value={checkoutInfo.phone}
                      onChange={(e) => setCheckoutInfo((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5d4037] block mb-1">Delivery Location</label>
                <textarea
                  placeholder="e.g. Blk 1 Lot 2, Street, Barangay, City"
                  value={checkoutInfo.address}
                  onChange={(e) => setCheckoutInfo((p) => ({ ...p, address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50] resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5d4037] block mb-2">Delivery Option</label>
                <div className="flex gap-2">
                  {["Delivery", "Pickup"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setCheckoutInfo((p) => ({
                        ...p,
                        deliveryOption: option,
                        deliveryFee: option === "Pickup" ? 0 : DEFAULT_DELIVERY_FEE,
                      }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${
                        checkoutInfo.deliveryOption === option
                          ? "border-[#4caf50] bg-[#DDF8B1] text-[#1b5e20]"
                          : "border-[#e0e0e0] text-[#5d4037] hover:border-[#4caf50]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              {checkoutInfo.deliveryOption !== "Pickup" && (
                <p className="text-[11px] text-[#a1887f]">Delivery fee: P{deliveryFee.toFixed(2)}</p>
              )}
              <div>
                <label className="text-xs font-semibold text-[#5d4037] block mb-2">Payment Method</label>
                <div className="flex gap-2">
                  {["Cash on Delivery", "GCash", "Card/Bank"].map((method) => (
                    <button
                      key={method}
                      onClick={() => setCheckoutInfo((p) => ({ ...p, payment: method, selectedBank: "", paymentReference: "", paymentProofUrl: "" }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${
                        checkoutInfo.payment === method
                          ? "border-[#4caf50] bg-[#DDF8B1] text-[#1b5e20]"
                          : "border-[#e0e0e0] text-[#5d4037] hover:border-[#4caf50]"
                      }`}
                    >
                      {method === "Cash on Delivery" ? "COD" : method}
                    </button>
                  ))}
                </div>
              </div>
              {checkoutInfo.payment === "GCash" && (
                <div className="rounded-xl bg-white/70 border border-[#ffe082] p-3">
                  <p className="text-xs font-semibold text-[#5d4037]">Send payment to J&apos;Bistro GCash</p>
                  <p className="mt-1 text-sm font-bold text-[#1b5e20]">{GCASH_NUMBER}</p>
                  <p className="text-xs font-semibold text-[#5d4037]">{GCASH_ACCOUNT_NAME}</p>
                  <input
                    type="text"
                    placeholder="GCash reference number"
                    value={checkoutInfo.paymentReference ?? ""}
                    onChange={(e) => setCheckoutInfo((p) => ({ ...p, paymentReference: e.target.value }))}
                    className="mt-2 w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                  />
                  <PaymentProofUpload proofUrl={checkoutInfo.paymentProofUrl ?? ""} error={paymentProofError} isUploading={isUploadingPaymentProof} onUpload={handlePaymentProofUpload} />
                </div>
              )}
              {checkoutInfo.payment === "Card/Bank" && (
                <div className="rounded-xl bg-white/70 border border-[#ffe082] p-3">
                  <p className="text-xs font-semibold text-[#5d4037] mb-2">Choose bank</p>
                  <div className="flex gap-2">
                    {Object.keys(BANK_ACCOUNTS).map((bank) => (
                      <button
                        key={bank}
                        onClick={() => setCheckoutInfo((p) => ({ ...p, selectedBank: bank }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${
                          checkoutInfo.selectedBank === bank
                            ? "border-[#4caf50] bg-[#DDF8B1] text-[#1b5e20]"
                            : "border-[#e0e0e0] text-[#5d4037] hover:border-[#4caf50]"
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                  {checkoutInfo.selectedBank && (
                    <p className="mt-2 text-xs text-[#5d4037]">
                      J&apos;Bistro {checkoutInfo.selectedBank}: <span className="font-bold text-[#1b5e20]">{BANK_ACCOUNTS[checkoutInfo.selectedBank]}</span>
                    </p>
                  )}
                  <input
                    type="text"
                    placeholder="Transaction reference number"
                    value={checkoutInfo.paymentReference ?? ""}
                    onChange={(e) => setCheckoutInfo((p) => ({ ...p, paymentReference: e.target.value }))}
                    className="mt-2 w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                  />
                  <PaymentProofUpload proofUrl={checkoutInfo.paymentProofUrl ?? ""} error={paymentProofError} isUploading={isUploadingPaymentProof} onUpload={handlePaymentProofUpload} />
                </div>
              )}
            </div>

            <div className="mb-4 bg-white rounded-xl px-4 py-3 border border-[#ffe082] space-y-1">
              {cart.some((item) => (item.addons ?? []).some((addon) => addon.saveAsOrderAddon !== false)) && (
                <div className="mb-2 space-y-1 border-b border-[#ffe082] pb-2">
                  {cart.flatMap((item) =>
                    (item.addons ?? []).filter((addon) => addon.saveAsOrderAddon !== false).map((addon) => (
                      <div key={`${cartKey(item.name, item.size, item.addons)}-${addon.id}`} className="flex justify-between gap-3">
                        <span className="text-[11px] text-[#a1887f]">
                          {item.name}: + {addon.name} x{addon.quantity ?? 1}
                        </span>
                        <span className="text-[11px] font-bold text-[#1b5e20]">
                          P{(addon.priceDelta * Number(addon.quantity ?? 1) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#a1887f]">Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                <span className="text-xs font-bold text-[#1b5e20]">P{subtotalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#a1887f]">Delivery fee</span>
                <span className="text-xs font-bold text-[#1b5e20]">P{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#ffe082] pt-2">
                <span className="text-xs font-bold text-[#5d4037]">Total</span>
                <span className="text-sm font-bold text-[#1b5e20]">P{totalPrice.toFixed(2)}</span>
              </div>
            </div>
              {isUploadingPaymentProof ? "Uploading proof..." : `Place Order Ã‚Â· P${totalPrice.toFixed(2)}`}
            <button
              disabled={
                Boolean(checkoutMissingReason) || isPlacingOrder || isUploadingPaymentProof
              }
              onClick={handlePlaceOrder}
              className="sticky bottom-0 w-full bg-[#4caf50] hover:bg-[#388e3c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition"
            >
              Place Order - P{totalPrice.toFixed(2)}
            </button>
            {checkoutMissingReason && (
              <p className="mt-2 text-center text-[11px] text-red-500">{checkoutMissingReason}</p>
            )}
          </div>
        </div>
      )}

      {/* LOGIN PROMPT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center px-4">
          <div className="bg-[#FFF6DE] border border-[#ffe082] rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
            <div className="text-4xl mb-3">Login</div>
            <h3 className="text-base font-bold text-[#1b5e20] mb-1">Login Required</h3>
            <p className="text-xs text-[#a1887f] mb-5">You need to log in or create an account to place an order.</p>
            <div className="flex gap-3">
              <button onClick={() => router.push("/login")} className="flex-1 bg-[#4caf50] hover:bg-[#388e3c] text-white font-semibold py-2 rounded-lg text-sm transition">Log In</button>
              <button onClick={() => router.push("/register")} className="flex-1 bg-[#f57c00] hover:bg-[#ef6c00] text-white font-semibold py-2 rounded-lg text-sm transition">Register</button>
            </div>
            <button onClick={() => setShowModal(false)} className="mt-3 text-xs text-[#a1887f] hover:text-[#5d4037] transition">Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
}

function PaymentProofUpload({
  proofUrl,
  error,
  isUploading,
  onUpload,
}: {
  proofUrl: string;
  error: string;
  isUploading: boolean;
  onUpload: (file: File | undefined) => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-[#c8e6c9] bg-white p-3">
      <label className="block text-xs font-semibold text-[#5d4037]">
        Payment Proof
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isUploading}
          onChange={(event) => {
            void onUpload(event.target.files?.[0]);
            event.target.value = "";
          }}
          className="mt-2 block w-full text-xs text-[#5d4037] file:mr-3 file:rounded-lg file:border-0 file:bg-[#4caf50] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-[#388e3c] disabled:opacity-60"
        />
      </label>
      <p className="mt-2 text-[11px] text-[#a1887f]">Upload JPG, PNG, or WebP under 3MB.</p>
      {error && <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-600">{error}</p>}
      {isUploading && <p className="mt-2 text-xs font-semibold text-[#1b5e20]">Uploading proof...</p>}
      {proofUrl && (
        <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-[#1b5e20] hover:underline">
          View uploaded proof
        </a>
      )}
    </div>
  );
}



