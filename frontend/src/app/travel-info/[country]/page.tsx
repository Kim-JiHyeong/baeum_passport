"use client";

import { BookOpen, ChevronLeft, Globe2, ImageIcon, MapPinned, Plane, Save, Stamp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useState } from "react";
import { LogoutBookmark } from "@/components/passport/LogoutBookmark";
import { findCountry } from "@/lib/countries";
import { createTravelInfo, deleteTravelInfo as deleteTravelInfoApi, getTravelInfo, updateTravelInfo } from "@/lib/api/travel";
import { uploadFlagImage, uploadMapImage } from "@/lib/api/upload";
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

export default function TravelInfoPage({ params }: { params: { country: string } }) {
  const router = useRouter();
  const countryName = decodeURIComponent(params.country);
  const country = findCountry(countryName);
  const [info, setInfo] = useState<TravelCountryInfo>({ ...emptyInfo, countryName, displayName: countryName });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getTravelInfo(countryName)
      .then((saved) => {
        if (!isMounted) return;
        setInfo({
          ...emptyInfo,
          ...saved,
          countryName: saved.countryName ?? countryName,
          displayName: saved.displayName ?? countryName,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setInfo({ ...emptyInfo, countryName, displayName: countryName });
      });

    return () => {
      isMounted = false;
    };
  }, [countryName]);

  function persist(nextInfo: TravelCountryInfo) {
    updateTravelInfo(countryName, nextInfo).catch(() => createTravelInfo(nextInfo).catch(() => undefined));
  }

  function update(field: keyof TravelCountryInfo, value: string) {
    setInfo((current) => {
      const nextInfo = { ...current, [field]: value };
      persist(nextInfo);
      return nextInfo;
    });
  }

  async function saveTravelInfo() {
    await updateTravelInfo(countryName, info).catch(() => createTravelInfo(info));
    router.push("/travel-info");
  }

  async function deleteTravelInfo() {
    await deleteTravelInfoApi(countryName);
    router.push("/travel-info");
  }

  return (
    <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <section className="passport-book-open passport-soft-enter passport-explorer-book workbook-book" aria-label={`${countryName} 조사한 국가`}>
        <PassportBookmarks />
        <LogoutBookmark />

        <div className="passport-page passport-page-left">
          <div className="passport-open-content gap-4">
            <div className="flex items-start justify-between gap-4">
              <TravelHeader countryName={country?.name ?? countryName} title="여행 기본 준비" />
              <Link
                href="/travel-info"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-passport-blue/20 px-3 text-sm font-bold text-passport-blue transition hover:bg-passport-blue/10"
              >
                <ChevronLeft size={17} />
                목록
              </Link>
            </div>
            <section className="grid min-h-0 flex-1 grid-rows-[1fr_auto_auto_auto] gap-3">
              <div className="grid min-h-0 grid-cols-2 gap-3">
                <ImageUrlField label="국기 또는 대표 이미지" value={info.flagImage} onChange={(value) => update("flagImage", value)} uploadType="flag" />
                <ImageUrlField label="지도 또는 위치 이미지" value={info.mapImage} onChange={(value) => update("mapImage", value)} uploadType="map" />
              </div>
              <TextArea
                label="여행 목적"
                value={info.travelPurpose}
                onChange={(value) => update("travelPurpose", value)}
                placeholder="예: 문화 체험, 자연 탐방, 역사 유적, 음식, 스포츠 등"
                rows={4}
              />
              <Field label="가보고 싶은 도시/장소" value={info.placesToVisit} onChange={(value) => update("placesToVisit", value)} placeholder="예: 파리, 교토, 뉴욕" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="현지에서 써보고 싶은 말" value={info.localPhrase} onChange={(value) => update("localPhrase", value)} placeholder="예: 안녕하세요" />
                <Field label="소속 대륙" value={info.continent} onChange={(value) => update("continent", value)} placeholder="예: 유럽" />
              </div>
            </section>
            <footer className="mt-3 grid grid-cols-3 items-center">
              <div />
              <PageNumber number={1} />
              <div />
            </footer>
          </div>
        </div>

        <div className="passport-page passport-page-right">
          <div className="passport-open-content gap-4">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Travel Checklist</p>
                <h2 className="mt-2 text-3xl font-black text-passport-navy">여행 메모</h2>
                <p className="mt-3 text-sm font-bold leading-7 text-passport-ink/72">여행 전에 알고 싶은 것과 준비할 것을 정리하세요.</p>
              </div>
              <Plane className="text-passport-blue/35" size={34} />
            </header>

            <section className="grid min-h-0 flex-1 grid-rows-[auto_auto_auto_1fr] gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="꼭 가보고 싶은 랜드마크" value={info.landmark} onChange={(value) => update("landmark", value)} placeholder="예: 에펠탑" />
                <Field label="먹어보고 싶은 음식" value={info.foodToTry} onChange={(value) => update("foodToTry", value)} placeholder="예: 라멘, 파스타" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextArea label="준비물" value={info.packingList} onChange={(value) => update("packingList", value)} placeholder="챙겨야 할 물건을 적어 보세요." rows={4} />
                <TextArea label="주의할 점" value={info.cautions} onChange={(value) => update("cautions", value)} placeholder="문화, 안전, 예절 등을 적어 보세요." rows={4} />
              </div>
              <TextArea label="예상 날씨/계절" value={info.weatherNote} onChange={(value) => update("weatherNote", value)} placeholder="여행할 계절의 날씨와 옷차림을 적어 보세요." rows={3} />
              <TextArea label="나만의 여행 메모" value={info.freeMemo} onChange={(value) => update("freeMemo", value)} placeholder="이 나라를 여행한다면 남기고 싶은 기록을 자유롭게 적어 보세요." rows={7} />
            </section>

            <footer className="mt-3 grid grid-cols-3 items-center">
              <div />
              <PageNumber number={2} />
              <div className="justify-self-end flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 font-black text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={17} />
                  삭제
                </button>
                <button
                  type="button"
                  onClick={saveTravelInfo}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-passport-blue px-4 font-black text-white shadow transition hover:bg-passport-navy"
                >
                  <Save size={17} />
                  저장
                </button>
              </div>
            </footer>
          </div>
        </div>

        {isDeleteModalOpen && <DeleteConfirmModal countryName={info.displayName || info.countryName || countryName} onCancel={() => setIsDeleteModalOpen(false)} onConfirm={deleteTravelInfo} />}
      </section>
    </main>
  );
}

