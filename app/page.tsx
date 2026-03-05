import Image from "next/image";

export default function Home() {
  const menuItems = [
    {
      name: "Classic Burger",
      price: 99,
      category: "Burgers",
      description: "Beef patty, lettuce, tomato, onion",
    },
    {
      name: "Cheese Burger",
      price: 129,
      category: "Burgers",
      description: "With melted cheddar cheese",
    },
    {
      name: "Green Refresher",
      price: 85,
      category: "Drinks",
      description: "Fresh green apple & mint flavor",
    },
    {
      name: "Ube Shake",
      price: 95,
      category: "Drinks",
      description: "Creamy purple yam goodness",
    },
    {
      name: "Classic Fries",
      price: 55,
      category: "Fries",
      description: "Crispy golden fries",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-black dark:to-zinc-900">
      {}
      <header className="bg-gradient-to-r from-green-400 to-lime-500 text-white">
        <nav className="flex justify-between items-center px-8 py-4">
          <div className="flex items-center">
            <Image src="/logo.png" alt="INDABEST CRAVE CORNER" width={50} height={50} /> {/* kung naa logo */}
            <h1 className="ml-4 text-2xl font-bold">INDABEST CRAVE CORNER</h1>
          </div>
          <ul className="flex space-x-6">
            <li><a href="#" className="hover:underline">HOME</a></li>
            <li><a href="#" className="hover:underline">MENU</a></li>
            <li><a href="#" className="hover:underline">OUR STORY</a></li>
            <li><a href="#" className="hover:underline">CONTACT US</a></li>
          </ul>
        </nav>
      </header>

      {}
      <section className="bg-green-200 py-20 text-center">
        <h2 className="text-5xl font-bold mb-4 text-green-800">
          Enjoy rich flavor and freshness
        </h2>
        <p className="text-xl mb-8">We got your cravings covered!</p>

        {}
        <div className="flex justify-center gap-8">
          <Image src="/fries.png" alt="Fries" width={200} height={200} className="rounded-lg" />
          <Image src="/burger.png" alt="Burger" width={300} height={200} className="rounded-lg" />
          <Image src="/drinks.png" alt="Drinks" width={200} height={200} className="rounded-lg" />
        </div>

        <div className="mt-8 space-x-4">
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            Discover the drinks
          </button>
          <button className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
            Order Now
          </button>
        </div>
      </section>

      {}
      <section className="py-16 px-8 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Best Seller</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {menuItems.map((item, index) => (
            <div key={index} className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-2">{item.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{item.description}</p>
              <p className="text-green-600 font-bold text-lg">₱{item.price.toFixed(2)}</p>
              <span className="text-sm text-gray-500">{item.category}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-green-800 text-white py-8 text-center">
        <p>EST 2024 • INDABEST CRAVE CORNER • We got your cravings covered!</p>
      </footer>
    </div>
  );
}