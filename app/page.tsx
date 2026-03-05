import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e8f5e9] font-sans">
 
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFF6DE] px-6 md:px-12 py-4 flex justify-between items-center border-b border-[#ffe082] shadow-sm">
        <div className="flex items-center gap-4">
          <Image
            src="logo.png"  
            alt="INDABEST CRAVE CORNER Logo"
            width={60}
            height={60}
            className="object-contain"
          />
          <div>
            <h1 className="text-[#4e342e] text-2xl md:text-3xl font-bold tracking-tight">
              INDABEST CRAVE CORNER
            </h1>
            <p className="text-[#8d6e63] text-sm -mt-1">
              We got your cravings covered!
            </p>
          </div>
        </div>

        <ul className="hidden md:flex gap-8 text-[#4e342e] text-base font-medium">
          <li><Link href="/" className="hover:text-[#388e3c]">HOME</Link></li>
          <li><Link href="/menu" className="hover:text-[#388e3c]">MENU</Link></li>
          <li><Link href="/story" className="hover:text-[#388e3c]">OUR STORY</Link></li>
          <li><Link href="/contact" className="hover:text-[#388e3c]">CONTACT US</Link></li>
          <li><Link href="/login" className="font-semibold text-[#388e3c] hover:text-[#2e7d32]">LOGIN</Link></li>
        </ul>


        <button className="md:hidden text-[#4e342e] text-2xl">☰</button>
      </nav>

      <section className="bg-[#DDF8B1] pt-28 md:pt-32 pb-16 md:pb-24 px-6 md:px-12 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-[#1b5e20] leading-tight mb-8 md:mb-12">
          Enjoy rich flavor<br className="hidden md:block" /> and freshness
        </h2>


        <div className="relative max-w-6xl mx-auto mb-10 md:mb-16">
          <div className="flex flex-col md:flex-row justify-end items-end gap-6 md:gap-12">

            <Image
              src="fries.jpg"
              alt="Fries"
              width={200}
              height={180}
              className="object-contain drop-shadow-xl"
            />

            <Image
              src="burger.jpg"
              alt="Burger"
              width={360}
              height={260}
              className="object-contain drop-shadow-2xl -mb-8 md:-mb-12 z-10"
              priority
            />

            <div className="relative">
              <Image
                src="drinks.jpg"
                alt="Drinks"
                width={260}
                height={280}
                className="object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-5 md:gap-8 mt-6 md:mt-10">
          <button className="bg-[#4caf50] hover:bg-[#388e3c] text-white px-10 py-4 rounded-lg font-semibold text-lg shadow-md transition">
            Discover the drinks
          </button>
          <button className="bg-[#f57c00] hover:bg-[#ef6c00] text-white px-10 py-4 rounded-lg font-semibold text-lg shadow-md transition">
            Order Now
          </button>
        </div>
      </section>

      <footer className="bg-[#FFF6DE] py-6 text-center text-[#6d4c41] text-sm border-t border-[#ffe082]">
        EST 2024 • INDABEST CRAVE CORNER
      </footer>
    </div>
  );
}