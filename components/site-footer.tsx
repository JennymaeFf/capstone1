export default function SiteFooter() {
  return (
    <footer className="border-t border-[#ffe082] bg-[#FFF6DE] px-6 py-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-[#ffe082] bg-gradient-to-r from-[#fff8e6] via-[#f5ffd8] to-[#fff1d6] shadow-sm">
        <div className="flex flex-col gap-8 px-6 py-8 md:px-10">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#4caf50]">
              Indabest Crave Corner
            </p>
            <h3 className="mt-2 text-2xl font-bold text-[#1b5e20]">
              Visit us, call us, and stay updated.
            </h3>
            <p className="mt-2 text-sm text-[#6d4c41]">
              We are always ready to serve your cravings every day.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/80 px-5 py-4 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4caf50]">Location</p>
              <p className="mt-2 text-sm font-semibold text-[#5d4037]">
                Purok 5, Brgy. Doldol, Dumanjug, Cebu
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 px-5 py-4 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4caf50]">Phone Number</p>
              <a
                href="tel:+639501220426"
                className="mt-2 inline-block text-sm font-semibold text-[#5d4037] transition hover:text-[#1b5e20]"
              >
                +63 950 122 0426
              </a>
            </div>
            <div className="rounded-2xl bg-white/80 px-5 py-4 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4caf50]">Business Hours</p>
              <p className="mt-2 text-sm font-semibold text-[#5d4037]">Open Daily from 9 AM to 9 PM</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <a
              href="https://www.facebook.com/share/185PrtvuEE/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#1877F2] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1664cc]"
            >
              Visit Our Facebook
            </a>
            <p className="text-xs text-[#8d6e63]">EST 2024 • INDABEST CRAVE CORNER</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
