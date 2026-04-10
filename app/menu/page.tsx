"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type MenuItem = { name: string; price: string; image: string; category: string };
type CartItem = MenuItem & { quantity: number; size?: string; finalPrice: number };
type CheckoutInfo = { name: string; phone: string; address: string; payment: string };

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

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalQty, setModalQty] = useState(1);
  const [modalSize, setModalSize] = useState("Small");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo>({ name: "", phone: "", address: "", payment: "Cash on Delivery" });
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLLIElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    setUserName(localStorage.getItem("userName") || localStorage.getItem("userEmail") || "");
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    setShowProfile(false);
    router.push("/");
  };

  const categories = [
    { label: "All", icon: "🍽️" },
    { label: "Lemonade Series", icon: "🍋" },
    { label: "Float Series", icon: "🧋" },
    { label: "Macchiato", icon: "☕" },
    { label: "Zagu Delight", icon: "🥤" },
    { label: "Pizza", icon: "🍕" },
    { label: "Silog Combo Meals", icon: "🍳" },
    { label: "Bites Express", icon: "🍢" },
    { label: "Extras", icon: "🍜" },
    { label: "Siopao", icon: "🥟" },
    { label: "Beers", icon: "🍺" },
  ];

  const menuItems: MenuItem[] = [
    { name: "Blueberry Lemonade", price: "P39.00", image: "/blueberry.png", category: "Lemonade Series" },
    { name: "Green Apple Lemonade", price: "P39.00", image: "/greenapple.png", category: "Lemonade Series" },
    { name: "Yakult Lemonade", price: "P39.00", image: "/yakult.png", category: "Lemonade Series" },
    { name: "Strawberry Lemonade", price: "P39.00", image: "/strawberry.png", category: "Lemonade Series" },
    { name: "Blueberry Float", price: "P49.00", image: "/blueberryfloat.png", category: "Float Series" },
    { name: "Strawberry Float", price: "P49.00", image: "/strawberryfloat.png", category: "Float Series" },
    { name: "Green Apple Float", price: "P49.00", image: "/greenapplefloat.png", category: "Float Series" },
    { name: "Coke Float", price: "P49.00", image: "/cokefloat.png", category: "Float Series" },
    { name: "Sprite Float", price: "P49.00", image: "/spritefloat.png", category: "Float Series" },
    { name: "Macchiato Caramel", price: "P39.00", image: "/macchiatocaramel.png", category: "Macchiato" },
    { name: "Macchiato Dark Chocolate", price: "P39.00", image: "/macchiatodarkchoco.png", category: "Macchiato" },
    { name: "Macchiato Strawberry", price: "P39.00", image: "/macchiatostrawberry.png", category: "Macchiato" },
    { name: "Ube Zagu Shake", price: "P39.00", image: "/ubeshake.png", category: "Zagu Delight" },
    { name: "Mango Zagu Shake", price: "P39.00", image: "/mangoshake.png", category: "Zagu Delight" },
    { name: "Hawaiian Pizza", price: "P120.00", image: "/hawaiianpizza.png", category: "Pizza" },
    { name: "Pepperoni Pizza", price: "P120.00", image: "/pepperoni.png", category: "Pizza" },
    { name: "Fish Ball", price: "P20.00", image: "/fishball.png", category: "Bites Express" },
    { name: "Tempura", price: "P20.00", image: "/tempura.png", category: "Bites Express" },
    { name: "Indabest Fries", price: "P30.00", image: "/frenchfries.png", category: "Bites Express" },
    { name: "Japanese Siomai", price: "P9.00", image: "/japanesesiomai.png", category: "Extras" },
    { name: "Ngohiong", price: "P15.00", image: "/ngohiong.png", category: "Extras" },
    { name: "Regular Siomai", price: "P15.00", image: "/regularsiomai.png", category: "Extras" },
    { name: "Corn Silog", price: "P49.00", image: "/cornsilog.png", category: "Silog Combo Meals" },
    { name: "Ham Silog", price: "P49.00", image: "/hamsilog.png", category: "Silog Combo Meals" },
    { name: "Hot Silog", price: "P49.00", image: "/hotsilog.png", category: "Silog Combo Meals" },
    { name: "Long Silog", price: "P49.00", image: "/longsilog.png", category: "Silog Combo Meals" },
    { name: "Lumpia Silog", price: "P49.00", image: "/lumpiasilog.png", category: "Silog Combo Meals" },
    { name: "Luncheon Silog", price: "P49.00", image: "/luncheonsilog.png", category: "Silog Combo Meals" },
    { name: "Pancit Canton", price: "P25.00", image: "/pancitcanton.png", category: "Extras" },
    { name: "Noodles", price: "P35.00", image: "/noodles.png", category: "Extras" },
    { name: "Cup Noodles", price: "P45.00", image: "/cupnoodles.png", category: "Extras" },
    { name: "Asado Siopao", price: "P45.00", image: "/asado.png", category: "Siopao" },
    { name: "Bola-Bola Siopao", price: "P45.00", image: "/bolabola.png", category: "Siopao" },
    { name: "Red Horse Beer", price: "P130.00", image: "/redhorse.png", category: "Beers" },
    { name: "Smirnoff", price: "P90.00", image: "/smirnoff.png", category: "Beers" },
    { name: "Tanduay Ice", price: "P70.00", image: "/tanduayice.png", category: "Beers" },
  ];

  const filteredItems = activeCategory === "All"
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

  const hasSizes = (category: string) => category in SIZE_OPTIONS;
  const getSizes = (category: string) => SIZE_OPTIONS[category] ?? SIZES;

  const cartKey = (name: string, size?: string) => size ? `${name}__${size}` : name;
  const getQty = (name: string, size?: string) => cart.find((c) => cartKey(c.name, c.size) === cartKey(name, size))?.quantity ?? 0;
  const getTotalQtyByName = (name: string) => cart.filter((c) => c.name === name).reduce((s, c) => s + c.quantity, 0);

  const handleAddToCart = (item: MenuItem, qty = 1, size?: string) => {
    if (!isLoggedIn) { setShowModal(true); return; }
    const basePrice = parseFloat(item.price.replace("P", ""));
    const sizes = getSizes(item.category);
    const sizeExtra = size ? (sizes.find((s) => s.label === size)?.extra ?? 0) : 0;
    const finalPrice = basePrice + sizeExtra;
    const key = cartKey(item.name, size);
    setCart((prev) => {
      const existing = prev.find((c) => cartKey(c.name, c.size) === key);
      if (existing) return prev.map((c) => cartKey(c.name, c.size) === key ? { ...c, quantity: c.quantity + qty } : c);
      return [...prev, { ...item, quantity: qty, size, finalPrice }];
    });
  };

  const handleDecrement = (name: string, size?: string) => {
    const key = cartKey(name, size);
    setCart((prev) => {
      const existing = prev.find((c) => cartKey(c.name, c.size) === key);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => cartKey(c.name, c.size) !== key);
      return prev.map((c) => cartKey(c.name, c.size) === key ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const closeModal = () => { setSelectedItem(null); setModalQty(1); setModalSize(getSizes(selectedItem?.category ?? "")[0]?.label ?? "Small"); };

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = cart.reduce((sum, c) => sum + c.finalPrice * c.quantity, 0);

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-sm" style={{backdropFilter: 'none'}}>
        <div className="flex items-center gap-5">
          <Image src="/logo.png" alt="Logo" width={150} height={150} className="object-contain" />
          <div>
            <h1 className="text-[#5d4037] text-lg md:text-xl font-bold tracking-wide">INDABEST CRAVE CORNER</h1>
            <p className="text-[#a1887f] text-xs -mt-1">We got your cravings covered!</p>
          </div>
        </div>
        <ul className="hidden md:flex gap-6 text-[#5d4037] text-xs font-medium items-center">
          <li><Link href="/" className="hover:text-[#4caf50]">HOME</Link></li>
          <li><Link href="/menu" className="hover:text-[#4caf50]">MENU</Link></li>
          <li><Link href="/story" className="hover:text-[#4caf50]">OUR STORY</Link></li>
          <li><Link href="/contact" className="hover:text-[#4caf50]">CONTACT US</Link></li>
          {isLoggedIn && <li><Link href="/orders" className="hover:text-[#4caf50]">MY ORDERS</Link></li>}

          {/* CART */}
          <li>
            <button onClick={() => setShowCart(true)} className="relative">
              <span className="text-2xl">🛒</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#f57c00] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </li>

          {/* LOGIN or PROFILE */}
          {!isLoggedIn ? (
            <li>
              <Link href="/login" className="font-semibold text-[#4caf50] hover:text-[#388e3c]">LOGIN</Link>
            </li>
          ) : (
            <li className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 bg-[#DDF8B1] hover:bg-[#c5e8a0] px-4 py-2 rounded-full transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#1b5e20] flex items-center justify-center text-white text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-[#1b5e20]">{userName}</span>
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#ffe082] rounded-xl shadow-lg py-2 z-[200]">
                  <p className="px-4 py-2 text-xs text-[#a1887f] border-b border-[#ffe082]">{userName}</p>
                  <Link href="/orders" className="block px-4 py-2 text-sm text-[#5d4037] hover:bg-[#DDF8B1] transition">My Orders</Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </li>
          )}
        </ul>
      </nav>

      {/* HEADER */}
      <section className="bg-[#DDF8B1] pt-32 md:pt-40 pb-6 text-center px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-[#1b5e20] mb-2">OUR MENU</h2>
        <p className="text-base text-[#2e7d32] max-w-2xl mx-auto">
          Our crowd favorites – fresh, delicious, and always satisfying!
        </p>
      </section>

      {/* CATEGORIES */}
      <div className="bg-[#FFF6DE] border-y border-[#ffe082] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex justify-center gap-1">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeCategory === cat.label
                    ? "border-[#1b5e20] text-[#1b5e20]"
                    : "border-transparent text-[#5d4037] hover:text-[#1b5e20] hover:border-[#4caf50]"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MENU GRID */}
      <main className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-[#1b5e20]">{activeCategory}</h3>
            <p className="text-xs text-[#a1887f]">{filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} available</p>
          </div>
          {!isLoggedIn && (
            <p className="text-xs text-[#a1887f] hidden md:block">
              🔒 <Link href="/login" className="text-[#4caf50] font-semibold hover:underline">Log in</Link> to place an order
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative h-56 bg-[#f8fafc] overflow-hidden">
                <Image src={item.image} alt={item.name} fill className="object-contain p-4 hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-5 text-center">
                <h4 className="text-lg font-semibold text-[#5d4037] mb-1">{item.name}</h4>
                <p className="text-[#2e7d32] font-bold text-xl mb-3">{item.price}</p>
                {DRINK_CATEGORIES.includes(item.category) || hasSizes(item.category) ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setModalQty(1); setModalSize(getSizes(item.category)[0].label); }}
                    className="w-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-semibold py-2 rounded-lg transition shadow-sm text-sm"
                  >
                    {getTotalQtyByName(item.name) > 0 ? `In Cart (${getTotalQtyByName(item.name)}) · Add More` : "Add to Cart"}
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
                    <button onClick={() => handleDecrement(item.name)} className="w-8 h-8 rounded-full bg-[#f57c00] hover:bg-[#ef6c00] text-white font-bold text-lg flex items-center justify-center">−</button>
                    <span className="text-lg font-bold text-[#1b5e20] w-6 text-center">{getQty(item.name)}</span>
                    <button onClick={() => handleAddToCart(item)} className="w-8 h-8 rounded-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-bold text-lg flex items-center justify-center">+</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#FFF6DE] border-t border-[#ffe082] py-6 text-center text-[#a1887f] text-xs">
        EST 2024 • INDABEST CRAVE CORNER
      </footer>

      {/* PRODUCT DETAIL MODAL */}
      {selectedItem && (() => {
        const itemSizes = getSizes(selectedItem.category);
        const hasSize = hasSizes(selectedItem.category);
        const basePrice = parseFloat(selectedItem.price.replace("P", ""));
        const sizeExtra = hasSize ? (itemSizes.find((s) => s.label === modalSize)?.extra ?? 0) : 0;
        const computedPrice = basePrice + sizeExtra;
        return (
          <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center px-4" onClick={closeModal}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-64 bg-[#f8fafc]">
                <Image src={selectedItem.image} alt={selectedItem.name} fill className="object-contain p-6" />
                <button onClick={closeModal} className="absolute top-3 right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow text-[#5d4037] hover:bg-[#DDF8B1] text-lg font-bold">✕</button>
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

                <div className="flex items-center justify-center gap-4 mb-4">
                  <button onClick={() => setModalQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-full bg-[#f57c00] hover:bg-[#ef6c00] text-white font-bold text-xl flex items-center justify-center">−</button>
                  <span className="text-xl font-bold text-[#1b5e20] w-8 text-center">{modalQty}</span>
                  <button onClick={() => setModalQty((q) => q + 1)} className="w-9 h-9 rounded-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-bold text-xl flex items-center justify-center">+</button>
                </div>
                <button
                  onClick={() => { handleAddToCart(selectedItem, modalQty, hasSize ? modalSize : undefined); closeModal(); }}
                  className="w-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  Add to Cart · P{(computedPrice * modalQty).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CART MODAL */}
      {showCart && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center px-4" onClick={() => setShowCart(false)}>
          <div className="bg-[#FFF6DE] border border-[#ffe082] rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#1b5e20]">🛒 Your Cart</h3>
              <button onClick={() => setShowCart(false)} className="text-[#a1887f] hover:text-[#5d4037] text-lg font-bold">✕</button>
            </div>
            {cart.length === 0 ? (
              <p className="text-xs text-[#a1887f] text-center py-6">Your cart is empty.</p>
            ) : (
              <>
                <ul className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {cart.map((c) => (
                    <li key={cartKey(c.name, c.size)} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#ffe082]">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image src={c.image} alt={c.name} fill className="object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#5d4037]">{c.name}{c.size && <span className="ml-1 text-xs text-[#4caf50] font-bold">({c.size})</span>}</p>
                        <p className="text-xs text-[#2e7d32] font-bold">P{(c.finalPrice * c.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDecrement(c.name, c.size)} className="w-6 h-6 rounded-full bg-[#f57c00] hover:bg-[#ef6c00] text-white font-bold text-sm flex items-center justify-center">−</button>
                        <span className="text-sm font-bold text-[#1b5e20] w-5 text-center">{c.quantity}</span>
                        <button onClick={() => handleAddToCart(c, 1, c.size)} className="w-6 h-6 rounded-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-bold text-sm flex items-center justify-center">+</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="text-xs text-[#a1887f]">Total ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                  <span className="text-sm font-bold text-[#1b5e20]">P{totalPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  className="w-full bg-[#4caf50] hover:bg-[#388e3c] text-white font-semibold py-2.5 rounded-xl text-sm transition"
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
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center px-4" onClick={() => setShowCheckout(false)}>
          <div className="bg-[#FFF6DE] border border-[#ffe082] rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#1b5e20]">📋 Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="text-[#a1887f] hover:text-[#5d4037] text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-[#5d4037] block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={checkoutInfo.name}
                  onChange={(e) => setCheckoutInfo((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
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
              <div>
                <label className="text-xs font-semibold text-[#5d4037] block mb-1">Delivery Address</label>
                <textarea
                  placeholder="e.g. Blk 1 Lot 2, Street, Barangay, City"
                  value={checkoutInfo.address}
                  onChange={(e) => setCheckoutInfo((p) => ({ ...p, address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50] resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5d4037] block mb-2">Payment Method</label>
                <div className="flex gap-2">
                  {["Cash on Delivery", "GCash", "Maya"].map((method) => (
                    <button
                      key={method}
                      onClick={() => setCheckoutInfo((p) => ({ ...p, payment: method }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${
                        checkoutInfo.payment === method
                          ? "border-[#4caf50] bg-[#DDF8B1] text-[#1b5e20]"
                          : "border-[#e0e0e0] text-[#5d4037] hover:border-[#4caf50]"
                      }`}
                    >
                      {method === "Cash on Delivery" ? "💵 COD" : method === "GCash" ? "📱 GCash" : "💳 Maya"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4 bg-white rounded-xl px-4 py-3 border border-[#ffe082]">
              <span className="text-xs text-[#a1887f]">Total ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
              <span className="text-sm font-bold text-[#1b5e20]">P{totalPrice.toFixed(2)}</span>
            </div>

            <button
              disabled={!checkoutInfo.name || !checkoutInfo.phone || !checkoutInfo.address}
              onClick={() => {
                const existing = JSON.parse(localStorage.getItem("orders") || "[]");
                const newOrder = {
                  id: Date.now().toString().slice(-6),
                  date: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
                  items: cart.map((c) => ({ name: c.name, image: c.image, quantity: c.quantity, size: c.size, finalPrice: c.finalPrice })),
                  total: totalPrice,
                  status: "Preparing",
                  customer: checkoutInfo,
                };
                localStorage.setItem("orders", JSON.stringify([...existing, newOrder]));
                setCart([]);
                setShowCheckout(false);
                setCheckoutInfo({ name: "", phone: "", address: "", payment: "Cash on Delivery" });
                router.push("/orders");
              }}
              className="w-full bg-[#4caf50] hover:bg-[#388e3c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition"
            >
              Place Order · P{totalPrice.toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* LOGIN PROMPT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center px-4">
          <div className="bg-[#FFF6DE] border border-[#ffe082] rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
            <div className="text-4xl mb-3">🔒</div>
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
