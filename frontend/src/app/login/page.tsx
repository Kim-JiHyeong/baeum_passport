"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoginFailureModal } from "@/components/passport/LoginFailureModal";
import { login } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginFailureModal, setShowLoginFailureModal] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setShowLoginFailureModal(false);
      await login(id, password);
      router.push("/worldmap");
    } catch (error) {
      console.error("Failed to login.", error);
      setShowLoginFailureModal(true);
    }
  }

  return (
    <main className="paper-surface flex h-screen items-center justify-center overflow-hidden p-5">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-passport-blue/20 bg-white/80 p-7 shadow-passport">
        <Link href="/" className="text-sm font-bold text-passport-blue">
          배움여권
        </Link>
        <h1 className="mt-5 text-3xl font-black text-passport-navy">로그인</h1>
        <p className="mt-2 text-sm text-passport-ink/65">더미 계정으로 바로 세계여행을 시작할 수 있습니다.</p>
        <label className="mt-7 block text-sm font-bold text-passport-ink">
          ID
          <input
            value={id}
            onChange={(event) => setId(event.target.value)}
            className="mt-2 h-12 w-full rounded-md border border-passport-blue/20 bg-white px-3 outline-none focus:border-passport-blue"
            placeholder="학교 이름 + 학년 + 반 + 번호 + 이름"
          />
        </label>
        <label className="mt-4 block text-sm font-bold text-passport-ink">
          비밀번호
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="mt-2 h-12 w-full rounded-md border border-passport-blue/20 bg-white px-3 outline-none focus:border-passport-blue"
            placeholder="학년 + 반 + 번호"
          />
        </label>
        <button className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-passport-blue font-bold text-white transition hover:bg-passport-navy">
          <LogIn size={18} />
          로그인하고 입장
        </button>
        <Link href="/signup" className="mt-4 block text-center text-sm font-semibold text-passport-stamp">
          아직 여권이 없다면 회원가입
        </Link>
      </form>
      {showLoginFailureModal && <LoginFailureModal onClose={() => setShowLoginFailureModal(false)} />}
    </main>
  );
}
