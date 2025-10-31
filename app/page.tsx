"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ArrowRight, CheckCircle2, Users, Zap, Shield } from "lucide-react"

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#d4d4c8]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-lg font-semibold text-[#1a1a1a]">Nirogya</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium">
                Home
              </Link>
              <Link
                href="/dashboard"
                className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link href="/upload" className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium">
                Upload
              </Link>
              <Link
                href="/appointments"
                className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium"
              >
                Appointments
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-full transition-all duration-200 text-sm font-medium shadow-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link href="/" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                Home
              </Link>
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/upload"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Upload
              </Link>
              <Link
                href="/appointments"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Appointments
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 bg-gray-900 text-white rounded-lg transition-colors text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold text-[#1a1a1a] leading-[1.1] tracking-tight">
                LIVE WITH
                <br />
                <span className="text-[#a8b5a0]">HEALTH</span>
              </h1>
              <p className="text-lg text-[#6b6b6b] leading-relaxed max-w-lg">
                Securely manage your health records, upload documents, and book appointments with healthcare providers in one unified platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-full font-medium transition-all duration-300 text-center flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Secure Upload</p>
                  <p className="text-sm text-gray-600">Encrypted storage</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Easy Access</p>
                  <p className="text-sm text-gray-600">Anytime, anywhere</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Smart Search</p>
                  <p className="text-sm text-gray-600">Find documents fast</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">Appointments</p>
                  <p className="text-sm text-gray-600">Book with doctors</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-[#d4d4c8]/50 shadow-2xl">
                <div className="space-y-6">
                  <div className="aspect-square bg-gradient-to-br from-[#a8b5a0]/20 to-[#c8d4c0]/20 rounded-2xl border border-[#d4d4c8]/30 flex items-center justify-center">
                    <div className="text-6xl">🏥</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-[#e8e8e0] rounded-full w-3/4" />
                    <div className="h-3 bg-[#e8e8e0] rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white/40 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">WHY PEOPLE LOVE US</h2>
            <p className="text-lg text-[#6b6b6b]">Everything you need to manage your health documents</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-[#d4d4c8]/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#a8b5a0]/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-[#1a1a1a]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-3 uppercase tracking-wide">Fast Upload</h3>
              <p className="text-[#6b6b6b] leading-relaxed">
                Drag and drop your medical documents. Supports images, PDFs, and more formats.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-[#d4d4c8]/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#a8b5a0]/20 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-[#1a1a1a]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-3 uppercase tracking-wide">Smart Dashboard</h3>
              <p className="text-[#6b6b6b] leading-relaxed">
                View all documents in one place with powerful search and filtering capabilities.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-[#d4d4c8]/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#a8b5a0]/20 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-[#1a1a1a]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-3 uppercase tracking-wide">Secure & Private</h3>
              <p className="text-[#6b6b6b] leading-relaxed">
                Your data is encrypted and protected with enterprise-grade security standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-[#a8b5a0] to-[#8a9d8f] rounded-3xl p-12 md:p-16 text-center shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-white/90 mb-8">Join thousands of users managing their health documents securely</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white hover:bg-[#f5f5f0] text-[#1a1a1a] rounded-full font-semibold transition-all duration-200 shadow-lg"
          >
            Start Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-[#9b9b9b] py-12 border-t border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-gray-900 font-bold text-sm">MD</span>
                </div>
                <span className="text-white font-semibold">Nirogya</span>
              </div>
              <p className="text-sm">Secure medical document management</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Upload
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Appointments
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 Nirogya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
