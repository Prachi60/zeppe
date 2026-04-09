import React from "react";
import { cn } from "@/lib/utils";

const ExperienceBannerCarousel = ({ section, items, fullWidth = false, slideGap = 0, edgeToEdge = false }) => {
  if (!items || !items.length) return null;

  const effectiveSlideGap = fullWidth ? 0 : slideGap;

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isResetting, setIsResetting] = React.useState(false);
  const loopedItems = items.length > 1 ? [...items, items[0]] : items;
  const stepPercent = 100 / loopedItems.length;

  React.useEffect(() => {
    if (items.length <= 1) return;

    const intervalId = setInterval(() => {
      setActiveIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [items.length]);

  React.useEffect(() => {
    if (items.length <= 1 || activeIndex !== items.length) return;

    const timeoutId = window.setTimeout(() => {
      setIsResetting(true);
      setActiveIndex(0);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, items.length]);

  React.useEffect(() => {
    if (!isResetting) return;

    const frameId = window.requestAnimationFrame(() => {
      setIsResetting(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isResetting]);

  return (
    <div className={cn("overflow-hidden", fullWidth && "w-full px-3 sm:px-4")}>
      <div
        className={cn("flex ease-out", isResetting ? "transition-none" : "transition-transform duration-500")}
        style={{
          width: `${loopedItems.length * 100}%`,
          gap: `${effectiveSlideGap}px`,
          transform: `translateX(-${activeIndex * stepPercent}%)`,
        }}
      >
        {loopedItems.map((banner, idx) => (
          <div
            key={idx}
            className={cn(
              "relative shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center box-border",
              fullWidth ? "h-auto px-0 py-0.5" : "h-[220px] px-4 md:px-8"
            )}
            style={{
              width: `${stepPercent}%`,
            }}
          >
            {fullWidth ? (
              <div className="mx-auto h-[184px] w-full max-w-[286px] overflow-hidden rounded-[18px] bg-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.12)] sm:h-[220px] sm:max-w-[520px] sm:rounded-[22px] md:h-[250px] md:max-w-none">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || section?.title || "Banner"}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ) : (
              <div className="h-full w-full max-w-[560px] -translate-x-2 md:-translate-x-4 overflow-hidden rounded-3xl bg-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || section?.title || "Banner"}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceBannerCarousel;
