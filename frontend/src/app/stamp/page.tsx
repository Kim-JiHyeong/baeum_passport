"use client";

import { ArrowLeft, ArrowRight, BookOpen, Globe2, MapPinned, Stamp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogoutBookmark } from "@/components/passport/LogoutBookmark";
import { findCountry, isWorkbookEligibleCountry, type RepresentativeCountry } from "@/lib/countries";
import { getStamps } from "@/lib/api/stamp";

type StampAsset = {
  src: string;
  alt: string;
};

type StampPosition = {
  left: string;
  top: string;
  width: string;
  rotate: number;
};

const STAMPS_PER_PAGE = 4;
const PAGES_PER_SPREAD = 2;
const STAMPS_PER_SPREAD = STAMPS_PER_PAGE * PAGES_PER_SPREAD;

const stampAssets: Record<string, StampAsset> = {
  일본: { src: "/images/stamp/jap_stamp.png", alt: "일본 여행 스탬프" },
  중국: { src: "/images/stamp/chn_stamp.png", alt: "중국 여행 스탬프" },
  영국: { src: "/images/stamp/uk_stamp.png", alt: "영국 여행 스탬프" },
  프랑스: { src: "/images/stamp/fra_stamp.png", alt: "프랑스 여행 스탬프" },
  독일: { src: "/images/stamp/ger_stamp.png", alt: "독일 여행 스탬프" },
  이집트: { src: "/images/stamp/egy_stamp.png", alt: "이집트 여행 스탬프" },
  미국: { src: "/images/stamp/usa_stamp.png", alt: "미국 여행 스탬프" },
  멕시코: { src: "/images/stamp/mex_stamp.png", alt: "멕시코 여행 스탬프" },
  브라질: { src: "/images/stamp/bra_stamp.png", alt: "브라질 여행 스탬프" },
  호주: { src: "/images/stamp/oz_stamp.png", alt: "호주 여행 스탬프" },
};

const stampPositions: StampPosition[] = [
  { left: "7%", top: "8%", width: "185px", rotate: -7 },
  { left: "53%", top: "14%", width: "172px", rotate: 5 },
  { left: "12%", top: "54%", width: "176px", rotate: 4 },
  { left: "55%", top: "59%", width: "184px", rotate: -5 },
];

export default function StampPage() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [currentSpread, setCurrentSpread] = useState(0);

  useEffect(() => {
    getStamps()
      .then((stamps) => setCompleted(stamps.map((stamp) => stamp.country_name)))
      .catch(() => setCompleted([]));
  }, []);

  const completedCountries = useMemo(
    () =>
      completed
        .map((countryName) => findCountry(countryName))
        .filter((country): country is RepresentativeCountry => Boolean(country && isWorkbookEligibleCountry(country))),
    [completed],
  );

  const totalSpreads = Math.max(1, Math.ceil(completedCountries.length / STAMPS_PER_SPREAD));
  const isFirstSpread = currentSpread === 0;
  const isLastSpread = currentSpread >= totalSpreads - 1;
  const spreadStamps = completedCountries.slice(currentSpread * STAMPS_PER_SPREAD, currentSpread * STAMPS_PER_SPREAD + STAMPS_PER_SPREAD);
  const leftStamps = spreadStamps.slice(0, STAMPS_PER_PAGE);
  const rightStamps = spreadStamps.slice(STAMPS_PER_PAGE, STAMPS_PER_SPREAD);
  const leftPageNumber = currentSpread * PAGES_PER_SPREAD + 1;
  const rightPageNumber = leftPageNumber + 1;

  useEffect(() => {
    setCurrentSpread((spread) => Math.min(spread, totalSpreads - 1));
  }, [totalSpreads]);

  return (
    <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <section className="passport-book-open passport-soft-enter passport-explorer-book workbook-book" aria-label="세계 여행 기록">
        <PassportBookmarks />
        <LogoutBookmark />

        <div className="passport-page passport-page-left">
          <div key={`stamp-left-${currentSpread}`} className="passport-open-content workbook-page-turn">
            <StampPageSide
              title={currentSpread === 0 ? "세계 여행 기록" : undefined}
              subtitle={currentSpread === 0 ? "여행한 국가를 완료하면 스탬프가 여권에 기록됩니다." : undefined}
              stamps={leftStamps}
              spreadIndex={currentSpread}
              pageOffset={0}
              emptyMessage={completedCountries.length === 0 ? "아직 찍힌 스탬프가 없습니다." : undefined}
            />
            <PageFooter
              pageNumber={leftPageNumber}
              side="left"
              previousDisabled={isFirstSpread}
              onPrevious={() => setCurrentSpread((spread) => Math.max(0, spread - 1))}
            />
          </div>
        </div>

        <div className="passport-page passport-page-right">
          <div key={`stamp-right-${currentSpread}`} className="passport-open-content workbook-page-turn">
            <StampPageSide stamps={rightStamps} spreadIndex={currentSpread} pageOffset={1} />
            <PageFooter
              pageNumber={rightPageNumber}
              side="right"
              nextDisabled={isLastSpread}
              onNext={() => setCurrentSpread((spread) => Math.min(totalSpreads - 1, spread + 1))}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function StampPageSide({
  title,
  subtitle,
  stamps,
  spreadIndex,
  pageOffset,
  emptyMessage,
}: {
  title?: string;
  subtitle?: string;
  stamps: RepresentativeCountry[];
  spreadIndex: number;
  pageOffset: 0 | 1;
  emptyMessage?: string;
}) {
  return (
    <>
      {title ? (
        <header className="relative z-10 mb-2 min-h-[84px]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Passport Stamps</p>
          <h1 className="mt-2 text-3xl font-black text-passport-navy">{title}</h1>
          {subtitle && <p className="mt-2 text-base font-black text-passport-blue">{subtitle}</p>}
        </header>
      ) : (
        <div className="min-h-[84px]" aria-hidden="true" />
      )}

      <section className="relative min-h-0 flex-1 overflow-hidden">
        <StampWatermark />
        {emptyMessage && (
          <p className="relative z-10 mt-6 max-w-xs text-base font-bold leading-7 text-passport-ink/62">
            {emptyMessage}
          </p>
        )}
        {stamps.map((country, index) => (
          <PassportStampImage key={`${country.name}-${spreadIndex}-${pageOffset}-${index}`} country={country} position={getStampPosition(index, spreadIndex, pageOffset)} />
        ))}
      </section>
    </>
  );
}

function StampWatermark() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-passport-blue/[0.04]" aria-hidden="true">
      <Stamp size={260} strokeWidth={1.4} />
    </div>
  );
}

