"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
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

  const menuItems = [
    // Lemonade Series
    { name: "Blueberry Lemonade", price: "P39.00", image: "/blueberry.png", category: "Lemonade Series" },
    { name: "Green Apple Lemonade", price: "P39.00", image: "/greenapple.png", category: "Lemonade Series" },
    { name: "Yakult Lemonade", price: "P39.00", image: "/yakult.png", category: "Lemonade Series" },
    { name: "Strawberry Lemonade", price: "P39.00", image: "/strawberry.png", category: "Lemonade Series" },

    // Float Series
    { name: "Blueberry Float", price: "P49.00", image: "/blueberryfloat.png", category: "Float Series" },
    { name: "Strawberry Float", price: "P49.00", image: "/strawberryfloat.png", category: "Float Series" },
    { name: "Green Apple Float", price: "P49.00", image: "/greenapplefloat.png", category: "Float Series" },
    { name: "Coke Float", price: "P49.00", image: "/cokefloat.png", category: "Float Series" },
    { name: "Sprite Float", price: "P49.00", image: "/spritefloat.png", category: "Float Series" },

    // Macchiato
    { name: "Macchiato Caramel", price: "P39.00", image: "/macchiatocaramel.png", category: "Macchiato" },
    { name: "Macchiato Dark Chocolate", price: "P39.00", image: "/macchiatodarkchoco.png", category: "Macchiato" },
    { name: "Macchiato Strawberry", price: "P39.00", image: "/macchiatostrawberry.png", category: "Macchiato" },

    // Zagu Delight / Shakes
    { name: "Ube Zagu Shake", price: "P39.00", image: "/ubeshake.png", category: "Zagu Delight" },
    { name: "Mango Zagu Shake", price: "P39.00", image: "/mangoshake.png", category: "Zagu Delight" },

    // Pizza
    { name: "Hawaiian Pizza", price: "P120.00", image: "/hawaiianpizza.png", category: "Pizza" },
    { name: "Pepperoni Pizza", price: "P120.00", image: "/pepperoni.png", category: "Pizza" },

    // Bites Express / Extras
    { name: "Fish Ball", price: "P20.00", image: "/fishball.png", category: "Bites Express" },
    { name: "Tempura", price: "P20.00", image: "/tempura.png", category: "Bites Express" },
    { name: "Indabest Fries", price: "P30.00", image: "/frenchfries.png", category: "Bites Express" },
    { name: "Japanese Siomai", price: "P9.00", image: "/japanesesiomai.png", category: "Extras" },
    { name: "Ngohiong", price: "P15.00", image: "/ngohiong.png", category: "Extras" },
    { name: "Regular Siomai", price: "P15.00", image: "/regularsiomai.png", category: "Extras" },

    // Silog Combo Meals
    { name: "Corn Silog", price: "P49.00", image: "/cornsilog.png", category: "Silog Combo Meals" },
    { name: "Ham Silog", price: "P49.00", image: "/hamsilog.png", category: "Silog Combo Meals" },
    { name: "Hot Silog", price: "P49.00", image: "/hotsilog.png", category: "Silog Combo Meals" },
    { name: "Long Silog", price: "P49.00", image: "/longsilog.png", category: "Silog Combo Meals" },
    { name: "Lumpia Silog", price: "P49.00", image: "/lumpiasilog.png", category: "Silog Combo Meals" },
    { name: "Luncheon Silog", price: "P49.00", image: "/luncheonsilog.png", category: "Silog Combo Meals" },

    // Noodles / Extras
    { name: "Pancit Canton", price: "P25.00", image: "/pancitcanton.png", category: "Extras" },
    { name: "Noodles", price: "P35.00", image: "/noodles.png", category: "Extras" },
    { name: "Cup Noodles", price: "P45.00", image: "/cupnoodles.png", category: "Extras" },

    // Siopao
    { name: "Asado Siopao", price: "P45.00", image: "/asado.png", category: "Siopao" },
    { name: "Bola-Bola Siopao", price: "P45.00", image: "/bolabola.png", category: "Siopao" },

    // Beers
    { name: "Red Horse Beer", price: "P130.00", image: "/redhorse.png", category: "Beers" },
    { name: "Smirnoff", price: "P90.00", image: "/smirnoff.png", category: "Beers" },
    { name: "Tanduay Ice", price: "P70.00", image: "/tanduayice.png", category: "Beers" },
  ];

  const filteredItems =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-sm">
        <div className="flex items-center gap-5">
          <Image
            src="/logo.png"
            alt="INDABEST CRAVE CORNER Logo"
            width={150}
            height={150}
            className="object-contain"
          />
          <div>
            <h1 className="text-[#5d4037] text-2xl md:text-3xl font-bold tracking-wide">
              INDABEST CRAVE CORNER
            </h1>
            <p className="text-[#a1887f] text-sm -mt-1">
              We got your cravings covered!
            </p>
          </div>
        </div>

        <ul className="hidden md:flex gap-10 text-[#5d4037] text-base font-medium">
          <li><Link href="/" className="hover:text-[#4caf50]">HOME</Link></li>
          <li><Link href="/menu" className="hover:text-[#4caf50]">MENU</Link></li>
          <li><Link href="/story" className="hover:text-[#4caf50]">OUR STORY</Link></li>
          <li><Link href="/contact" className="hover:text-[#4caf50]">CONTACT US</Link></li>
          <li><Link href="/login" className="font-semibold text-[#4caf50] hover:text-[#388e3c]">LOGIN</Link></li>
        </ul>
      </nav>

      <section className="bg-[#DDF8B1] py-12 md:py-16 text-center pt-32 md:pt-40">
        <h2 className="text-4xl md:text-5xl font-bold text-[#1b5e20] mb-4">
          OUR MENU
        </h2>
        <p className="text-lg md:text-xl text-[#2e7d32] max-w-3xl mx-auto px-4">
          Our crowd favorites – fresh, delicious, and always satisfying!
        </p>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-16 flex flex-col md:flex-row gap-10">
        <aside className="w-full md:w-72 bg-white rounded-xl shadow-md p-6 border border-[#c8e6c9] md:sticky md:top-32 self-start">
          <h3 className="text-xl font-bold text-[#1b5e20] mb-5">Categories</h3>
          <ul className="space-y-2 text-base">
            {categories.map((cat) => (
              <li
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                  activeCategory === cat
                    ? "font-semibold bg-[#DDF8B1] text-[#1b5e20]"
                    : "hover:bg-[#e8f5e9] text-[#5d4037]"
                }`}
              >
                {cat}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1">
          {filteredItems.length === 0 ? (
            <p className="text-center text-gray-600 py-20 text-xl">
      
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-56 bg-[#f8fafc] flex items-center justify-center p-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="p-5 text-center">
                    <h4 className="text-lg font-semibold text-[#5d4037] mb-1">
                      {item.name}
                    </h4>
                    <p className="text-[#2e7d32] font-bold text-xl">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}