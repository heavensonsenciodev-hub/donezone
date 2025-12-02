"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import signup from "./signupaction";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Client-side validation to avoid an unnecessary server round-trip.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (password !== repeatPassword) {
      e.preventDefault();
      setError("Passwords do not match");
      return;
    }
    // allow submit to server action
    setError(null);
  }

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="w-[500px] h-[630px] p-6 rounded-lg drop-shadow-xl bg-fantasy">
        <div className="flex justify-center pb-6">
          <Image src="/logo.png" alt="logo" width={200} height={50} />
        </div>
        <div className="flex justify-center mt-2">
          <h1 className='font-bold text-lg'>Create your account</h1>
        </div>

        <form action={signup} className="flex flex-col gap-4 mt-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <label htmlFor="email" className="font-medium text-lg">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white p-2 rounded-md"
          />

          <label htmlFor="fullname" className="font-medium text-lg">Fullname</label>
          <input
            id="fullname"
            name="fullname"
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            required
            className="bg-white p-2 rounded-md"
          />

          <label htmlFor="password" className="font-medium text-lg">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-white p-2 rounded-md"
          />

          <label htmlFor="repeatPassword" className="font-medium text-lg">Repeat Password</label>
          <input
            id="repeatPassword"
            name="repeatPassword"
            type="password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            required
            minLength={6}
            className="bg-white p-2 rounded-md"
          />

          <div className="flex justify-end gap-2 mt-3">
            <a onClick={() => router.push('login')} className='cursor-pointer flex items-center text-lg text-strongblue hover:underline'>Back to login</a>
            <button
              formAction={signup}
              className="bg-shipgrey text-white px-4 py-2 rounded-md w-36 cursor-pointer"
            >
              Signup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}