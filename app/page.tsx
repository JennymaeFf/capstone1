"use client";

import Image from "next/image";
import Link from "next/link";
import FoodImageCarousel from "@/components/food-image-carousel";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

const bestSellers = [
  { name: "Indabest Burger", price: "P89.00", image: "/burgers.png" },
  { name: "Indabest Fries", price: "P30.00", image: "/frenchfries.png" },
  { name: "Blueberry Lemonade", price: "P39.00", image: "/blueberry.png" },
  { name: "Hawaiian Pizza", price: "P120.00", image: "/hawaiianpizza.png" },
  { name: "Coke Float", price: "P49.00", image: "/cokefloat.png" },
  { name: "Asado Siopao", price: "P45.00", image: "/asado.png" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">
      <SiteHeader />

      <section className="bg-[#DDF8B1] px-6 pb-20 pt-32 md:px-16 md:pb-28 md:pt-40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 md:flex-row">
          <div className="flex flex-col items-center text-center md:w-1/2 md:pt-8 lg:pt-12">
            <h2 className="mb-8 text-4xl font-bold leading-tight text-[#1b5e20] md:text-6xl">
              Enjoy rich flavor<br className="hidden md:block" /> and freshness
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/menu">
                <button className="rounded-xl bg-[#4caf50] px-10 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-[#388e3c]">
                  Discover the Drinks
                </button>
              </Link>
              <Link href="/menu">
                <button className="rounded-xl bg-[#f57c00] px-10 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-[#ef6c00]">
                  Order Now
                </button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:w-1/2 md:justify-end">
            <FoodImageCarousel />
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 md:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h3 className="mb-3 text-4xl font-bold text-[#1b5e20]">Best Sellers</h3>
            <p className="text-lg text-[#5d4037]">Our most loved and frequently ordered items</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {bestSellers.map((item, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg transition-shadow hover:shadow-xl">
                <div className="relative flex h-56 items-center justify-center bg-[#f8fafc] p-4">
                  <Image src={item.image} alt={item.name} fill className="object-contain" />
                </div>
                <div className="p-5 text-center">
                  <h4 className="mb-1 text-lg font-semibold text-[#5d4037]">{item.name}</h4>
                  <p className="mb-5 text-xl font-bold text-[#2e7d32]">{item.price}</p>
                  <Link href="/menu">
                    <button className="w-full rounded-xl bg-[#DDF8B1] py-3 font-semibold text-[#1b5e20] transition hover:bg-[#c2e8a3]">
                      Order Now
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
