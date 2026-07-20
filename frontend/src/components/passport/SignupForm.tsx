"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { signup } from "@/lib/api/auth";
import { AvatarSelector } from "@/components/passport/AvatarSelector";

export function SignupForm() {
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
    <form onSubmit={handleSubmit} className="passport-form scroll-area pr-1">
      <div>
        <p className="text-sm font-black text-passport-stamp">New Passport</p>
        <h2 className="mt-2 text-3xl font-black text-passport-navy">회원가입</h2>
      </div>

      <AvatarSelector gender={form.gender} value={form.avatar} onChange={(value) => updateField("avatar", value)} />

      <label className="block text-sm font-bold text-passport-ink">
        학교 이름
        <input
          value={form.schoolName}
          onChange={(event) => updateField("schoolName", event.target.value)}
          className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 bg-passport-paper px-3 outline-none focus:border-passport-blue"
          placeholder="예: 경기동산초"
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["grade", "학년"],
          ["classNumber", "반"],
          ["studentNumber", "번호"],
        ].map(([field, label]) => (
          <label key={field} className="block text-sm font-bold text-passport-ink">
            {label}
            <input
              value={form[field as keyof typeof form]}
              onChange={(event) => updateField(field as keyof typeof form, event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 bg-passport-paper px-3 outline-none focus:border-passport-blue"
            />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm font-bold text-passport-ink">
          성
          <input
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 bg-passport-paper px-3 outline-none focus:border-passport-blue"
          />
        </label>
        <label className="block text-sm font-bold text-passport-ink">
          이름
          <input
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 bg-passport-paper px-3 outline-none focus:border-passport-blue"
          />
        </label>
        <label className="block text-sm font-bold text-passport-ink">
          성별
          <select
            value={form.gender}
            onChange={(event) => updateField("gender", event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-passport-blue/20 bg-passport-paper px-3 outline-none focus:border-passport-blue"
          >
            <option>선택 안 함</option>
            <option>남</option>
            <option>여</option>
          </select>
        </label>
      </div>

      <button className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-passport-blue font-black text-white shadow transition hover:bg-passport-navy">
        <UserPlus size={18} />
        회원가입
      </button>
    </form>
  );
}
