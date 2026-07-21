"use client";

import { ArrowLeft, BookOpen, Globe2, Info, MapPinned, Stamp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LogoutBookmark } from "@/components/passport/LogoutBookmark";
import { WorldMapGraphic } from "@/components/WorldMapGraphic";
import { getCountryIdByName } from "@/lib/api/country";
import { getUserCountries } from "@/lib/api/immigration";
import { continents, countryPath, isWorkbookEligibleCountry, representativeCountries, type ContinentKey, type RepresentativeCountry } from "@/lib/countries";

const continentImages: Record<ContinentKey, string> = {
  asia: "/images/asia.png",
  europe: "/images/europe.png",
  africa: "/images/africa.png",
  northAmerica: "/images/north_america.png",
  southAmerica: "/images/south_america.png",
  oceania: "/images/oseania.png",
};

const countryMapMarkers: Record<string, { left: string; top: string }> = {
  대한민국: { left: "60%", top: "55%" },
  일본: { left: "68%", top: "52%" },
  중국: { left: "54%", top: "60%" },
  영국: { left: "34%", top: "47%" },
  프랑스: { left: "38%", top: "65%" },
  독일: { left: "48%", top: "56%" },
  이집트: { left: "58%", top: "23%" },
  미국: { left: "45%", top: "65%" },
  멕시코: { left: "45%", top: "83%" },
  브라질: { left: "58%", top: "33%" },
  호주: { left: "47%", top: "50%" },
};

