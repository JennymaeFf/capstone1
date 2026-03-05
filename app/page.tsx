import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e8f5e9] font-sans"> {/* light green background like your screenshot */}
      
      {/* NAVIGATION - exact colors, logo placement, text size */}
      <nav className="bg-[#fffde7] px-6 md:px-12 py-4 flex justify-between items-center border-b border-[#fff9c4]">
        <div className="flex items-center gap-4">
          <Image
            src="/logo-burger-drink.png"  // ← butang ang imong logo diri sa public/
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

        {/* Mobile menu button (optional, add hamburger if needed later) */}
        <button className="md:hidden text-[#4e342e] text-2xl">☰</button>
      </nav>

      {/* HERO SECTION - exact match sa imong screenshot */}
      <section className="bg-[#e8f5e9] py-16 md:py-24 px-6 md:px-12 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-[#1b5e20] leading-tight mb-8">
          Enjoy rich flavor<br className="hidden md:block" /> and freshness
        </h2>

        {/* Right-aligned images group */}
        <div className="relative max-w-6xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row justify-end items-end gap-6 md:gap-12">
            {/* Fries */}
            <Image
              src="/fries-basket.png"  // ← rename your image files accordingly
              alt="Fries"
              width={180}
              height={180}
              className="object-contain drop-shadow-xl"
            />

            {/* Burger */}
            <Image
              src="/burger-cheese.png"
              alt="Burger"
              width={340}
              height={240}
              className="object-contain drop-shadow-2xl -mb-8 md:-mb-12 z-10"
              priority
            />

            {/* Drinks */}
            <div className="relative">
              <Image
                src="/drinks-green-purple.png"
                alt="Drinks"
                width={260}
                height={280}
                className="object-contain drop-shadow-xl"
              />
              {/* Optional: add sauce/ketchup image if naa */}
              <Image
                src="/ketchup-small.png"
                alt="Ketchup"
                width={80}
                height={80}
                className="absolute -bottom-4 -right-6 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Buttons - exact position & style */}
        <div className="flex justify-center gap-6 mt-8">
          <button className="bg-[#4caf50] hover:bg-[#388e3c] text-white px-10 py-4 rounded-lg font-semibold text-lg shadow-md transition">
            Discover the drinks
          </button>
          <button className="bg-[#f57c00] hover:bg-[#ef6c00] text-white px-10 py-4 rounded-lg font-semibold text-lg shadow-md transition">
            Order Now
          </button>
        </div>
      </section>

      {/* Optional: Add footer or more sections if needed */}
      <footer className="bg-[#fffde7] py-6 text-center text-[#6d4c41] text-sm border-t border-[#fff9c4]">
        EST 2024 • INDABEST CRAVE CORNER
      </footer>
    </div>
  );
}