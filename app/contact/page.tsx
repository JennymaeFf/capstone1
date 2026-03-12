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

      <main className="pt-32 md:pt-40 pb-20 px-6 md:px-16 bg-[#DDF8B1]">
  <div className="max-w-7xl mx-auto">

    <h1 className="text-4xl md:text-6xl font-bold text-[#1b5e20] mb-12">
      Get In Touch
    </h1>

    <div className="flex flex-col md:flex-row items-start justify-between gap-10">

      {/* FORM */}
      <form className="space-y-8 md:w-1/2">

  <div className="flex flex-col">
    <label className="font-semibold mb-2 text-lg">Name:</label>
    <input
      type="text"
      className="w-96 h-11 border border-gray-400 bg-white px-4 rounded"
    />
  </div>

  <div className="flex flex-col">
    <label className="font-semibold mb-2 text-lg">Email:</label>
    <input
      type="email"
      className="w-96 h-11 border border-gray-400 bg-white px-4 rounded"
    />
  </div>

  <div className="flex flex-col">
    <label className="font-semibold mb-2 text-lg">Message:</label>
    <textarea
      className="w-96 h-32 border border-gray-400 bg-white px-4 py-2 rounded"
    ></textarea>
  </div>

  <button
  type="submit"
  className="bg-[#4caf50] hover:bg-[#388e3c] text-white px-8 py-3 rounded font-semibold mt-4"
>
  Send
</button>

</form>

      {/* FOOD IMAGES */}
      <div className="md:w-1/2 flex justify-end items-end gap-6">

        <Image
          src="/fries.png"
          alt="Fries"
          width={260}
          height={260}
          className="object-contain"
        />

        <Image
          src="/burger.png"
          alt="Burger"
          width={300}
          height={260}
          className="object-contain"
        />

      </div>

    </div>

  </div>
</main>

    </div>
  );
}