function PassportStampImage({ country, position }: { country: RepresentativeCountry; position: StampPosition }) {
  const stamp = stampAssets[country.name];

  if (!stamp) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={stamp.src}
      alt={stamp.alt}
      className="absolute z-10 select-none object-contain opacity-90 mix-blend-multiply drop-shadow-[0_1px_1px_rgba(67,24,18,0.18)]"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        transform: `rotate(${position.rotate}deg)`,
      }}
      draggable={false}
    />
  );
}

function getStampPosition(index: number, spreadIndex: number, pageOffset: 0 | 1): StampPosition {
  const base = stampPositions[index % stampPositions.length];
  const direction = pageOffset === 0 ? -1 : 1;
  const spreadShift = (spreadIndex % 3) - 1;

  return {
    ...base,
    rotate: base.rotate + direction * spreadShift * 2,
  };
}

function PageFooter({
  pageNumber,
  side,
  previousDisabled = false,
  nextDisabled = false,
  onPrevious,
  onNext,
}: {
  pageNumber: number;
  side: "left" | "right";
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  return (
    <footer className="mt-3 grid grid-cols-3 items-center">
      <div className="justify-self-start">
        {side === "left" && (
          <button type="button" onClick={onPrevious} disabled={previousDisabled} className="workbook-turn-button disabled:cursor-not-allowed disabled:opacity-35" aria-label="이전 사증 펼침">
            <ArrowLeft size={18} />
          </button>
        )}
      </div>
      <p className="justify-self-center text-xs font-black tracking-[0.24em] text-passport-blue/55">- {pageNumber} -</p>
      <div className="justify-self-end">
        {side === "right" && (
          <button type="button" onClick={onNext} disabled={nextDisabled} className="workbook-turn-button disabled:cursor-not-allowed disabled:opacity-35" aria-label="다음 사증 펼침">
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </footer>
  );
}

function PassportBookmarks() {
  const items = [
    { label: "세계지도", href: "/worldmap", active: false, icon: Globe2 },
    { label: "사증", href: "/stamp", active: true, icon: Stamp },
    { label: "여행한 국가", href: "/workbook", active: false, icon: BookOpen },
    { label: "조사한 국가", href: "/travel-info", active: false, icon: MapPinned },
    { label: "여권 보기", href: "/mypage/passport", active: false, icon: BookOpen },
  ];

  return (
    <nav className="passport-bookmarks" aria-label="여권 책갈피">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link key={item.label} href={item.href} className={`passport-bookmark ${item.active ? "is-active" : ""}`}>
            <Icon size={15} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
