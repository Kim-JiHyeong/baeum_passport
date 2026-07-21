"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { addUserCountry, getImmigrationStatus, getUserCountries, passImmigration, submitImmigration } from "@/lib/api/immigration";
import { getCountryIdByName } from "@/lib/api/country";
import { countryPath, findCountry, isWorkbookEligibleCountry, workbookCountries, type RepresentativeCountry } from "@/lib/countries";

type ImmigrationQuestion = {
  prompt: string;
  answer: string;
  options: string[];
};

const immigrationBackgrounds = ["/images/immi/happy.png", "/images/immi/bad.png", "/images/immi/angry.png"];
const maxWrongCount = 3;

export default function ImmigrationPage({ params }: { params: { country: string } }) {
  const router = useRouter();
  const countryName = decodeURIComponent(params.country);
  const country = findCountry(countryName);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showRetryBlockedModal, setShowRetryBlockedModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [immigrationError, setImmigrationError] = useState("");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [retryRemainingSeconds, setRetryRemainingSeconds] = useState(0);

  const questions = useMemo(() => (country ? buildImmigrationQuestions(country) : []), [country]);
  const currentQuestion = questions[questionIndex];
  const backgroundImage = immigrationBackgrounds[Math.min(wrongCount, 2)];
  const remainingChances = Math.max(maxWrongCount - wrongCount, 0);

  useEffect(() => {
    if (country && !isWorkbookEligibleCountry(country)) {
      router.replace("/worldmap");
    }
  }, [country, router]);

  useEffect(() => {
    if (!country || !isWorkbookEligibleCountry(country)) return;

    let isMounted = true;

    getCountryIdByName(country.name, true)
      .then(async (nextCountryId) => {
        if (!isMounted) return;
        setCountryId(nextCountryId);

        if (!nextCountryId) return;

        const status = await getImmigrationStatus(nextCountryId);
        if (!isMounted) return;

        if (status.retry_blocked && status.retry_remaining_seconds > 0) {
          setRetryRemainingSeconds(status.retry_remaining_seconds);
          setShowRetryBlockedModal(true);
        }
      })
      .catch((error) => {
        console.error("Failed to load immigration status.", { countryName, error });
      });

    return () => {
      isMounted = false;
    };
  }, [country, countryName]);

  useEffect(() => {
    if (!showRetryBlockedModal || retryRemainingSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRetryRemainingSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showRetryBlockedModal, retryRemainingSeconds]);

  useEffect(() => {
    if (!showRetryBlockedModal || retryRemainingSeconds > 0) return;
    setQuestionIndex(0);
    setWrongCount(0);
    setSelectedAnswer("");
    setShowRetryBlockedModal(false);
    setRetryRemainingSeconds(0);
    setImmigrationError("");
  }, [showRetryBlockedModal, retryRemainingSeconds]);

  function retryImmigration() {
    setQuestionIndex(0);
    setWrongCount(0);
    setSelectedAnswer("");
    setShowRetryBlockedModal(false);
    setRetryRemainingSeconds(0);
    setImmigrationError("");
  }

  async function completeImmigration() {
    if (!country) return;

    try {
      setIsCompleting(true);
      setImmigrationError("");
      const resolvedCountryId = countryId ?? (await getCountryIdByName(country.name, true));

      if (!resolvedCountryId) {
        setImmigrationError("국가 정보를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setIsCompleting(false);
        return;
      }

      const userCountries = await getUserCountries();
      let userCountryId = userCountries.find((userCountry) => userCountry.country_id === resolvedCountryId || userCountry.name === country.name)?.id;

      if (!userCountryId) {
        const addedCountry = await addUserCountry(resolvedCountryId);
        userCountryId = addedCountry.id;
      }

      if (userCountryId == null) {
        throw new Error("User country id was not returned.");
      }

      await passImmigration(userCountryId);
      router.push(`/workbook/${countryPath(country.name)}`);
    } catch (error) {
      console.error("Failed to complete immigration.", { countryName, error });
      setImmigrationError("입국심사 완료 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setIsCompleting(false);
    }
  }

  async function blockRetryAfterFailure() {
    if (!country) return;

    try {
      setIsCompleting(true);
      setImmigrationError("");
      const resolvedCountryId = countryId ?? (await getCountryIdByName(country.name, true));

      if (!resolvedCountryId) {
        setImmigrationError("국가 정보를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setIsCompleting(false);
        return;
      }

      const status = await submitImmigration(resolvedCountryId, 0);
      setRetryRemainingSeconds(status.retry_remaining_seconds || 10 * 60);
      setShowRetryBlockedModal(true);
    } catch (error) {
      console.error("Failed to block immigration retry.", { countryName, error });
      setImmigrationError("입국심사 실패 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleNextQuestion() {
    if (!currentQuestion || !selectedAnswer || showRetryBlockedModal || isCompleting) return;

    if (selectedAnswer !== currentQuestion.answer) {
      const nextWrongCount = wrongCount + 1;
      setWrongCount(nextWrongCount);
      setSelectedAnswer("");

      if (nextWrongCount >= maxWrongCount) {
        await blockRetryAfterFailure();
      }

      return;
    }

    if (questionIndex >= questions.length - 1) {
      await completeImmigration();
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedAnswer("");
  }

  if (!country || !isWorkbookEligibleCountry(country)) {
    return (
      <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-6">
        <section className="w-full max-w-3xl rounded-xl border border-passport-blue/15 bg-passport-paper p-8 text-center shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Immigration Check</p>
          <h1 className="mt-3 text-3xl font-black text-passport-navy">입국심사 대상 국가가 아닙니다</h1>
          <Link
            href="/worldmap"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-passport-navy px-5 font-black text-white shadow transition hover:bg-passport-blue"
          >
            <ArrowLeft size={18} />
            세계지도로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="passport-entry paper-surface flex h-screen items-center justify-center overflow-hidden p-6">
      <section className="relative flex h-[min(920px,calc(100vh-48px))] w-[min(1560px,calc(100vw-64px))] flex-col overflow-hidden rounded-2xl border border-passport-blue/20 bg-passport-paper shadow-2xl">
        <header className="flex items-center justify-between border-b border-passport-blue/15 bg-white/55 px-8 py-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-passport-stamp">Immigration Check</p>
            <h1 className="mt-2 text-4xl font-black text-passport-navy">{country.name} 입국심사</h1>
          </div>
          <Link
            href="/worldmap"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-passport-blue/20 px-4 text-sm font-bold text-passport-blue transition hover:bg-passport-blue/10"
          >
            <ArrowLeft size={17} />
            세계지도
          </Link>
        </header>

        <section
          className="relative min-h-0 flex-1 overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <section className="absolute right-0 top-0 z-10 flex h-full w-[38%] min-w-[460px] items-stretch justify-center">
            <div className="flex h-full w-full flex-col rounded-2xl border border-passport-gold/55 bg-white/95 p-8 text-left shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Question {questionIndex + 1} / {questions.length}</p>
              <p className="mt-4 inline-flex rounded-full border border-passport-blue/20 bg-passport-blue/10 px-4 py-2 text-sm font-black text-passport-blue">
                남은 기회 : {remainingChances}회
              </p>
              <h2 className="mt-3 text-2xl font-black text-passport-navy">문제 {questionIndex + 1} / {questions.length}</h2>
              <p className="mt-7 min-h-[96px] text-xl font-black leading-9 text-passport-ink">{currentQuestion.prompt}</p>

              <div className="mt-6 grid flex-1 content-start gap-4">
                {currentQuestion.options.map((option, index) => {
                  const selected = selectedAnswer === option;

                  return (
                    <button
                      key={`${currentQuestion.prompt}-${option}`}
                      type="button"
                      onClick={() => setSelectedAnswer(option)}
                      className={`flex min-h-14 items-center gap-4 rounded-lg border px-5 py-4 text-left text-base font-black transition ${
                        selected
                          ? "border-passport-gold bg-passport-gold/18 text-passport-navy shadow"
                          : "border-passport-blue/15 bg-white/78 text-passport-ink hover:border-passport-gold hover:bg-passport-gold/10"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-passport-blue/20 bg-passport-paper text-sm text-passport-blue">
                        {index + 1}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {immigrationError && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{immigrationError}</p>}

              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={!selectedAnswer || isCompleting}
                className="mt-7 h-14 w-full rounded-lg bg-passport-blue text-lg font-black text-white shadow transition hover:bg-passport-navy disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isCompleting ? "처리 중" : questionIndex === questions.length - 1 ? "입국심사 완료" : "다음 문제"}
              </button>
            </div>
          </section>

          {showRetryBlockedModal && <ImmigrationRetryBlockedModal remainingSeconds={retryRemainingSeconds} onBack={() => router.push("/worldmap")} />}
        </section>
      </section>
    </main>
  );
}

function ImmigrationRetryBlockedModal({ remainingSeconds, onBack }: { remainingSeconds: number; onBack: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-passport-navy/30 px-6">
      <section className="w-full max-w-sm rounded-lg border border-passport-gold/50 bg-passport-paper p-6 text-center shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">Immigration Failed</p>
        <h2 className="mt-3 text-2xl font-black text-passport-navy">입국 심사 실패</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-passport-ink/70">
          입국심사를 다시 진행할 수 없습니다.
          <br />
          남은 시간 {formatRemainingTime(remainingSeconds)}
        </p>
        <div className="mt-6">
          <button type="button" onClick={onBack} className="h-11 w-full rounded-md border border-passport-blue/20 font-black text-passport-blue transition hover:bg-passport-blue/10">
            뒤로가기
          </button>
        </div>
      </section>
    </div>
  );
}

function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const nextSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(nextSeconds).padStart(2, "0")}`;
}

function buildImmigrationQuestions(country: RepresentativeCountry): ImmigrationQuestion[] {
  return [
    {
      prompt: `${country.name}의 수도는 어디인가요?`,
      answer: country.capital,
      options: buildOptions(country.capital, "capital", country),
    },
    {
      prompt: `${country.name}에서 주로 사용하는 언어는 무엇인가요?`,
      answer: country.language,
      options: buildOptions(country.language, "language", country),
    },
    {
      prompt: `${country.name}의 현지 인사말은 무엇인가요?`,
      answer: country.greeting,
      options: buildOptions(country.greeting, "greeting", country),
    },
  ];
}

function buildOptions(fieldValue: string, field: "capital" | "language" | "greeting", country: RepresentativeCountry) {
  const wrongOptions = workbookCountries
    .filter((candidate) => candidate.name !== country.name)
    .map((candidate) => candidate[field])
    .filter((option) => option && option !== fieldValue);
  return stableShuffle([fieldValue, ...Array.from(new Set(wrongOptions)).slice(0, 3)]);
}

function stableShuffle(options: string[]) {
  return options
    .map((option, index) => ({ option, weight: Array.from(option).reduce((sum, char) => sum + char.charCodeAt(0), index) % 17 }))
    .sort((left, right) => left.weight - right.weight)
    .map(({ option }) => option);
}
