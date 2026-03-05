import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const menuItems = [
    { name: "Classic Burger", price: 99, category: "Burgers", description: "Beef patty, lettuce, tomato, onion" },
    { name: "Cheese Burger", price: 129, category: "Burgers", description: "With melted cheddar" },
    { name: "Green Refresher", price: 85, category: "Drinks", description: "Fresh green apple & mint" },
    { name: "Ube Shake", price: 95, category: "Drinks", description: "Creamy purple yam" },
    { name: "Classic Fries", price: 55, category: "Fries" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f1e3] font-sans"> {/* exact cream background */}
      {/* NAVIGATION - exact match */}
      <nav className="bg-[#f8f1e3] border-b border-[#d1c7b5] px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png"
            alt="INDABEST CRAVE CORNER" 
            width={100} 
            height={55} 
          />
          <div>
            <h1 className="text-[#5c4033] text-2xl font-bold tracking-wider">INDABEST CRAVE CORNER</h1>
          </div>
        </div>

        <ul className="flex gap-8 text-[#5c4033] text-sm font-medium">
          <li><Link href="/" className="hover:text-green-700">HOME</Link></li>
          <li><Link href="/menu" className="hover:text-green-700">MENU</Link></li>
          <li><Link href="/story" className="hover:text-green-700">OUR STORY</Link></li>
          <li><Link href="/contact" className="hover:text-green-700">CONTACT US</Link></li>
          <li><Link href="/login" className="font-semibold text-green-700 hover:text-green-800">LOGIN</Link></li>
        </ul>
      </nav>

      {/* HERO BANNER - exact colors & layout */}
      <section className="bg-[#d1fae5] py-20 px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-[#1f2937] leading-tight mb-6">
          Enjoy rich flavor<br />and freshness
        </h2>

        {/* Images - fries, burger, drinks */}
        <div className="flex flex-wrap justify-center items-end gap-8 max-w-5xl mx-auto my-10">
          <Image src="fries.jpg" alt="Fries" width={220} height={180} className="drop-shadow-lg" />
          <Image src="burger.jpg" alt="Burger" width={380} height={260} className="drop-shadow-2xl -mb-6" priority />
          <Image src="drinks.jpg" alt="Drinks" width={240} height={200} className="drop-shadow-lg" />
        </div>

        <div className="flex justify-center gap-6">
          <button className="bg-[#10b981] hover:bg-[#059669] text-white px-10 py-4 rounded-lg font-bold text-lg shadow-md">
            Discover the drinks
          </button>
          <button className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-10 py-4 rounded-lg font-bold text-lg shadow-md">
            Order Now
          </button>
        </div>
      </section>

      {/* Simple Menu Preview */}
      <section className="py-16 px-8 max-w-6xl mx-auto bg-white">
        <h3 className="text-3xl font-bold text-center mb-12 text-[#1f2937]">Our Menu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {menuItems.map((item, i) => (
            <div key={i} className="bg-white border border-[#e5d9c7] p-6 rounded-2xl shadow-sm hover:shadow-md transition">
              <h4 className="font-bold text-xl mb-2">{item.name}</h4>
              <p className="text-gray-600 mb-4 text-sm">{item.description}</p>
              <p className="text-[#10b981] font-bold">₱{item.price}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#f8f1e3] py-8 text-center text-[#8d6e63] text-sm border-t border-[#d1c7b5]">
        EST 2024 • INDABEST CRAVE CORNER
      </footer>
    </div>
  );
}