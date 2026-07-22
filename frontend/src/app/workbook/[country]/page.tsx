"use client";

import { ArrowLeft, ArrowRight, BookOpen, BookOpenCheck, ChevronLeft, Compass, Globe2, ImageIcon, MapPinned, Stamp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { LogoutBookmark } from "@/components/passport/LogoutBookmark";
import { ApiError } from "@/lib/api/apiClient";
import { countryPath, findCountry, isWorkbookEligibleCountry, representativeCountries, workbookCountries, type RepresentativeCountry } from "@/lib/countries";
import { getCountryIdByName } from "@/lib/api/country";
import { uploadFlagImage, uploadMapImage } from "@/lib/api/upload";
import { completeWorkbook as completeWorkbookApi, getWorkbook, saveWorkbook } from "@/lib/api/workbook";
import type { WorkbookRecord } from "@/lib/storage";

const continentOptions = ["아시아", "유럽", "북아메리카", "남아메리카", "아프리카", "오세아니아"];

const emptyRecord: WorkbookRecord = {
  capital: "",
  language: "",
  population: "",
  area: "",
  populationComparison: "",
  areaComparison: "",
  flagImage: "",
  mapImage: "",
  flagObservation: "",
  continent: "",
  mapLocation: "",
  greeting: "",
  researchTopic: "",
  similarityWithKorea: "",
  differenceFromKorea: "",
  question: "",
  sources: "",
};

const requiredWorkbookFields: Array<{ field: keyof WorkbookRecord; label: string }> = [
  { field: "capital", label: "수도" },
  { field: "language", label: "사용 언어" },
  { field: "population", label: "인구" },
  { field: "populationComparison", label: "대한민국 대비 인구" },
  { field: "area", label: "면적" },
  { field: "areaComparison", label: "대한민국 대비 면적" },
  { field: "flagImage", label: "국기 이미지" },
  { field: "flagObservation", label: "국기 관찰 내용" },
  { field: "mapImage", label: "지도 이미지" },
  { field: "continent", label: "어느 대륙에 속하나요?" },
  { field: "mapLocation", label: "세계 속 위치" },
  { field: "greeting", label: "현지 인사말" },
  { field: "researchTopic", label: "대표 조사 주제" },
  { field: "similarityWithKorea", label: "대한민국과 비슷한 점" },
  { field: "differenceFromKorea", label: "대한민국과 다른 점" },
];

export default function WorkbookPage({ params }: { params: { country: string } }) {
  const router = useRouter();
  const countryName = decodeURIComponent(params.country);
  const country = findCountry(countryName);
  const isEligibleCountry = country ? isWorkbookEligibleCountry(country) : false;
  const bookmarkCountry = useMemo(() => (country && isEligibleCountry ? country : workbookCountries[0] ?? representativeCountries[0]), [country, isEligibleCountry]);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [record, setRecord] = useState<WorkbookRecord>(emptyRecord);
  const recordRef = useRef<WorkbookRecord>(emptyRecord);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [completionError, setCompletionError] = useState("");
  const [isImmigrationRequired, setIsImmigrationRequired] = useState(false);
  const [showAlreadyStampedModal, setShowAlreadyStampedModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (country && !isWorkbookEligibleCountry(country)) {
      router.replace("/workbook");
      return;
    }

    async function loadWorkbook() {
      const nextCountryId = await getCountryIdByName(countryName);
      if (!isMounted || !nextCountryId) return;

      setCountryId(nextCountryId);
      const result = await getWorkbook(nextCountryId);
      if (!isMounted) return;
      const loadedRecord = { ...emptyRecord, ...result.record };
      recordRef.current = loadedRecord;
      setRecord(loadedRecord);
      setIsCompleted(result.completed);
    }

    loadWorkbook().catch((error) => {
      console.error("Failed to load workbook.", { countryName, error });
      if (isMounted) {
        if (error instanceof ApiError && error.status === 403) {
          setIsImmigrationRequired(true);
          return;
        }
        recordRef.current = emptyRecord;
        setRecord(emptyRecord);
        setCompletionError("여행한 국가 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [country, countryName, router]);

  async function resolveCountryId() {
    let resolvedCountryId = countryId;
    if (!resolvedCountryId) {
      resolvedCountryId = await getCountryIdByName(countryName, true);
      if (resolvedCountryId) {
        setCountryId(resolvedCountryId);
      }
    }

    if (!resolvedCountryId) {
      console.error("Cannot save workbook because countryId was not resolved.", { countryName });
      setCompletionError("국가 정보를 찾지 못해 여행한 국가를 저장할 수 없습니다. 새로고침 후 다시 시도해 주세요.");
      return null;
    }

    return resolvedCountryId;
  }

  async function saveCurrentRecord(nextRecord = recordRef.current) {
    setCompletionError("");
    const resolvedCountryId = await resolveCountryId();
    if (!resolvedCountryId) return null;
    await saveWorkbook(resolvedCountryId, nextRecord);
    return resolvedCountryId;
  }

  function updateField(field: keyof WorkbookRecord, value: string) {
    setRecord((current) => {
      const nextRecord = { ...current, [field]: value };
      recordRef.current = nextRecord;
      return nextRecord;
    });
  }

  async function handlePreviousSpread() {
    try {
      const savedCountryId = await saveCurrentRecord();
      if (!savedCountryId) return;
      setCurrentSpread((spread) => Math.max(0, spread - 1));
    } catch (error) {
      console.error("Failed to save workbook before moving to previous spread.", { countryName, countryId, error });
      setCompletionError("여행한 국가 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function handleNextSpread() {
    try {
      const savedCountryId = await saveCurrentRecord();
      if (!savedCountryId) return;
      setCurrentSpread((spread) => Math.min(2, spread + 1));
    } catch (error) {
      console.error("Failed to save workbook before moving to next spread.", { countryName, countryId, error });
      setCompletionError("여행한 국가 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function handleWorkbookNavigation(event: MouseEvent<HTMLAnchorElement>, href: string, saveBeforeNavigate = true) {
    event.preventDefault();

    try {
      if (saveBeforeNavigate) {
        const savedCountryId = await saveCurrentRecord();
        if (!savedCountryId) return;
      }
      router.push(href);
    } catch (error) {
      console.error("Failed to save workbook before navigation.", { countryName, countryId, href, error });
      setCompletionError("여행한 국가 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function completeWorkbook() {
    try {
      setCompletionError("");

      if (isCompleted) {
        setShowAlreadyStampedModal(true);
        return;
      }

      const currentRecord = recordRef.current;
      const missing = requiredWorkbookFields.filter(({ field }) => !currentRecord[field].trim()).map(({ label }) => label);

      if (missing.length > 0) {
        setMissingFields(missing);
        return;
      }

      const resolvedCountryId = await saveCurrentRecord(currentRecord);
      if (!resolvedCountryId) return;
      await completeWorkbookApi(resolvedCountryId);
      setIsCompleted(true);
      router.push("/stamp");
    } catch (error) {
      console.error("Failed to complete workbook.", { countryName, countryId, error });
      setCompletionError("여행한 국가 완료 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  if (!country || !isEligibleCountry) {
    return (
      <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
        <section className="passport-book-open passport-soft-enter passport-explorer-book workbook-book" aria-label="여행한 국가 오류">
          <div className="passport-page passport-page-left">
            <div className="passport-open-content justify-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Workbook</p>
              <h1 className="mt-3 text-3xl font-black text-passport-navy">여행한 국가를 찾을 수 없습니다</h1>
              <p className="mt-4 leading-7 text-passport-ink/72">국가 선택 화면으로 돌아가 다시 선택해 주세요.</p>
            </div>
          </div>
          <div className="passport-page passport-page-right">
            <div className="passport-open-content justify-center">
              <Link
                href="/workbook"
                onClick={(event) => handleWorkbookNavigation(event, "/workbook", false)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-passport-navy px-5 font-black text-white shadow transition hover:bg-passport-blue"
              >
                <ArrowLeft size={18} />
                국가 선택으로 돌아가기
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (isImmigrationRequired) {
    return (
      <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
        <section className="passport-book-open passport-soft-enter passport-explorer-book workbook-book" aria-label={`${country.name} 입국심사 필요`}>
          <PassportBookmarks country={bookmarkCountry} onNavigate={(event, href) => handleWorkbookNavigation(event, href, false)} />
          <LogoutBookmark />

          <div className="passport-page passport-page-left">
            <div className="passport-open-content justify-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Immigration Required</p>
              <h1 className="mt-3 text-3xl font-black text-passport-navy">입국심사를 먼저 완료해 주세요</h1>
              <p className="mt-4 leading-7 text-passport-ink/72">
                {country.name} 학습지는 입국심사를 통과한 뒤 작성할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="passport-page passport-page-right">
            <div className="passport-open-content justify-center gap-4">
              <Link
                href={`/immi/${countryPath(country.name)}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-passport-navy px-5 font-black text-white shadow transition hover:bg-passport-blue"
              >
                <Compass size={18} />
                입국심사 하러 가기
              </Link>
              <Link
                href="/workbook"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-passport-blue/20 px-4 font-bold text-passport-blue transition hover:bg-passport-blue/10"
              >
                <ArrowLeft size={17} />
                국가 선택으로 돌아가기
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const isFirstSpread = currentSpread === 0;
  const isLastSpread = currentSpread === 2;

  return (
    <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <section className="passport-book-open passport-soft-enter passport-explorer-book workbook-book" aria-label={`${country.name} 여행한 국가`}>
        <PassportBookmarks country={bookmarkCountry} onNavigate={handleWorkbookNavigation} />
        <LogoutBookmark />

        <div className="passport-page passport-page-left">
          <div key={`left-spread-${currentSpread}`} className="passport-open-content workbook-page-turn">
            {currentSpread === 0 && <BasicInfoPage country={country} record={record} onChange={updateField} onNavigate={handleWorkbookNavigation} />}
            {currentSpread === 1 && <MapLocationPage country={country} record={record} onChange={updateField} onNavigate={handleWorkbookNavigation} />}
            {currentSpread === 2 && <DeepResearchPage country={country} record={record} onChange={updateField} onNavigate={handleWorkbookNavigation} />}
            <PageFooter
              pageNumber={currentSpread === 0 ? 1 : currentSpread === 1 ? 3 : 5}
              side="left"
              previousDisabled={isFirstSpread}
              onPrevious={handlePreviousSpread}
            />
          </div>
        </div>

        <div className="passport-page passport-page-right">
          <div key={`right-spread-${currentSpread}`} className="passport-open-content workbook-page-turn">
            {currentSpread === 0 && <FlagObservationPage record={record} onChange={updateField} />}
            {currentSpread === 1 && <CountryResearchPage record={record} onChange={updateField} />}
            {currentSpread === 2 && <CompletePage onComplete={completeWorkbook} />}
            <PageFooter
              pageNumber={currentSpread === 0 ? 2 : currentSpread === 1 ? 4 : undefined}
              side="right"
              completeLabel={isLastSpread}
              onNext={handleNextSpread}
            />
          </div>
        </div>

        {missingFields.length > 0 && <MissingFieldsModal fields={missingFields} onClose={() => setMissingFields([])} />}
        {completionError && <CompletionErrorModal message={completionError} onClose={() => setCompletionError("")} />}
        {showAlreadyStampedModal && <AlreadyStampedModal countryName={country.name} onClose={() => setShowAlreadyStampedModal(false)} />}
      </section>
    </main>
  );
}

function CompletionErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-passport-navy/30 px-6">
      <section className="w-full max-w-sm rounded-lg border border-passport-gold/50 bg-passport-paper p-6 text-center shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Workbook Error</p>
        <h2 className="mt-3 text-2xl font-black text-passport-navy">스탬프를 받을 수 없습니다</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-passport-ink/70">{message}</p>
        <button type="button" onClick={onClose} className="mt-6 h-11 rounded-md bg-passport-navy px-6 font-black text-white shadow transition hover:bg-passport-blue">
          확인
        </button>
      </section>
    </div>
  );
}

function MissingFieldsModal({ fields, onClose }: { fields: string[]; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-passport-navy/30 px-6">
      <section className="w-full max-w-md rounded-lg border border-passport-gold/50 bg-passport-paper p-6 text-center shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Workbook Check</p>
        <h2 className="mt-3 text-2xl font-black text-passport-navy">아직 입력하지 않은 항목이 있어요</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-passport-ink/70">스탬프를 받으려면 아래 항목을 먼저 채워 주세요.</p>
        <div className="mt-5 max-h-56 overflow-auto rounded-md border border-passport-blue/15 bg-white/62 p-3 text-left">
          <ul className="grid gap-2">
            {fields.map((field) => (
              <li key={field} className="rounded border border-passport-blue/10 bg-passport-paper px-3 py-2 text-sm font-black text-passport-blue">
                {field}
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={onClose} className="mt-6 h-11 rounded-md bg-passport-navy px-6 font-black text-white shadow transition hover:bg-passport-blue">
          확인
        </button>
      </section>
    </div>
  );
}

function AlreadyStampedModal({ countryName, onClose }: { countryName: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-passport-navy/30 px-6">
      <section className="w-full max-w-sm rounded-lg border border-passport-gold/50 bg-passport-paper p-6 text-center shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Stamp Collected</p>
        <h2 className="mt-3 text-2xl font-black text-passport-navy">이미 스탬프를 받았어요</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-passport-ink/70">
          {countryName} 여행한 국가는 이미 완료되어 사증 페이지에 스탬프가 기록되어 있습니다.
        </p>
        <button type="button" onClick={onClose} className="mt-6 h-11 rounded-md bg-passport-navy px-6 font-black text-white shadow transition hover:bg-passport-blue">
          확인
        </button>
      </section>
    </div>
  );
}

function WorkbookPageHeader({
  title,
  subtitle,
  country,
  showBackLink = false,
  onNavigate,
}: {
  pageNumber: number;
  title: string;
  subtitle: string;
  country?: RepresentativeCountry;
  showBackLink?: boolean;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  return (
    <header className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black text-passport-navy">{country ? `${country.name} 여행한 국가` : title}</h1>
        {country && <p className="mt-1 text-base font-black text-passport-blue">{title}</p>}
        <p className="mt-3 text-sm font-bold leading-7 text-passport-ink/72">{subtitle}</p>
      </div>
      {showBackLink ? (
        <Link
          href="/workbook"
          onClick={onNavigate ? (event) => onNavigate(event, "/workbook") : undefined}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-passport-blue/20 px-3 text-sm font-bold text-passport-blue transition hover:bg-passport-blue/10"
        >
          <ChevronLeft size={17} />
          목록
        </Link>
      ) : (
        <BookOpen className="shrink-0 text-passport-blue/25" size={30} />
      )}
    </header>
  );
}

function BasicInfoPage({
  country,
  record,
  onChange,
  onNavigate,
}: {
  country: RepresentativeCountry;
  record: WorkbookRecord;
  onChange: (field: keyof WorkbookRecord, value: string) => void;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  return (
    <>
      <WorkbookPageHeader pageNumber={1} title="국가 기본 정보" subtitle="나라의 핵심 정보를 조사해 여행한 국가 작성칸에 정리하세요." country={country} showBackLink onNavigate={onNavigate} />
      <section className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-3">
        <LargeField label="수도" value={record.capital} onChange={(value) => onChange("capital", value)} placeholder="조사해서 적어 보세요" />
        <LargeField label="사용 언어" value={record.language} onChange={(value) => onChange("language", value)} placeholder="예: 영어, 일본어" />
        <LargeField label="인구" value={record.population} onChange={(value) => onChange("population", value)} placeholder="예: 약 00만 명" />
        <LargeField label="대한민국 대비 인구" value={record.populationComparison} onChange={(value) => onChange("populationComparison", value)} placeholder="예: 약 2배" />
        <LargeField label="면적" value={record.area} onChange={(value) => onChange("area", value)} placeholder="예: 약 00만 km²" />
        <LargeField label="대한민국 대비 면적" value={record.areaComparison} onChange={(value) => onChange("areaComparison", value)} placeholder="예: 약 10배" />
      </section>
    </>
  );
}

function FlagObservationPage({
  record,
  onChange,
}: {
  record: WorkbookRecord;
  onChange: (field: keyof WorkbookRecord, value: string) => void;
}) {
  return (
    <>
      <WorkbookPageHeader pageNumber={2} title="국기 관찰" subtitle="국기 이미지를 보고 색상, 상징, 특징, 인상 깊은 점을 기록하세요." />
      <section className="grid min-h-0 flex-1 grid-rows-[1.15fr_1fr] gap-3">
        <ImageUrlField label="국기 이미지" value={record.flagImage} onChange={(value) => onChange("flagImage", value)} uploadType="flag" previewSize="xl" />
        <TextArea
          label="국기 관찰 내용"
          value={record.flagObservation}
          onChange={(value) => onChange("flagObservation", value)}
          placeholder="색상, 상징, 특징, 인상 깊은 점을 적어 보세요"
          rows={8}
        />
      </section>
    </>
  );
}

function MapLocationPage({
  country,
  record,
  onChange,
  onNavigate,
}: {
  country: RepresentativeCountry;
  record: WorkbookRecord;
  onChange: (field: keyof WorkbookRecord, value: string) => void;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  return (
    <>
      <WorkbookPageHeader pageNumber={3} title="지도와 위치" subtitle="지도에서 나라가 세계 어디에 있는지 찾아보세요." country={country} showBackLink onNavigate={onNavigate} />
      <section className="grid min-h-0 flex-1 grid-rows-[1.25fr_auto_1fr] gap-3">
        <ImageUrlField label="지도 이미지" value={record.mapImage} onChange={(value) => onChange("mapImage", value)} uploadType="map" previewSize="xl" />
        <ContinentSelect value={record.continent} onChange={(value) => onChange("continent", value)} />
        <TextArea
          label="세계 속 위치"
          value={record.mapLocation}
          onChange={(value) => onChange("mapLocation", value)}
          placeholder="주변 바다, 이웃 나라, 대륙 안에서의 위치를 적어 보세요."
          rows={6}
        />
      </section>
    </>
  );
}

function CountryResearchPage({
  record,
  onChange,
}: {
  record: WorkbookRecord;
  onChange: (field: keyof WorkbookRecord, value: string) => void;
}) {
  return (
    <>
      <WorkbookPageHeader pageNumber={4} title="국가 조사와 대한민국 비교" subtitle="조사한 내용을 바탕으로 대한민국과 비교해 보세요." />
      <section className="grid min-h-0 flex-1 grid-rows-[auto_1.5fr_1fr_1fr] gap-3">
        <Field label="현지 인사말" value={record.greeting} onChange={(value) => onChange("greeting", value)} placeholder="현지 언어 인사말" />
        <TextArea
          label="대표 조사 주제"
          value={record.researchTopic}
          onChange={(value) => onChange("researchTopic", value)}
          placeholder="문화, 음식, 관광지, 스포츠, 자연환경, 역사, 경제, 기술 등"
          rows={6}
        />
        <TextArea
          label="대한민국과 비슷한 점"
          value={record.similarityWithKorea}
          onChange={(value) => onChange("similarityWithKorea", value)}
          placeholder="비슷하다고 느낀 점"
          rows={5}
        />
        <TextArea
          label="대한민국과 다른 점"
          value={record.differenceFromKorea}
          onChange={(value) => onChange("differenceFromKorea", value)}
          placeholder="다르다고 느낀 점"
          rows={5}
        />
      </section>
    </>
  );
}

function DeepResearchPage({
  country,
  record,
  onChange,
  onNavigate,
}: {
  country: RepresentativeCountry;
  record: WorkbookRecord;
  onChange: (field: keyof WorkbookRecord, value: string) => void;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  return (
    <>
      <WorkbookPageHeader pageNumber={5} title="심화 탐구" subtitle="더 깊이 알아보고 싶은 내용과 참고한 자료를 정리하세요." country={country} showBackLink onNavigate={onNavigate} />
      <section className="grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-3">
        <TextArea
          label="더 궁금한 점"
          value={record.question}
          onChange={(value) => onChange("question", value)}
          placeholder="더 알아보고 싶은 내용을 조사해 적어보세요"
          rows={9}
        />
        <TextArea
          label="참고한 자료"
          value={record.sources}
          onChange={(value) => onChange("sources", value)}
          placeholder="책, 선생님 자료, 웹사이트 이름 등"
          rows={3}
        />
      </section>
    </>
  );
}

function CompletePage({ onComplete }: { onComplete: () => void }) {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden text-center">
      <div>
        <h2 className="text-3xl font-black text-passport-navy">여행 기록 완료</h2>
        <p className="mt-4 text-sm font-bold leading-6 text-passport-ink/70">
          작성한 내용을 확인했다면 스탬프를 받아 여권에 기록하세요.
        </p>
      </div>
      <div className="passport-map-watermark">
        <Stamp size={150} />
      </div>
      <button
        type="button"
        onClick={onComplete}
        className="relative z-10 mt-14 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-passport-stamp px-5 font-black text-white shadow transition hover:bg-passport-navy"
      >
        <BookOpenCheck size={18} />
        완료하고 스탬프 받기
      </button>
    </section>
  );
}

function LargeField({
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
    <label className="flex min-h-0 flex-col rounded-md border border-passport-blue/15 bg-white/62 p-3">
      <span className="text-base font-black text-passport-blue">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-0 flex-1 rounded-md border border-passport-blue/15 bg-passport-paper px-3 text-base font-bold text-passport-ink outline-none transition placeholder:text-passport-ink/35 focus:border-passport-blue"
      />
    </label>
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
      <span className="text-base font-black text-passport-blue">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-9 w-full rounded-md border border-passport-blue/15 bg-passport-paper px-2.5 text-sm font-bold text-passport-ink outline-none transition placeholder:text-passport-ink/35 focus:border-passport-blue"
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
      <span className="text-base font-black text-passport-blue">{label}</span>
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
  previewSize = "md",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  uploadType: "flag" | "map";
  previewSize?: "md" | "lg" | "xl";
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const previewClass = previewSize === "xl" ? "min-h-[220px] flex-1" : previewSize === "lg" ? "h-32" : "h-20";

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError("");
      const imageUrl = uploadType === "flag" ? await uploadFlagImage(file) : await uploadMapImage(file);
      onChange(imageUrl);
    } catch (error) {
      console.error("Failed to upload workbook image.", { uploadType, error });
      setUploadError("이미지 업로드에 실패했습니다. 다시 선택해 주세요.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex min-h-0 flex-col rounded-md border border-passport-blue/15 bg-white/62 p-2.5">
      <label className="block">
        <span className="text-base font-black text-passport-blue">{label}</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="mt-1.5 h-8 w-full rounded-md border border-passport-blue/15 bg-passport-paper px-2.5 text-xs font-bold text-passport-ink outline-none transition placeholder:text-passport-ink/35 focus:border-passport-blue"
        />
      </label>
      {isUploading && <p className="mt-1.5 text-xs font-black text-passport-blue">업로드 중...</p>}
      {uploadError && <p className="mt-1.5 text-xs font-black text-red-600">{uploadError}</p>}
      <div className={`mt-2 flex items-center justify-center overflow-hidden rounded-md border border-dashed border-passport-blue/25 bg-passport-paper/65 ${previewClass}`}>
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

function ContinentSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-md border border-passport-blue/15 bg-white/62 p-2.5">
      <span className="text-base font-black text-passport-blue">어느 대륙에 속하나요?</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-9 w-full rounded-md border border-passport-blue/15 bg-passport-paper px-2.5 text-sm font-bold text-passport-ink outline-none transition focus:border-passport-blue"
      >
        <option value="">대륙 선택</option>
        {continentOptions.map((continent) => (
          <option key={continent} value={continent}>
            {continent}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageFooter({
  pageNumber,
  side,
  previousDisabled = false,
  completeLabel = false,
  onPrevious,
  onNext,
}: {
  pageNumber?: number;
  side: "left" | "right";
  previousDisabled?: boolean;
  completeLabel?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  return (
    <footer className="mt-3 grid grid-cols-3 items-center">
      <div className="justify-self-start">
        {side === "left" && (
          <button type="button" onClick={onPrevious} disabled={previousDisabled} className="workbook-turn-button disabled:cursor-not-allowed disabled:opacity-35" aria-label="이전 펼침">
            <ArrowLeft size={18} />
          </button>
        )}
      </div>
      <p className="justify-self-center text-base font-black tracking-[0.24em] text-passport-blue/55">
        {pageNumber ? `- ${pageNumber} -` : ""}
      </p>
      <div className="justify-self-end">
        {side === "right" &&
          (completeLabel ? null : (
            <button type="button" onClick={onNext} className="workbook-turn-button" aria-label="다음 펼침">
              <ArrowRight size={18} />
            </button>
          ))}
      </div>
    </footer>
  );
}

function PassportBookmarks({
  country,
  onNavigate,
}: {
  country: RepresentativeCountry;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
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
          <Link key={item.label} href={item.href} onClick={(event) => onNavigate(event, item.href)} className={`passport-bookmark ${item.active ? "is-active" : ""}`}>
            <Icon size={15} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
