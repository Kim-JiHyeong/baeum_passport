"use client";

import { BookOpen, Globe2, MapPinned, Stamp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LogoutBookmark } from "@/components/passport/LogoutBookmark";
import { getMe, type AuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/apiClient";
import { getUserCountries, type UserCountryDto } from "@/lib/api/immigration";
import { getStamps, type StampDto } from "@/lib/api/stamp";

export default function MyPassportPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userCountries, setUserCountries] = useState<UserCountryDto[]>([]);
  const [stamps, setStamps] = useState<StampDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getMe()
      .then(async (nextUser) => {
        const [nextUserCountries, nextStamps] = await Promise.all([
          getUserCountries().catch((error) => {
            console.error("Failed to load user countries.", error);
            return [];
          }),
          getStamps().catch((error) => {
            console.error("Failed to load stamps.", error);
            return [];
          }),
        ]);

        if (!isMounted) return;
        setUser(nextUser);
        setUserCountries(nextUserCountries);
        setStamps(nextStamps);
      })
      .catch((error) => {
        if (!isMounted) return;
        if (error instanceof ApiError && error.status === 401) {
          router.push("/login");
          return;
        }
        console.error("Failed to load passport.", error);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const stats = useMemo(() => {
    const recentCountry = [...userCountries].sort((a, b) => toTime(b.added_at) - toTime(a.added_at))[0];
    const recentStamp = [...stamps].sort((a, b) => toTime(b.created_at) - toTime(a.created_at))[0];

    return {
      visitedCountries: userCountries.length,
      stamps: stamps.length,
      immigrationPassed: userCountries.filter((country) => country.immigration_passed).length,
      completedWorkbooks: stamps.length,
      recentCountry: recentCountry?.name ?? "-",
      recentStamp: recentStamp?.country_name ?? "-",
    };
  }, [stamps, userCountries]);

  return (
    <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <section className="passport-book-open passport-soft-enter passport-explorer-book workbook-book" aria-label="여권 보기">
        <PassportBookmarks />
        <LogoutBookmark />

        <div className="passport-page passport-page-left">
          <div className="passport-open-content justify-between gap-5">
            {isLoading || !user ? (
              <LoadingPassportSide />
            ) : (
              <section className="grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-5">
                <header>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-passport-stamp">Republic of Korea</p>
                  <h1 className="mt-3 text-3xl font-black text-passport-navy">내 여권</h1>
                  <p className="mt-2 text-sm font-bold text-passport-blue">Baeum Passport</p>
                </header>

                <div className="grid min-h-0 grid-cols-[170px_1fr] gap-5 rounded-lg border border-passport-blue/15 bg-white/62 p-5">
                  <div className="flex min-h-0 flex-col">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-passport-blue/20 bg-passport-paper shadow">
                      {user.avatar ? (
                        <Image src={`/images/character/${user.avatar}`} alt={`${user.name} 아바타`} fill sizes="170px" className="object-contain p-2" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-5xl font-black text-passport-blue/35">
                          {user.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-center text-xs font-black uppercase tracking-[0.22em] text-passport-blue/60">Photo</p>
                  </div>

                  <div className="grid content-start gap-3">
                    <PassportInfo label="NAME" value={user.name} />
                    <PassportInfo label="PASSPORT NO" value={user.username} />
                    <PassportInfo label="STUDENT CODE" value={studentCode(user)} />
                    <PassportInfo label="SEX" value={sexCode(user.gender)} />
                    <div className="grid grid-cols-3 gap-3">
                      <PassportInfo label="GRADE" value={user.grade ?? "-"} compact />
                      <PassportInfo label="CLASS" value={user.classNumber ?? "-"} compact />
                      <PassportInfo label="NUMBER" value={user.studentNumber ?? "-"} compact />
                    </div>
                    <PassportInfo label="DATE OF ISSUE" value={formatDate(user.createdAt)} />
                  </div>
                </div>
              </section>
            )}
            <PageNumber number={1} />
          </div>
        </div>

        <div className="passport-page passport-page-right">
          <div className="passport-open-content justify-between gap-5">
            {isLoading || !user ? (
              <LoadingPassportSide />
            ) : (
              <section className="grid min-h-0 flex-1 grid-rows-[auto_1fr_auto] gap-5">
                <header>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-passport-stamp">Learning Journey</p>
                  <h2 className="mt-3 text-3xl font-black text-passport-navy">배움여권 소유자</h2>
                  <p className="mt-3 text-base font-bold leading-7 text-passport-ink/72">{user.name}님의 세계 여행 학습 기록입니다.</p>
                </header>

                <div className="grid min-h-0 grid-cols-2 gap-4">
                  <StatTile label="방문 국가 수" value={`${stats.visitedCountries}개`} />
                  <StatTile label="획득 스탬프 수" value={`${stats.stamps}개`} />
                  <StatTile label="입국심사 통과 국가 수" value={`${stats.immigrationPassed}개`} />
                  <StatTile label="학습 완료 국가 수" value={`${stats.completedWorkbooks}개`} />
                </div>

                <div className="grid gap-3 rounded-lg border border-passport-blue/15 bg-white/62 p-5">
                  <PassportInfo label="RECENT VISIT" value={stats.recentCountry} />
                  <PassportInfo label="RECENT STAMP" value={stats.recentStamp} />
                </div>
              </section>
            )}
            <PageNumber number={2} />
          </div>
        </div>
      </section>
    </main>
  );
}

function PassportBookmarks() {
  const items = [
    { label: "세계지도", href: "/worldmap", active: false, icon: Globe2 },
    { label: "사증", href: "/stamp", active: false, icon: Stamp },
    { label: "학습지", href: "/workbook", active: false, icon: BookOpen },
    { label: "여행정보", href: "/travel-info", active: false, icon: MapPinned },
    { label: "여권 보기", href: "/mypage/passport", active: true, icon: BookOpen },
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

function PassportInfo({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-md border border-passport-blue/10 bg-passport-paper px-3 py-2">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-passport-blue/60">{label}</p>
      <p className={`mt-1 break-words font-black text-passport-navy ${compact ? "text-lg" : "text-xl"}`}>{value}</p>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[120px] flex-col justify-between rounded-lg border border-passport-blue/15 bg-white/62 p-5">
      <p className="text-sm font-black text-passport-blue">{label}</p>
      <p className="text-4xl font-black text-passport-navy">{value}</p>
    </div>
  );
}

function LoadingPassportSide() {
  return (
    <section className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-passport-blue/15 bg-white/62">
      <p className="text-base font-black text-passport-blue">여권 정보를 불러오는 중입니다.</p>
    </section>
  );
}

function PageNumber({ number }: { number: number }) {
  return (
    <footer className="mt-3 grid grid-cols-3 items-center">
      <div />

      <p className="justify-self-center text-base font-black tracking-[0.24em] text-passport-blue/55">
        - {number} -
      </p>

      <div />
    </footer>
  );
}

function sexCode(gender?: string) {
  if (gender === "남") return "M";
  if (gender === "여") return "F";
  return "-";
}

function studentCode(user: AuthUser) {
  if (!user.grade || !user.classNumber || !user.studentNumber) return "-";
  return `${user.grade}${user.classNumber}${user.studentNumber}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function toTime(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}
