"use client";

import Image from "next/image";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export default function StoryPage() {
  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">

      <SiteHeader />

      {/* OUR STORY SECTION */}
      <section className="bg-[#DDF8B1] px-6 pb-16 pt-32 md:px-16 md:pb-24 md:pt-40">
        <div className="mx-auto grid max-w-7xl items-center gap-10 rounded-3xl border border-[#cdeba2] bg-[#FFF6DE]/80 p-6 shadow-lg md:p-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[#4caf50]">Our Story</p>
            <h2 className="mb-5 text-4xl font-bold leading-tight text-[#1b5e20] md:text-5xl">
              A family working together, one craving at a time.
            </h2>
            <p className="mb-5 text-base leading-relaxed text-[#5d4037] md:text-lg">
              IndaBest Crave Corner is a family-owned business built with love, teamwork, and a shared dream.
              Every day, the family works together to prepare good food, welcome customers, and keep improving
              the small business they are proud to call their own.
            </p>
            <p className="text-base leading-relaxed text-[#6d4c41] md:text-lg">
              From serving refreshing drinks to favorite comfort foods, their goal is simple: to make every
              customer feel at home and satisfied. For this family, IndaBest is more than a store. It is a
              place where hard work, care, and community come together.
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border-8 border-white bg-[#DDF8B1] shadow-2xl">
              <Image
                src="/indab.png"
                alt="Owner of IndaBest Crave Corner"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <SiteFooter />
    </div>
  );
}


