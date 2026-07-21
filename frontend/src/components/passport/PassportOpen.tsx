import { ArrowLeft, Globe2 } from "lucide-react";
import type { PassportMode } from "@/app/page";
import { LoginForm } from "@/components/passport/LoginForm";
import { SignupForm } from "@/components/passport/SignupForm";

type PassportOpenProps = {
  mode: PassportMode;
  onModeChange: (mode: PassportMode | null) => void;
};

export function PassportOpen({ mode, onModeChange }: PassportOpenProps) {
  return (
    <section className="passport-book-open passport-soft-enter" aria-label="펼쳐진 배움여권">
      <div className="passport-page passport-page-left">
        <div className="passport-open-content">
          <button
            type="button"
            onClick={() => onModeChange(null)}
            className="mb-5 inline-flex h-10 items-center gap-2 rounded-md border border-passport-blue/20 px-3 text-sm font-bold text-passport-blue transition hover:bg-passport-blue/10"
          >
            <ArrowLeft size={16} />
            표지로
          </button>

          <div className="relative flex min-h-0 flex-1 flex-col justify-between overflow-hidden">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-passport-stamp">
                Learning Passport
              </p>
              <h2 className="mt-3 text-3xl font-black text-passport-navy">세계 여행 준비</h2>
              <p className="mt-4 max-w-sm leading-7 text-passport-ink/72">
                여권을 펼치고 입국심사, 여행한 국가, 사증 도장을 차례로 모아 보세요.
              </p>
            </div>

            <div className="passport-map-watermark">
              <Globe2 size={150} />
            </div>

            <div className="relative z-10 rounded-lg border border-passport-blue/15 bg-white/45 p-5">
              <div className="h-px w-full bg-passport-blue/20" />
              <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-passport-blue/55">
                Passport No. BAEUM-001
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-passport-ink/62">
                로그인하거나 새 여권을 만들면 세계지도에서 여행을 시작할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="passport-page passport-page-right">
        <div className="passport-open-content">
          <div className="mb-5 flex rounded-md border border-passport-blue/15 bg-white/55 p-1">
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className={`h-10 flex-1 rounded px-3 text-sm font-black transition ${
                mode === "login" ? "bg-passport-blue text-white shadow" : "text-passport-blue hover:bg-passport-blue/10"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => onModeChange("signup")}
              className={`h-10 flex-1 rounded px-3 text-sm font-black transition ${
                mode === "signup" ? "bg-passport-blue text-white shadow" : "text-passport-blue hover:bg-passport-blue/10"
              }`}
            >
              회원가입
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {mode === "login" ? <LoginForm /> : <SignupForm />}
          </div>
        </div>
      </div>
    </section>
  );
}