export default function WorldMapPage() {
  const router = useRouter();
  const [selectedContinent, setSelectedContinent] = useState<ContinentKey | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<RepresentativeCountry | null>(null);
  const [alreadyPassedCountryName, setAlreadyPassedCountryName] = useState("");
  const [isCheckingImmigration, setIsCheckingImmigration] = useState(false);

  const continent = selectedContinent ? continents[selectedContinent] : null;
  const continentCountries = useMemo(() => {
    if (!selectedContinent) return [];
    return representativeCountries.filter((country) => country.continent === selectedContinent);
  }, [selectedContinent]);

  const bookmarkCountry = selectedCountry ?? continentCountries[0] ?? representativeCountries[0];

  function selectContinent(continentKey: ContinentKey) {
    setSelectedContinent(continentKey);
    setSelectedCountry(null);
  }

  function resetMapSelection() {
    setSelectedContinent(null);
    setSelectedCountry(null);
  }

  async function handleImmigrationClick(country: RepresentativeCountry) {
    const targetHref = `/immi/${countryPath(country.name)}`;

    try {
      setIsCheckingImmigration(true);
      const countryId = await getCountryIdByName(country.name, true);

      if (!countryId) {
        router.push(targetHref);
        return;
      }

      const userCountries = await getUserCountries();
      const alreadyPassed = userCountries.some(
        (userCountry) => userCountry.country_id === countryId && userCountry.immigration_passed
      );

      if (alreadyPassed) {
        setAlreadyPassedCountryName(country.name);
        return;
      }

      router.push(targetHref);
    } catch (error) {
      console.error("Failed to check immigration status.", { countryName: country.name, error });
      router.push(targetHref);
    } finally {
      setIsCheckingImmigration(false);
    }
  }

  return (
    <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <section className="passport-book-open passport-soft-enter passport-explorer-book" aria-label="세계 여행 배움여권">
        <PassportBookmarks country={bookmarkCountry} />
        <LogoutBookmark />

        <div className="passport-page passport-page-left">
          <div className="passport-open-content gap-4">
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">World Map</p>
                <h1 className="mt-2 text-3xl font-black text-passport-navy">세계지도</h1>
              </div>
              {selectedContinent ? (
                <button
                  type="button"
                  onClick={resetMapSelection}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-passport-blue/20 px-3 text-sm font-bold text-passport-blue transition hover:bg-passport-blue/10"
                >
                  <ArrowLeft size={16} />
                  세계지도
                </button>
              ) : (
                <Globe2 className="text-passport-blue/35" size={34} />
              )}
            </header>

            <div className="min-h-0 flex-1">
              {selectedContinent ? (
                <ContinentExplorer
                  continentKey={selectedContinent}
                  countries={continentCountries}
                  selectedCountry={selectedCountry}
                  onCountrySelect={setSelectedCountry}
                />
              ) : (
                <WorldMapGraphic selected={null} onSelect={selectContinent} />
              )}
            </div>

            {continent ? (
              <section className="tab-fade grid gap-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <InfoTile label="인구" value={continent.population} compact />
                  <InfoTile label="면적" value={continent.area} compact />
                  <InfoTile label="국가" value={`${continent.countryCount}개`} compact />
                </div>
                <div>
                  <div className="mb-2 flex items-baseline gap-3">
                    <h2 className="text-lg font-black text-passport-navy">{continent.name}</h2>
                    <p className="text-xs font-black text-passport-blue">대표 국가</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {continentCountries.map((country) => (
                      <button
                        key={country.name}
                        type="button"
                        onClick={() => setSelectedCountry(country)}
                        className={`group rounded-md border bg-white/72 p-2 text-center transition hover:-translate-y-0.5 hover:border-passport-gold hover:shadow ${
                          selectedCountry?.name === country.name ? "border-passport-gold shadow" : "border-passport-blue/15"
                        }`}
                      >
                        <span className="relative mx-auto block h-10 w-16 overflow-hidden rounded border border-passport-blue/10">
                          <Image src={country.flagImage} alt={`${country.name} 국기`} fill sizes="64px" className="object-cover" />
                        </span>
                        <span className="mt-2 block text-sm font-black text-passport-navy">{country.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <p className="rounded-lg border border-passport-blue/15 bg-white/55 p-4 text-sm font-bold leading-6 text-passport-ink/70">
                지도의 대륙을 선택하면 확대 지도와 대표 국가가 여권에 기록됩니다.
              </p>
            )}
          </div>
        </div>

        <div className="passport-page passport-page-right">
          <div className="passport-open-content">
            {selectedCountry ? (
              <CountryDetail country={selectedCountry} isCheckingImmigration={isCheckingImmigration} onImmigrationClick={handleImmigrationClick} />
            ) : (
              <EmptyCountryState selectedContinent={selectedContinent} />
            )}
          </div>
        </div>

        {alreadyPassedCountryName && <AlreadyPassedImmigrationModal onClose={() => setAlreadyPassedCountryName("")} />}
      </section>
    </main>
  );
}

function PassportBookmarks({ country }: { country: RepresentativeCountry }) {
  const items = [
    { label: "세계지도", href: "/worldmap", active: true, icon: Globe2 },
    { label: "사증", href: "/stamp", active: false, icon: Stamp },
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

function ContinentExplorer({
  continentKey,
  countries,
  selectedCountry,
  onCountrySelect,
}: {
  continentKey: ContinentKey;
  countries: RepresentativeCountry[];
  selectedCountry: RepresentativeCountry | null;
  onCountrySelect: (country: RepresentativeCountry) => void;
}) {
  const imageSrc = continentImages[continentKey];

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-passport-blue/15 bg-[#dbe9ed]">
      <Image
        src={imageSrc}
        alt={`${continents[continentKey].name} 확대 지도`}
        fill
        sizes="(min-width: 1024px) 420px, 90vw"
        className="object-contain"
        priority
      />
      <div className="absolute inset-0 bg-passport-blue/5" />
      {countries.map((country) => {
        const marker = countryMapMarkers[country.name];
        if (!marker) return null;
        const active = selectedCountry?.name === country.name;

        return (
          <button
            key={country.name}
            type="button"
            onClick={() => onCountrySelect(country)}
            className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border bg-white/90 px-2.5 py-1.5 text-xs font-black text-passport-navy shadow transition hover:scale-105 hover:border-passport-gold hover:shadow-md ${
              active ? "border-passport-gold ring-2 ring-passport-gold/70" : "border-white"
            }`}
            style={{ left: marker.left, top: marker.top }}
          >
            <span className="h-3.5 w-3.5 rounded-full border border-white shadow" style={{ backgroundColor: country.color }} />
            {country.name}
          </button>
        );
      })}
      <div className="absolute left-3 top-3 rounded-md bg-passport-navy/82 px-3.5 py-2 text-sm font-black text-white shadow">
        {continents[continentKey].name}
      </div>
    </div>
  );
}

function CountryDetail({
  country,
  isCheckingImmigration,
  onImmigrationClick,
}: {
  country: RepresentativeCountry;
  isCheckingImmigration: boolean;
  onImmigrationClick: (country: RepresentativeCountry) => void;
}) {
  const isComparisonBase = country.name === "대한민국";
  const canEnterImmigration = isWorkbookEligibleCountry(country);

  return (
    <section key={country.name} className="tab-fade flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative h-28 w-44 overflow-hidden rounded-md border border-passport-blue/15 shadow">
            <Image src={country.flagImage} alt={`${country.name} 국기`} fill sizes="176px" className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-passport-stamp">Country Record</p>
            <h2 className="mt-2 text-4xl font-black text-passport-navy">{country.name}</h2>
          </div>
        </div>
        {canEnterImmigration && (
          <button
            type="button"
            onClick={() => onImmigrationClick(country)}
            disabled={isCheckingImmigration}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-passport-navy px-4 text-sm font-black text-white shadow transition hover:bg-passport-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            입국심사
          </button>
        )}
      </div>

      <div className="scroll-area flex min-h-0 flex-1 flex-col pr-1">
        <p className="rounded-lg border border-passport-blue/15 bg-white/62 p-5 text-base font-bold leading-8 text-passport-ink/78">{country.overview}</p>

        <div className="mt-5 grid flex-1 grid-cols-2 gap-4">
          <InfoTile label="수도" value={country.capital} />
          <InfoTile label="언어" value={country.language} />
          <InfoTile label="통화" value={country.currency} />
          <InfoTile label="인구" value={country.population} note={isComparisonBase ? undefined : country.populationComparison} />
          <InfoTile label="면적" value={country.area} note={isComparisonBase ? undefined : country.areaComparison} />
          <InfoTile label="위치" value={country.mapNote} />
        </div>
      </div>
    </section>
  );
}

function AlreadyPassedImmigrationModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-6">
      <section className="w-full max-w-sm rounded-lg border border-passport-gold/50 bg-passport-paper p-6 text-center shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Immigration Complete</p>
        <h2 className="mt-3 text-2xl font-black text-passport-navy">입국심사 완료</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-passport-ink/70">이미 입국심사를 통과한 국가입니다.</p>
        <button type="button" onClick={onClose} className="mt-6 h-11 w-full rounded-md bg-passport-navy font-black text-white shadow transition hover:bg-passport-blue">
          확인
        </button>
      </section>
    </div>
  );
}

function EmptyCountryState({ selectedContinent }: { selectedContinent: ContinentKey | null }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Explorer Guide</p>
        <h2 className="mt-3 text-3xl font-black text-passport-navy">{selectedContinent ? "대표 국가를 선택하세요" : "대륙을 선택하세요"}</h2>
        <p className="mt-4 leading-7 text-passport-ink/72">
          세계지도에서 대륙을 고른 뒤, 왼쪽 페이지의 국기를 눌러 국가 정보를 살펴보세요.
        </p>
      </div>
      <div className="passport-map-watermark">
        <Info size={150} />
      </div>
    </section>
  );
}

function InfoTile({ label, value, note, compact = false }: { label: string; value: string; note?: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className="min-h-[96px] rounded-md bg-passport-blue/10 px-5 py-4">
        <p className="pl-2 text-base font-black text-passport-blue">{label}</p>
        <p className="mt-2 text-lg font-black text-passport-ink">{value}</p>
        {note && <p className="mt-1 text-base font-bold text-passport-stamp">{note}</p>}
      </div>
    );
  }

  return (
    <div className="flex min-h-[96px] flex-col rounded-md p-4">
      <div className="border-y border-passport-blue/20 py-2">
        <p className="text-base font-black text-passport-blue">{label}</p>
      </div>
      <div className="flex flex-1 flex-col justify-center pt-3">
        <p className="text-lg font-black text-passport-ink">{value}</p>
        {note && <p className="mt-2 text-base font-bold text-passport-stamp">{note}</p>}
      </div>
    </div>
  );
}
