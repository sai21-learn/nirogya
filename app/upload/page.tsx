"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import AuthGuard from "@/components/auth-guard"
import { Upload, X, File, CheckCircle, AlertCircle, FileText, ImageIcon, Clock, Menu } from "lucide-react"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  progress: number
  status: "uploading" | "success" | "error"
  category: string
  error?: string
}

const categories = [
  { id: "lab-results", label: "Lab Results", icon: "🧪" },
  { id: "imaging", label: "Imaging", icon: "🖼️" },
  { id: "prescriptions", label: "Prescriptions", icon: "💊" },
  { id: "reports", label: "Reports", icon: "📋" },
  { id: "vaccinations", label: "Vaccinations", icon: "💉" },
  { id: "insurance", label: "Insurance", icon: "🛡️" },
]

export default function UploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("lab-results")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      processFiles(selectedFiles)
    }
  }

  const processFiles = (fileList: File[]) => {
    const validFiles = fileList.filter((file) => {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024
    })

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: "uploading",
      category: selectedCategory,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    newFiles.forEach((fileObj) => {
      // Find the original file object
      const originalFile = fileList.find(f => f.name === fileObj.name)
      if (originalFile) {
        uploadFile(originalFile, fileObj.id)
      }
    })
  }

  const uploadFile = async (file: File, fileId: string) => {
    if (!user) return

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${file.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      // Store metadata in database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: uploadData.path,
          file_type: file.type,
        })

      if (dbError) {
        throw dbError
      }

      // Update file status to success
      setFiles((prev) => prev.map((f) => 
        f.id === fileId ? { ...f, progress: 100, status: "success" } : f
      ))

      // Trigger AI analysis for the uploaded file
      await triggerAIAnalysis(uploadData.path, fileId)
    } catch (error) {
      console.error('Upload error:', error)
      setFiles((prev) => prev.map((f) => 
        f.id === fileId ? { ...f, status: "error", error: error instanceof Error ? error.message : "Upload failed" } : f
      ))
    }
  }

  const triggerAIAnalysis = async (filePath: string, fileId: string) => {
    if (!user) return

    try {
      // Get the file record from database to get the report_id
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .select('id')
        .eq('file_url', filePath)
        .eq('user_id', user.id)
        .single()

      if (fileError || !fileRecord) {
        console.error('Error finding file record:', fileError)
        return
      }

      // Call the analysis API
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: fileRecord.id,
          file_path: filePath,
          user_id: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Analysis API error:', errorData)
      } else {
        console.log('AI analysis triggered successfully')
      }
    } catch (error) {
      console.error('Error triggering AI analysis:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <ImageIcon className="w-5 h-5" />
    if (type.includes("pdf")) return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const getCategoryLabel = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.label || categoryId
  }

  const uploadedCount = files.filter((f) => f.status === "success").length
  const uploadingCount = files.filter((f) => f.status === "uploading").length

  function removeFile(id: string): void {
    throw new Error("Function not implemented.")
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f5f5f0]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#d4d4c8]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a1a1a] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-lg font-semibold text-[#1a1a1a]">Nirogya</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium">
                Home
              </Link>
              <Link href="/upload" className="text-[#1a1a1a] font-medium text-sm">
                Upload
              </Link>
              <Link
                href="/dashboard"
                className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/appointments"
                className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium"
              >
                Appointments
              </Link>
              <Link
                href="/chat"
                className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium"
              >
                AI Chat
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
              <Link href="/upload" className="block px-4 py-2 text-gray-900 font-medium bg-gray-50 rounded-lg">
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
              <Link
                href="/chat"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                AI Chat
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1a1a1a] mb-2">Upload Documents</h1>
          <p className="text-[#6b6b6b]">Organize and secure your medical records</p>
        </div>

        {/* Category Selection */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[#1a1a1a] mb-4">Select Document Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-2xl border-2 transition-all text-center ${
                  selectedCategory === category.id
                    ? "border-[#1a1a1a] bg-[#a8b5a0]/10 shadow-md"
                    : "border-[#d4d4c8]/30 bg-white/80 hover:border-[#a8b5a0]"
                }`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <p className="text-xs font-medium text-[#1a1a1a]">{category.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-3xl border-2 border-dashed transition-all duration-200 p-16 text-center cursor-pointer mb-12 ${
            isDragging
              ? "border-[#a8b5a0] bg-[#a8b5a0]/10 scale-105"
              : "border-[#d4d4c8] bg-white/60 hover:border-[#a8b5a0] hover:bg-white/80"
          }`}
        >
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.jpg,.jpeg,.png,.gif"
          />
          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isDragging ? "bg-[#a8b5a0]/30 scale-110" : "bg-[#a8b5a0]/20"
              }`}
            >
              <Upload className={`w-10 h-10 transition-all ${isDragging ? "text-[#1a1a1a]" : "text-[#1a1a1a]"}`} />
            </div>
            <div>
              <p className="text-xl font-semibold text-[#1a1a1a]">
                {isDragging ? "Drop your files here" : "Drag and drop your files here"}
              </p>
              <p className="text-[#6b6b6b] mt-2">or click to browse from your computer</p>
              <p className="text-xs text-[#9b9b9b] mt-3">Supported: PDF, JPG, PNG, GIF (Max 10MB each)</p>
            </div>
          </div>
        </div>

        {/* Upload Stats */}
        {files.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 p-6 shadow-lg">
              <p className="text-[#6b6b6b] text-sm font-medium">Total Files</p>
              <p className="text-3xl font-bold text-[#1a1a1a] mt-2">{files.length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#1a1a1a]" />
                <p className="text-[#6b6b6b] text-sm font-medium">Uploading</p>
              </div>
              <p className="text-3xl font-bold text-[#1a1a1a] mt-2">{uploadingCount}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-[#1a1a1a]" />
                <p className="text-[#6b6b6b] text-sm font-medium">Completed</p>
              </div>
              <p className="text-3xl font-bold text-[#1a1a1a] mt-2">{uploadedCount}</p>
            </div>
          </div>
        )}

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Upload Progress</h2>
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-[#a8b5a0]/20 rounded-xl flex items-center justify-center flex-shrink-0 text-[#1a1a1a]">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[#1a1a1a] truncate">{file.name}</p>
                          <span className="text-xs bg-[#e8e8e0] text-[#6b6b6b] px-2 py-1 rounded-full flex-shrink-0">
                            {getCategoryLabel(file.category)}
                          </span>
                        </div>
                        <p className="text-sm text-[#6b6b6b]">{formatFileSize(file.size)}</p>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {file.status === "success" && <CheckCircle className="w-6 h-6 text-[#a8b5a0]" />}
                      {file.status === "uploading" && (
                        <div className="w-6 h-6 rounded-full border-2 border-[#d4d4c8] border-t-[#1a1a1a] animate-spin" />
                      )}
                      {file.status === "error" && <AlertCircle className="w-6 h-6 text-red-600" />}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-5 h-5 text-gray-600 hover:text-gray-900" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {file.status === "uploading" && (
                    <div className="w-full bg-[#e8e8e0] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#a8b5a0] h-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Status Messages */}
                  {file.status === "success" && (
                    <p className="text-sm text-[#1a1a1a] flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Successfully uploaded
                    </p>
                  )}
                  {file.status === "error" && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {file.error || "Upload failed"}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-full font-medium transition-all duration-200 text-center shadow-lg"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  setFiles([])
                  setSelectedCategory("lab-results")
                }}
                className="px-8 py-3 border-2 border-[#d4d4c8] hover:border-[#a8b5a0] text-[#1a1a1a] rounded-full font-medium transition-all duration-200 hover:bg-white/80"
              >
                Upload More Files
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#6b6b6b] text-lg">
              No files uploaded yet. Start by selecting a category and dragging files above.
            </p>
          </div>
        )}
      </main>
      </div>
    </AuthGuard>
  )
}