function DeleteConfirmModal({ countryName, onCancel, onConfirm }: { countryName: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-passport-navy/30 px-6">
      <section className="w-full max-w-sm rounded-lg border border-passport-gold/50 bg-passport-paper p-6 text-center shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Delete Travel Info</p>
        <h2 className="mt-3 text-2xl font-black text-passport-navy">정말 삭제할까요?</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-passport-ink/70">
          {countryName} 조사한 국가가 완전히 삭제됩니다. 삭제한 내용은 되돌릴 수 없습니다.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="h-11 rounded-md border border-passport-blue/20 font-black text-passport-blue transition hover:bg-passport-blue/10">
            아니오
          </button>
          <button type="button" onClick={onConfirm} className="h-11 rounded-md bg-red-600 font-black text-white shadow transition hover:bg-red-700">
            예
          </button>
        </div>
      </section>
    </div>
  );
}

function TravelHeader({ countryName, title }: { countryName: string; title: string }) {
  return (
    <header>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Travel Info</p>
      <h1 className="mt-2 text-3xl font-black text-passport-navy">{countryName} 조사한 국가</h1>
      <p className="mt-2 text-base font-black text-passport-blue">{title}</p>
      <p className="mt-3 text-sm font-bold leading-7 text-passport-ink/72">이 나라를 여행한다고 상상하며 필요한 정보를 준비하세요.</p>
    </header>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block rounded-md border border-passport-blue/15 bg-white/62 p-2.5">
      <span className="text-sm font-black text-passport-blue">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-md border border-passport-blue/15 bg-passport-paper px-2.5 text-sm font-bold text-passport-ink outline-none transition placeholder:text-passport-ink/35 focus:border-passport-blue"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
}) {
  return (
    <label className="flex min-h-0 flex-col rounded-md border border-passport-blue/15 bg-white/62 p-2.5">
      <span className="text-sm font-black text-passport-blue">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-1.5 min-h-0 w-full flex-1 resize-none rounded-md border border-passport-blue/15 bg-passport-paper p-2.5 text-sm font-bold leading-5 text-passport-ink outline-none transition placeholder:text-passport-ink/35 focus:border-passport-blue"
      />
    </label>
  );
}

function ImageUrlField({
  label,
  value,
  onChange,
  uploadType,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  uploadType: "flag" | "map";
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError("");
      const imageUrl = uploadType === "flag" ? await uploadFlagImage(file) : await uploadMapImage(file);
      onChange(imageUrl);
    } catch (error) {
      console.error("Failed to upload travel image.", { uploadType, error });
      setUploadError("이미지 업로드에 실패했습니다. 다시 선택해 주세요.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex min-h-0 flex-col rounded-md border border-passport-blue/15 bg-white/62 p-2.5">
      <label className="block">
        <span className="text-sm font-black text-passport-blue">{label}</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="mt-1.5 h-9 w-full rounded-md border border-passport-blue/15 bg-passport-paper px-2.5 text-xs font-bold text-passport-ink outline-none transition placeholder:text-passport-ink/35 focus:border-passport-blue"
        />
      </label>
      {isUploading && <p className="mt-1.5 text-xs font-black text-passport-blue">업로드 중...</p>}
      {uploadError && <p className="mt-1.5 text-xs font-black text-red-600">{uploadError}</p>}
      <div className="mt-2 flex min-h-[120px] flex-1 items-center justify-center overflow-hidden rounded-md border border-dashed border-passport-blue/25 bg-passport-paper/65">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={`${label} 미리보기`} className="h-full w-full object-contain" />
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-black text-passport-ink/35">
            <ImageIcon size={15} />
            이미지 미리보기
          </div>
        )}
      </div>
    </div>
  );
}

function PageNumber({ number }: { number: number }) {
  return <p className="justify-self-center text-base font-black tracking-[0.24em] text-passport-blue/55">- {number} -</p>;
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
