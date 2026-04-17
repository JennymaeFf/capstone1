"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const carouselImages = [
  { src: "/fries.png", alt: "Indabest Fries" },
  { src: "/burger.png", alt: "Indabest Burger" },
  { src: "/greenapple.png", alt: "Green Apple Lemonade" },
];

export default function FoodImageCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const showPrevious = () => {
    setActiveIndex((current) => (current === 0 ? carouselImages.length - 1 : current - 1));
  };

  const showNext = () => {
    setActiveIndex((current) => (current === carouselImages.length - 1 ? 0 : current + 1));
  };

  useEffect(() => {
    const slideTimer = window.setInterval(showNext, 3000);
    return () => window.clearInterval(slideTimer);
  }, []);

  const handleTouchEnd = (x: number) => {
    if (touchStart === null) return;
    const distance = touchStart - x;
    if (distance > 40) showNext();
    if (distance < -40) showPrevious();
    setTouchStart(null);
  };

  return (
    <div className="w-full max-w-md">
      <div
        className="relative h-80 overflow-hidden md:h-96"
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientX)}
      >
        {carouselImages.map((item, index) => (
          <div
            key={item.src}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
              index === activeIndex ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            }`}
          >
            <Image src={item.src} alt={item.alt} fill className="object-contain p-2 drop-shadow-2xl" priority={index === 0} />
          </div>
        ))}

        <button
          type="button"
          onClick={showPrevious}
          aria-label="Show previous image"
          className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-[#1b5e20] shadow-sm transition hover:bg-white"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={showNext}
          aria-label="Show next image"
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-[#1b5e20] shadow-sm transition hover:bg-white"
        >
          ›
        </button>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {carouselImages.map((item, index) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${item.alt}`}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex ? "w-8 bg-[#4caf50]" : "w-2.5 bg-[#a5d6a7]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
