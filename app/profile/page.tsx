"use client"

import { useState } from "react"
import Link from "next/link"
import { User, Mail, Phone, MapPin, Lock, LogOut, Edit2, Check, X, Shield, Download, Trash2, Menu } from "lucide-react"

interface UserProfile {
  name: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
  bloodType: string
  emergencyContact: string
  emergencyPhone: string
}

interface Settings {
  emailNotifications: boolean
  appointmentReminders: boolean
  documentAlerts: boolean
  marketingEmails: boolean
  twoFactorAuth: boolean
  dataSharing: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "1990-05-15",
    address: "123 Main Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    bloodType: "O+",
    emergencyContact: "Jane Doe",
    emergencyPhone: "+1 (555) 987-6543",
  })

  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    appointmentReminders: true,
    documentAlerts: true,
    marketingEmails: false,
    twoFactorAuth: false,
    dataSharing: true,
  })

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedProfile, setEditedProfile] = useState(profile)
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "security">("profile")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveProfile = () => {
    setProfile(editedProfile)
    setIsEditingProfile(false)
  }

  const handleCancelEdit = () => {
    setEditedProfile(profile)
    setIsEditingProfile(false)
  }

  const toggleSetting = (setting: keyof Settings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MD</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Nirogya</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Home
              </Link>
              <Link href="/upload" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Upload
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/appointments"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                Appointments
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
            <div className="md:hidden pb-4 space-y-2">
              <Link href="/" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                Home
              </Link>
              <Link
                href="/upload"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Upload
              </Link>
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/appointments"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Appointments
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{profile.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{profile.email}</p>
              </div>

              <div className="space-y-2 mb-6">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full px-4 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
                    activeTab === "profile" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full px-4 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
                    activeTab === "settings" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Preferences
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full px-4 py-2 rounded-lg transition-colors text-left text-sm font-medium ${
                    activeTab === "security" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Security
                </button>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Profile Information</h1>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                      Personal Information
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            value={editedProfile.name}
                            onChange={(e) => handleProfileChange("name", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">{profile.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        {isEditingProfile ? (
                          <input
                            type="date"
                            value={editedProfile.dateOfBirth}
                            onChange={(e) => handleProfileChange("dateOfBirth", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                            {profile.dateOfBirth}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                        {isEditingProfile ? (
                          <select
                            value={editedProfile.bloodType}
                            onChange={(e) => handleProfileChange("bloodType", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          >
                            <option>O+</option>
                            <option>O-</option>
                            <option>A+</option>
                            <option>A-</option>
                            <option>B+</option>
                            <option>B-</option>
                            <option>AB+</option>
                            <option>AB-</option>
                          </select>
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                            {profile.bloodType}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                      Contact Information
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        {isEditingProfile ? (
                          <input
                            type="email"
                            value={editedProfile.email}
                            onChange={(e) => handleProfileChange("email", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {profile.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        {isEditingProfile ? (
                          <input
                            type="tel"
                            value={editedProfile.phone}
                            onChange={(e) => handleProfileChange("phone", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {profile.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Address</h2>
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            value={editedProfile.address}
                            onChange={(e) => handleProfileChange("address", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {profile.address}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            value={editedProfile.city}
                            onChange={(e) => handleProfileChange("city", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">{profile.city}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            value={editedProfile.state}
                            onChange={(e) => handleProfileChange("state", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">{profile.state}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            value={editedProfile.zipCode}
                            onChange={(e) => handleProfileChange("zipCode", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">{profile.zipCode}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                      Emergency Contact
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                        {isEditingProfile ? (
                          <input
                            type="text"
                            value={editedProfile.emergencyContact}
                            onChange={(e) => handleProfileChange("emergencyContact", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                            {profile.emergencyContact}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                        {isEditingProfile ? (
                          <input
                            type="tel"
                            value={editedProfile.emergencyPhone}
                            onChange={(e) => handleProfileChange("emergencyPhone", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium">
                            {profile.emergencyPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditingProfile && (
                    <div className="flex gap-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Notification Preferences</h1>

                <div className="space-y-4">
                  {[
                    {
                      key: "emailNotifications",
                      title: "Email Notifications",
                      description: "Receive email updates about your account",
                    },
                    {
                      key: "appointmentReminders",
                      title: "Appointment Reminders",
                      description: "Get reminders before your scheduled appointments",
                    },
                    {
                      key: "documentAlerts",
                      title: "Document Alerts",
                      description: "Receive alerts when new documents are available",
                    },
                    {
                      key: "marketingEmails",
                      title: "Marketing Emails",
                      description: "Receive promotional offers and updates",
                    },
                    {
                      key: "dataSharing",
                      title: "Data Sharing",
                      description: "Allow sharing of anonymized health data for research",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <button
                        onClick={() => toggleSetting(item.key as keyof Settings)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          settings[item.key as keyof Settings] ? "bg-gray-900" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            settings[item.key as keyof Settings] ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Security Settings</h1>

                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="w-5 h-5 text-gray-900" />
                      <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                    </div>
                    <p className="text-gray-600 mb-4">Update your password to keep your account secure</p>
                    <button className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium text-sm">
                      Change Password
                    </button>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-900" />
                        <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
                      </div>
                      <button
                        onClick={() => toggleSetting("twoFactorAuth")}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          settings.twoFactorAuth ? "bg-gray-900" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            settings.twoFactorAuth ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-gray-600">
                      {settings.twoFactorAuth
                        ? "Two-factor authentication is enabled"
                        : "Add an extra layer of security to your account"}
                    </p>
                  </div>

                  {/* Active Sessions */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Current Session</p>
                          <p className="text-sm text-gray-600">Chrome on macOS</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Data & Privacy */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h2>
                    <div className="space-y-3">
                      <button className="w-full px-4 py-2 text-left border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-gray-700 font-medium text-sm flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download Your Data
                      </button>
                      <button className="w-full px-4 py-2 text-left border border-red-300 hover:bg-red-50 rounded-lg transition-colors text-red-600 font-medium text-sm flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
