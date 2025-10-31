"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-[#d4d4c8]/30 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-2xl font-bold text-[#1a1a1a]">Nirogya</span>
            </Link>
            <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2">Welcome back</h2>
            <p className="text-[#6b6b6b]">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f0] border border-[#d4d4c8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a8b5a0] focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-[#f5f5f0] border border-[#d4d4c8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a8b5a0] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:bg-[#9b9b9b] text-white rounded-full font-medium transition-all duration-200 shadow-lg"
            >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-[#6b6b6b]">
                Don't have an account?{" "}
                <Link href="/signup" className="text-[#1a1a1a] font-semibold hover:text-[#a8b5a0] transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link href="/" className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
