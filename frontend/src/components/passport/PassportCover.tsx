import { Plane } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { PassportMode } from "@/app/page";

type PassportCoverProps = {
  onSelect: (mode: PassportMode) => void;
  isTransitioning?: boolean;
};

export function PassportCover({ onSelect, isTransitioning = false }: PassportCoverProps) {
  function openPassport() {
    if (!isTransitioning) onSelect("login");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPassport();
    }
  }

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={openPassport}
      onKeyDown={handleKeyDown}
      className={`passport-cover-closed cursor-pointer outline-none transition focus-visible:ring-4 focus-visible:ring-passport-gold/45 ${isTransitioning ? "is-soft-transitioning" : ""}`}
      aria-label="닫힌 배움여권 열기"
    >
      <div className="passport-cover-border" />
      <div className="passport-cover-shine" />

      <div className="relative z-10 flex h-full flex-col items-center justify-between p-8 text-center sm:p-10">
        <div className="w-full text-right text-xs font-bold uppercase tracking-[0.22em] text-passport-gold/80">
          Republic of Learning
        </div>

        <div className="flex flex-col items-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border-4 border-double border-passport-gold text-passport-gold shadow-inner">
            <Plane size={42} />
          </div>
          <h1 className="mt-3 text-4xl font-black text-passport-gold sm:text-5xl">배움여권</h1>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.28em] text-passport-gold/85">
            Learning Passport
          </p>
          <div className="mt-8 h-px w-44 bg-passport-gold/55" />
        </div>

        <p className="mb-8 text-sm font-black uppercase tracking-[0.24em] text-passport-gold/75">
          World Explorer
        </p>
      </div>
    </section>
  );
}
