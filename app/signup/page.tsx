"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-[#d4d4c8]/30 shadow-2xl text-center">
            <div className="w-16 h-16 bg-[#a8b5a0]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#a8b5a0]" />
            </div>
            <h2 className="text-3xl font-bold text-[#1a1a1a] mb-4">Account Created!</h2>
            <p className="text-[#6b6b6b] mb-6">
              Please check your email to verify your account before signing in.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-full font-medium transition-all duration-200 shadow-lg"
            >
              Go to Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    )
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
            <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2">Create your account</h2>
            <p className="text-[#6b6b6b]">Join Nirogya to manage your medical documents</p>
          </div>

          {/* Signup Form */}
          <form className="space-y-6" onSubmit={handleSignup}>
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-[#f5f5f0] border border-[#d4d4c8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a8b5a0] focus:border-transparent transition-all"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-[#f5f5f0] border border-[#d4d4c8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a8b5a0] focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                Create Account
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-[#6b6b6b]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#1a1a1a] font-semibold hover:text-[#a8b5a0] transition-colors">
                  Sign in
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
