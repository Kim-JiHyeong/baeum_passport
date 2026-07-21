"use client";

import { BookOpen, Globe2, ImageIcon, MapPinned, Plus, Stamp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LogoutBookmark } from "@/components/passport/LogoutBookmark";
import { countryPath } from "@/lib/countries";
import { createTravelInfo, getTravelInfos } from "@/lib/api/travel";
import type { TravelCountryInfo } from "@/lib/storage";

const emptyInfo: TravelCountryInfo = {
  countryName: "",
  flagImage: "",
  displayName: "",
  area: "",
  population: "",
  language: "",
  capital: "",
  continent: "",
  mapImage: "",
  travelPurpose: "",
  placesToVisit: "",
  localPhrase: "",
  travelTips: "",
  landmark: "",
  foodToTry: "",
  packingList: "",
  cautions: "",
  weatherNote: "",
  freeMemo: "",
};

export default function TravelInfoIndexPage() {
  const router = useRouter();
  const [travelInfos, setTravelInfos] = useState<TravelCountryInfo[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [countryName, setCountryName] = useState("");

  useEffect(() => {
    getTravelInfos().then(setTravelInfos).catch(() => setTravelInfos([]));
  }, []);

  async function addCountry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = countryName.trim();
    if (!trimmedName) return;

    const currentInfo = travelInfos.find((info) => info.countryName === trimmedName);
    const nextInfo: TravelCountryInfo = currentInfo ?? {
      ...emptyInfo,
      countryName: trimmedName,
      displayName: trimmedName,
    };

    if (!currentInfo) {
      await createTravelInfo(nextInfo);
    }

    router.push(`/travel-info/${countryPath(trimmedName)}`);
  }

  return (
    <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <section className="passport-book-open passport-soft-enter passport-explorer-book workbook-book" aria-label="조사한 국가">
        <PassportBookmarks />
        <LogoutBookmark />

        <div className="passport-page passport-page-left">
          <div className="passport-open-content justify-between gap-6">
            <header>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Travel Info</p>
              <h1 className="mt-3 text-3xl font-black text-passport-navy">조사한 국가</h1>
              <p className="mt-4 text-base font-bold leading-7 text-passport-ink/72">
                조사한 국가는 내가 가보고 싶은 나라를 직접 추가하고, 여행 전에 알고 싶은 내용을 정리하는 준비 페이지입니다.
              </p>
            </header>

            <div className="grid gap-3 rounded-lg border border-passport-blue/15 bg-white/62 p-5">
              <InfoPoint icon={<MapPinned size={20} />} title="가고 싶은 나라" description="대표 국가 목록에 없어도 원하는 나라 이름을 직접 입력할 수 있습니다." />
              <InfoPoint icon={<ImageIcon size={20} />} title="여행 준비 기록" description="이미지, 장소, 현지 표현, 준비물과 주의할 점을 모아 둡니다." />
              <InfoPoint icon={<BookOpen size={20} />} title="나만의 여권 기록" description="추가한 국가는 오른쪽 목록에서 다시 열어 이어서 작성합니다." />
            </div>

            <div className="rounded-lg border border-passport-gold/30 bg-passport-gold/10 p-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-passport-stamp">Passport Note</p>
              <p className="mt-2 text-sm font-bold leading-6 text-passport-ink/68">국가 추가와 선택은 오른쪽 페이지에서 진행합니다.</p>
            </div>

            <div className="passport-map-watermark">
              <MapPinned size={150} />
            </div>
          </div>
        </div>

        <div className="passport-page passport-page-right">
          <div className="passport-open-content gap-4">
            <div className="passport-map-watermark">
              <MapPinned size={150} />
            </div>
            {isAdding ? (
              <AddCountryForm
                countryName={countryName}
                onCountryNameChange={setCountryName}
                onSubmit={addCountry}
                onCancel={() => {
                  setIsAdding(false);
                  setCountryName("");
                }}
              />
            ) : (
              <TravelInfoList infos={travelInfos} onAdd={() => setIsAdding(true)} />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoPoint({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-passport-blue text-white">{icon}</span>
      <div>
        <p className="text-base font-black text-passport-navy">{title}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-passport-ink/65">{description}</p>
      </div>
    </div>
  );
}

function AddCountryForm({
  countryName,
  onCountryNameChange,
  onSubmit,
  onCancel,
}: {
  countryName: string;
  onCountryNameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <>
      <header>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Add Destination</p>
        <h2 className="mt-3 text-3xl font-black text-passport-navy">새 여행지 추가</h2>
        <p className="mt-4 text-base font-bold leading-7 text-passport-ink/72">조사한 국가를 만들 나라 이름을 입력하세요.</p>
      </header>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col justify-center gap-5">
        <label className="block rounded-lg border border-passport-blue/15 bg-white/62 p-5">
          <span className="text-base font-black text-passport-blue">국가명</span>
          <input
            value={countryName}
            onChange={(event) => onCountryNameChange(event.target.value)}
            placeholder="예: 이탈리아, 캐나다, 베트남, 스페인"
            className="mt-3 h-12 w-full rounded-md border border-passport-blue/15 bg-passport-paper px-3 text-base font-bold text-passport-ink outline-none transition placeholder:text-passport-ink/35 focus:border-passport-blue"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="h-12 rounded-md border border-passport-blue/20 font-black text-passport-blue transition hover:bg-passport-blue/10">
            취소
          </button>
          <button type="submit" className="h-12 rounded-md bg-passport-navy font-black text-white shadow transition hover:bg-passport-blue">
            추가하기
          </button>
        </div>
      </form>
    </>
  );
}

function TravelInfoList({ infos, onAdd }: { infos: TravelCountryInfo[]; onAdd: () => void }) {
  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">My Destinations</p>
          <h2 className="mt-2 text-3xl font-black text-passport-navy">여행 국가</h2>
          <p className="mt-3 text-base font-bold leading-7 text-passport-ink/70">
            {infos.length > 0 ? "국가 카드를 선택해 여행 준비 내용을 이어서 작성하세요." : "먼저 조사한 국가를 만들 나라를 추가하세요."}
          </p>
        </div>
        <MapPinned className="text-passport-blue/35" size={34} />
      </header>

      <div className="scroll-area min-h-0 flex-1 pr-1">
        <div className="grid grid-cols-2 gap-3">
          {infos.map((info) => (
            <Link
              key={info.countryName}
              href={`/travel-info/${countryPath(info.countryName)}`}
              className="group rounded-md border border-passport-blue/15 bg-white/72 p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-passport-gold hover:bg-white hover:shadow"
            >
              <span className="relative mx-auto flex h-16 w-24 items-center justify-center overflow-hidden rounded border border-passport-blue/10 bg-passport-paper">
                {info.flagImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.flagImage} alt={`${info.countryName} 대표 이미지`} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="text-passport-blue/35" size={24} />
                )}
              </span>
              <span className="mt-3 block text-base font-black text-passport-navy">{info.displayName || info.countryName}</span>
            </Link>
          ))}

          <button
            type="button"
            onClick={onAdd}
            className="flex flex-col items-center justify-center rounded-md border border-dashed border-passport-gold/70 bg-passport-gold/10 p-3 text-center text-passport-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-passport-gold/18 hover:shadow"
          >
            <span className="mx-auto flex h-16 w-24 items-center justify-center rounded border border-passport-gold/45 bg-passport-paper/70">
              <Plus size={28} />
            </span>
            <span className="mt-3 block text-base font-black">국가 추가</span>
          </button>
        </div>
      </div>
    </>
  );
}

function PassportBookmarks() {
  const items = [
    { label: "세계지도", href: "/worldmap", active: false, icon: Globe2 },
    { label: "사증", href: "/stamp", active: false, icon: Stamp },
    { label: "여행한 국가", href: "/workbook", active: false, icon: BookOpen },
    { label: "조사한 국가", href: "/travel-info", active: true, icon: MapPinned },
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
