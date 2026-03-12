import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">
      {/* FIXED HEADER */}
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
              We got your cravinags covered!
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

      {/* HERO / OUR STORY SECTION */}
<section className="pt-32 md:pt-40 pb-16 md:pb-24 px-6 md:px-16 bg-[#DDF8B1]">
  <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-20">
    {/* Left: Text */}
    <div className="lg:w-1/2 text-center lg:text-left">
      <h2 className="text-4xl md:text-5xl font-bold text-[#1b5e20] mb-6 leading-tight">
        INDABEST CRAVE CORNER
      </h2>
      <p className="text-lg md:text-xl leading-relaxed mb-6">
        was born from a love for satisfying cravings. We serve creamy milk tea, juicy burgers,
        and crispy fries, made fresh and full of flavor. Our goal is simple: to give you
        delicious comfort food that’s always worth it.
      </p>
      <p className="text-lg md:text-xl leading-relaxed">
        One stop, all cravings—only the indabest.
      </p>
    </div>

          {/* Right: Images */}
          <div className="md:w-1/2 flex justify-end items-end relative overflow-hidden">
            <div className="flex items-end gap-4 md:gap-6">
              <div className="relative">
                <Image
                  src="/fries.png"
                  alt="Fries"
                  width={300}
                  height={300}
                  className="object-contain drop-shadow-lg z-20"
                />
              </div>

              <Image
                src="/burger.png"
                alt="Burger"
                width={340}
                height={240}
                className="object-contain drop-shadow-2xl z-30 -mb-4"
                priority
              />
            </div>
          </div>
        </div>

        
      </section>

      {/* Footer */}
      <footer className="bg-[#FFF6DE] py-6 text-center text-[#6d4c41] text-sm border-t border-[#ffe082]">
        EST 2024 • INDABEST CRAVE CORNER
      </footer>
    </div>
  );
}