"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authApi } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { token, user } = res.data;
      setAuth(token, user);
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/background.jpg')",
      }}
    >
      {/* Overlay biar lebih readable */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* CARD */}
      <div className="relative w-full max-w-md p-8 rounded-2xl bg-white/70 backdrop-blur-lg shadow-2xl">

        {/* LOGO */}
        <div className="text-center mb-6">
          <div className="inline-block p-3 rounded-xl bg-white/60 backdrop-blur-md">
            <Image
              src="/images/logo-smnt.png"
              alt="Logo"
              width={70}
              height={70}
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mt-3">
            Container Tracking
          </h1>
          <p className="text-sm text-gray-600">
            PT Sei Mangkei Nusantara Tiga
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 
              bg-white/90 text-gray-900 placeholder:text-gray-400
              focus:ring-2 focus:ring-blue-500 outline-none text-base transition duration-200"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 
                bg-white/90 text-gray-900 placeholder:text-gray-400
                focus:ring-2 focus:ring-blue-500 outline-none text-base transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition text-base"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

        </form>
      </div>
    </div>
  );
}