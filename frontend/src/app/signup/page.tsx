"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { AvatarSelector } from "@/components/passport/AvatarSelector";
import { signup } from "@/lib/api/auth";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    schoolName: "",
    grade: "",
    classNumber: "",
    studentNumber: "",
    lastName: "",
    firstName: "",
    gender: "선택 안 함",
    avatar: "",
  });

  const updateField = useCallback((field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signup(form);
    router.push("/worldmap");
  }

  return (
    <main className="paper-surface flex h-screen items-center justify-center overflow-hidden p-5">
      <form onSubmit={handleSubmit} className="scroll-area max-h-full w-full max-w-2xl rounded-lg border border-passport-blue/20 bg-white/82 p-7 shadow-passport">
        <Link href="/" className="text-sm font-bold text-passport-blue">
          배움여권
        </Link>
        <h1 className="mt-5 text-3xl font-black text-passport-navy">회원가입</h1>
        <div className="mt-7">
          <AvatarSelector gender={form.gender} value={form.avatar} onChange={(value) => updateField("avatar", value)} />
        </div>
        <label className="mt-7 block text-sm font-bold">
          학교 이름
          <input
            value={form.schoolName}
            onChange={(event) => updateField("schoolName", event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 px-3 outline-none focus:border-passport-blue"
            placeholder="예: 경기동산초"
          />
        </label>
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["grade", "학년"],
            ["classNumber", "반"],
            ["studentNumber", "번호"],
          ].map(([field, label]) => (
            <label key={field} className="block text-sm font-bold">
              {label}
              <input
                value={form[field as keyof typeof form]}
                onChange={(event) => updateField(field as keyof typeof form, event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 px-3 outline-none focus:border-passport-blue"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            성
            <input value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 px-3 outline-none focus:border-passport-blue" />
          </label>
          <label className="block text-sm font-bold">
            이름
            <input value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 px-3 outline-none focus:border-passport-blue" />
          </label>
          <label className="block text-sm font-bold">
            성별
            <select value={form.gender} onChange={(event) => updateField("gender", event.target.value)} className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 px-3 outline-none focus:border-passport-blue">
              <option>선택 안 함</option>
              <option>남</option>
              <option>여</option>
            </select>
          </label>
        </div>
        <button className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-passport-blue font-bold text-white transition hover:bg-passport-navy">
          <UserPlus size={18} />
          여권 만들기
        </button>
      </form>
    </main>
  );
}
