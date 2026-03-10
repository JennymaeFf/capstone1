import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="bg.jpg"  
          alt="Cozy J'Bistro restaurant interior background"
          fill
          className="object-cover brightness-[0.6] contrast-[1.1]"  
          priority
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="text-center mb-10">
          <Image
            src="plogo.png"  
            alt="J'Bistro Restaurant Logo"
            width={180}
            height={180}
            className="mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide drop-shadow-md">
            Welcome to
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-amber-300 mt-1 drop-shadow-md">
            J'Bistro
          </h2>
        </div>

        <div className="bg-[#F5F0E9]/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-amber-200/50">
          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/80"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/80"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition duration-300 shadow-md"
            >
              Login
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-amber-600 hover:underline font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}