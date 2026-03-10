import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">

      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-sm">
        <div className="flex items-center gap-5">
          <Image
            src="logo.png"
            alt="INDABEST CRAVE CORNER Logo"
            width={300}    
            height={300}  
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

        <button className="md:hidden text-[#5d4037] text-3xl">☰</button>
      </nav>

<section className="pt-32 md:pt-40 pb-16 md:pb-24 px-6 md:px-16 bg-[#DDF8B1]">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8 md:gap-12">

    <div className="md:w-1/2 text-left mt-8 md:mt-0">
      <h2 className="text-4xl md:text-6xl font-bold text-[#1b5e20] leading-tight">
        Enjoy rich flavor<br className="hidden md:block" /> and freshness
      </h2>
    </div>

    <div className="md:w-1/2 flex justify-end items-end relative">
      <div className="flex items-end gap-3 md:gap-4"> 

        <Image
          src="fries.png"
          alt="Fries"
          width={400}   
          height={400}
          className="object-contain drop-shadow-lg -mb-6"
        />

        <Image
          src="burger.png"
          alt="Burger"
          width={340}  
          height={240}
          className="object-contain drop-shadow-2xl z-10 -mb-10 md:-mb-12"
          priority
        />
      </div>
    </div>
  </div>

  <div className="flex justify-center gap-6 mt-10 md:mt-14">
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