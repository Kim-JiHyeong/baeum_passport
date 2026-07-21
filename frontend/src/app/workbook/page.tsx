"use client";

"use client";

import { BookOpen, Compass, Globe2, MapPinned, PenLine, Stamp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LogoutBookmark } from "@/components/passport/LogoutBookmark";
import { getCountries } from "@/lib/api/country";
import { getCompletedWorkbookCountryIds } from "@/lib/api/workbook";
import { countryPath, representativeCountries, workbookCountries, type RepresentativeCountry } from "@/lib/countries";

const selectableCountries = workbookCountries;
const bookmarkCountry = selectableCountries[0] ?? representativeCountries[0];

export default function WorkbookIndexPage() {
  const [completedCountryIds, setCompletedCountryIds] = useState<Set<number>>(new Set());
  const [countryIdsByName, setCountryIdsByName] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getCompletedWorkbookCountryIds().catch((error) => {
        console.error("Failed to load completed countries.", error);
        return [];
      }),
      getCountries().catch((error) => {
        console.error("Failed to load country ids.", error);
        return [];
      }),
    ]).then(([completedIds, countries]) => {
      if (!isMounted) return;
      setCompletedCountryIds(new Set(completedIds));
      setCountryIdsByName(
        countries.reduce<Record<string, number>>((nextMap, country) => {
          nextMap[country.name] = country.id;
          return nextMap;
        }, {}),
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const completedCountryNames = useMemo(() => {
    return new Set(
      selectableCountries
        .filter((country) => {
          const countryId = countryIdsByName[country.name];
          return countryId != null && completedCountryIds.has(countryId);
        })
        .map((country) => country.name),
    );
  }, [completedCountryIds, countryIdsByName]);

  return (
    <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <section className="passport-book-open passport-soft-enter passport-explorer-book workbook-book" aria-label="여행한 국가 선택">
        <PassportBookmarks country={bookmarkCountry} />
        <LogoutBookmark />

        <div className="passport-page passport-page-left">
          <div className="passport-open-content justify-between gap-6">
            <header>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Workbook</p>
              <h1 className="mt-3 text-3xl font-black text-passport-navy">여행한 국가를 선택하세요</h1>
              <p className="mt-4 leading-7 text-passport-ink/72">
                배움여권의 여행한 국가는 나라 이름만 정해져 있습니다. 나머지 정보는 직접 조사하고 기록해
                나만의 여행 기록으로 완성해 보세요.
              </p>
            </header>

            <div className="rounded-lg border border-passport-blue/15 bg-white/62 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-passport-blue text-white">
                  <Compass size={22} />
                </span>
                <div>
                  <p className="text-sm font-black text-passport-navy">여행 규칙</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-passport-ink/65">
                    국가명 외의 수도, 언어, 인구, 지도, 국기는 모두 조사해서 직접 채웁니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="passport-map-watermark">
              <PenLine size={150} />
            </div>
          </div>
        </div>

        <div className="passport-page passport-page-right">
          <div className="passport-open-content gap-4">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Country List</p>
                <h2 className="mt-2 text-2xl font-black text-passport-navy">대표 국가</h2>
              </div>
              <BookOpen className="text-passport-blue/35" size={34} />
            </header>

            <div className="scroll-area min-h-0 flex-1 pr-1">
              <div className="grid grid-cols-2 gap-3">
                {selectableCountries.map((country) => (
                  <CountryCard key={country.name} country={country} completed={completedCountryNames.has(country.name)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CountryCard({ country, completed }: { country: RepresentativeCountry; completed: boolean }) {
  return (
    <Link
      href={`/workbook/${countryPath(country.name)}`}
      className={`group rounded-md border p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-passport-gold hover:bg-white hover:shadow ${
        completed ? "border-passport-blue/15 bg-white/72" : "border-passport-blue/10 bg-white/50 opacity-70"
      }`}
    >
      <span className="relative mx-auto block h-14 w-20 overflow-hidden rounded border border-passport-blue/10">
        <Image src={country.flagImage} alt={`${country.name} 국기`} fill sizes="80px" className={`object-cover ${completed ? "" : "grayscale"}`} />
      </span>
      <span className={`mt-3 block text-sm font-black ${completed ? "text-passport-navy" : "text-passport-navy/55"}`}>{country.name}</span>
    </Link>
  );
}

function PassportBookmarks({ country }: { country: RepresentativeCountry }) {
  const encodedCountry = countryPath(country.name);
  const items = [
    { label: "세계지도", href: "/worldmap", active: false, icon: Globe2 },
    { label: "사증", href: "/stamp", active: false, icon: Stamp },
    { label: "여행한 국가", href: "/workbook", active: true, icon: BookOpen },
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
