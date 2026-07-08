"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoginFailureModal } from "@/components/passport/LoginFailureModal";
import { login } from "@/lib/api/auth";

export function LoginForm() {
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
    <>
      <form onSubmit={handleSubmit} className="passport-form">
      <div>
        <p className="text-sm font-black text-passport-stamp">Passport Check-in</p>
        <h2 className="mt-2 text-3xl font-black text-passport-navy">로그인</h2>
      </div>

      <label className="block text-sm font-bold text-passport-ink">
        아이디
        <input
          value={id}
          onChange={(event) => setId(event.target.value)}
          className="mt-2 h-12 w-full rounded-md border border-passport-blue/20 bg-passport-paper px-3 outline-none focus:border-passport-blue"
          placeholder="학년 + 반 + 번호 + 이름"
        />
      </label>

      <label className="block text-sm font-bold text-passport-ink">
        비밀번호
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          className="mt-2 h-12 w-full rounded-md border border-passport-blue/20 bg-passport-paper px-3 outline-none focus:border-passport-blue"
          placeholder="학년 + 반 + 번호"
        />
      </label>

      <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-passport-blue font-black text-white shadow transition hover:bg-passport-navy">
        <LogIn size={18} />
        로그인
      </button>
      </form>
      {showLoginFailureModal && <LoginFailureModal onClose={() => setShowLoginFailureModal(false)} />}
    </>
  );
}
