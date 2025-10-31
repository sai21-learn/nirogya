"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import AuthGuard from "@/components/auth-guard"
import { Search, Download, Trash2, Eye, Grid, List, FileText, Share2, Menu, X, LogOut, User, Brain, RefreshCw } from "lucide-react"

interface Document {
  id: string
  user_id: string
  file_name: string
  file_url: string
  file_type: string
  uploaded_at: string
  report_summaries?: {
    id: string
    summary_text: string | null
    processing_status: 'pending' | 'processing' | 'completed' | 'failed'
    error_message: string | null
    created_at: string
  }[]
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [shareToast, setShareToast] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [analyzingFiles, setAnalyzingFiles] = useState<Set<string>>(new Set())

  const categories = ["All", "Lab Results", "Imaging", "Prescriptions", "Reports", "Vaccinations", "Insurance"]

  // Refresh summaries periodically for pending/processing items
  useEffect(() => {
    const hasProcessingSummaries = documents.some(doc => {
      const summary = doc.report_summaries?.[0]
      return summary?.processing_status === 'processing' || summary?.processing_status === 'pending'
    })

    if (hasProcessingSummaries) {
      const interval = setInterval(() => {
        fetchDocuments()
      }, 5000) // Check every 5 seconds

      return () => clearInterval(interval)
    }
  }, [documents])

  const fetchDocuments = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('files')
        .select(`
          id,
          user_id,
          file_name,
          file_url,
          file_type,
          uploaded_at,
          report_summaries (
            id,
            summary_text,
            processing_status,
            error_message,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
      } else {
        setDocuments(data || [])
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchDocuments()
  }, [user])

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const deleteDocument = async (id: string) => {
    try {
      const document = documents.find(doc => doc.id === id)
      if (!document) return

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('uploads')
        .remove([document.file_url])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id)

      if (dbError) {
        console.error('Error deleting file from database:', dbError)
      } else {
        // Update local state
        setDocuments((prev) => prev.filter((doc) => doc.id !== id))
        setSelectedFiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    } catch (err) {
      console.error('Error deleting document:', err)
    }
  }

  const toggleFileSelection = (id: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const deleteSelected = () => {
    selectedFiles.forEach((id) => {
      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    })
    setSelectedFiles(new Set())
  }

  const shareDocument = (docName: string) => {
    const shareText = `Check out this document: ${docName}`

    if (navigator.share) {
      navigator
        .share({
          title: "Nirogya",
          text: shareText,
        })
        .catch(() => {
          copyToClipboard(shareText)
        })
    } else {
      copyToClipboard(shareText)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShareToast("Copied to clipboard!")
      setTimeout(() => setShareToast(null), 2000)
    })
  }

  const handleDownload = async (doc: Document) => {
    try {
      let downloadUrl: string;
      
      if (doc.file_url.startsWith('http')) {
        // If it's already a full URL (public file)
        downloadUrl = doc.file_url;
      } else {
        // For private files, create a signed URL
        const { data, error } = await supabase.storage
          .from('uploads')
          .createSignedUrl(doc.file_url, 3600); // URL expires in 1 hour
        
        if (error) throw error;
        downloadUrl = data.signedUrl;
      }

      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.file_name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      setShareToast('Failed to download file. Please try again.');
    }
  }

  const handleView = async (doc: Document) => {
    try {
      // Get a public URL for viewing the file
      const { data, error } = await supabase.storage
        .from('uploads')
        .createSignedUrl(doc.file_url, 3600) // URL expires in 1 hour
      
      if (error) throw error
      
      // Open the file in a new tab
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Error viewing file:', error)
      setShareToast('Failed to open file. Please try again.')
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const analyzeReport = async (doc: Document) => {
    if (!user) return

    setAnalyzingFiles(prev => new Set(prev).add(doc.id))

    try {
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: doc.id,
          file_path: doc.file_url,
          user_id: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Analysis API error:', errorData)
        setShareToast('Analysis failed. Please try again.')
      } else {
        setShareToast('Analysis started successfully!')
        // Refresh the documents to show updated status
        setTimeout(() => {
          fetchDocuments()
        }, 1000)
      }
    } catch (error) {
      console.error('Error triggering analysis:', error)
      setShareToast('Analysis failed. Please try again.')
    } finally {
      setAnalyzingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(doc.id)
        return newSet
      })
    }
  }

  const getSummaryInfo = (doc: Document) => {
    const summary = doc.report_summaries?.[0]
    if (!summary) {
      return { status: 'pending', text: 'Analysis pending...', icon: '⏳' }
    }

    switch (summary.processing_status) {
      case 'completed':
        return { 
          status: 'completed', 
          text: summary.summary_text || 'No summary available', 
          icon: '✅' 
        }
      case 'processing':
        return { 
          status: 'processing', 
          text: 'Analyzing report...', 
          icon: '🔄' 
        }
      case 'failed':
        return { 
          status: 'failed', 
          text: summary.error_message || 'Analysis failed', 
          icon: '❌' 
        }
      default:
        return { 
          status: 'pending', 
          text: 'Analysis pending...', 
          icon: '⏳' 
        }
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f5f5f0]">
        {/* Loading State */}
        {loading && (
          <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your documents...</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <>
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
                    <Link href="/dashboard" className="text-[#1a1a1a] font-medium text-sm">
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
                    <Link
                      href="/chat"
                      className="text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-sm font-medium"
                    >
                      AI Chat
                    </Link>
                  </div>

                  {/* User Menu */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{user?.email}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
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
                    <Link href="/dashboard" className="block px-4 py-2 text-gray-900 font-medium bg-gray-50 rounded-lg">
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
                      href="/chat"
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      AI Chat
                    </Link>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{user?.email}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-[#1a1a1a] mb-2">My Documents</h1>
                <p className="text-[#6b6b6b]">Manage and organize your medical documents</p>
              </div>

              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 p-6 shadow-lg">
                  <p className="text-[#6b6b6b] text-sm font-medium">Total Documents</p>
                  <p className="text-3xl font-bold text-[#1a1a1a] mt-2">{documents.length}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 p-6 shadow-lg">
                  <p className="text-[#6b6b6b] text-sm font-medium">File Types</p>
                  <p className="text-3xl font-bold text-[#1a1a1a] mt-2">
                    {new Set(documents.map(doc => doc.file_type.split('/')[1] || 'unknown')).size}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 p-6 shadow-lg">
                  <p className="text-[#6b6b6b] text-sm font-medium">Categories</p>
                  <p className="text-3xl font-bold text-[#1a1a1a] mt-2">{categories.length - 1}</p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 p-6 mb-8 shadow-lg">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#f5f5f0] border border-[#d4d4c8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#a8b5a0] transition-all"
                    />
                  </div>

                  {/* View Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-xl transition-colors ${
                        viewMode === "grid" ? "bg-[#1a1a1a] text-white" : "bg-[#e8e8e0] text-[#6b6b6b] hover:bg-[#d4d4c8]"
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-xl transition-colors ${
                        viewMode === "list" ? "bg-[#1a1a1a] text-white" : "bg-[#e8e8e0] text-[#6b6b6b] hover:bg-[#d4d4c8]"
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? "bg-[#1a1a1a] text-white shadow-md"
                          : "bg-[#e8e8e0] text-[#6b6b6b] hover:bg-[#d4d4c8]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedFiles.size > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                  <p className="text-gray-900 font-medium">{selectedFiles.size} file(s) selected</p>
                  <button
                    onClick={deleteSelected}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Delete Selected
                  </button>
                </div>
              )}

              {/* Documents Grid View */}
              {viewMode === "grid" && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-[#a8b5a0]/20 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-[#1a1a1a]" />
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(doc.id)}
                            onChange={() => toggleFileSelection(doc.id)}
                            className="w-5 h-5 rounded border-gray-300 text-gray-900 cursor-pointer"
                          />
                        </div>
                        <h3 className="font-semibold text-[#1a1a1a] mb-1 truncate">{doc.file_name}</h3>
                        <p className="text-sm text-[#6b6b6b] mb-4">{doc.file_type}</p>
                        
                        {/* AI Summary Section */}
                        <div className="mb-4 p-3 bg-[#f5f5f0] rounded-xl border border-[#d4d4c8]/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#1a1a1a]">AI Summary</span>
                              <span className="text-lg">{getSummaryInfo(doc).icon}</span>
                            </div>
                            {(getSummaryInfo(doc).status === 'pending' || getSummaryInfo(doc).status === 'failed') && (
                              <button
                                onClick={() => analyzeReport(doc)}
                                disabled={analyzingFiles.has(doc.id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
                              >
                                {analyzingFiles.has(doc.id) ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Brain className="w-3 h-3" />
                                )}
                                {analyzingFiles.has(doc.id) ? 'Analyzing...' : 'Analyze'}
                              </button>
                            )}
                          </div>
                          <p className={`text-sm ${
                            getSummaryInfo(doc).status === 'completed' 
                              ? 'text-gray-800' 
                              : getSummaryInfo(doc).status === 'failed'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {getSummaryInfo(doc).text}
                          </p>
                        </div>
                                                <div className="flex items-center justify-between mb-4">
                          <span className="text-xs bg-[#e8e8e0] text-[#6b6b6b] px-2 py-1 rounded-full">{doc.file_type.split('/')[1] || 'file'}</span>
                          <span className="text-xs text-[#9b9b9b]">{formatDate(doc.uploaded_at)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleView(doc)}
                            className="flex-1 px-3 py-2 bg-[#e8e8e0] hover:bg-[#d4d4c8] text-[#1a1a1a] rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button 
                            onClick={() => Download(doc)}
                            className="flex-1 px-3 py-2 bg-[#e8e8e0] hover:bg-[#d4d4c8] text-[#1a1a1a] rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button
                            onClick={() => shareDocument(doc.file_name)}
                            className="flex-1 px-3 py-2 bg-[#e8e8e0] hover:bg-[#d4d4c8] text-[#1a1a1a] rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Share
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="px-3 py-2 bg-[#e8e8e0] hover:bg-[#d4d4c8] text-[#1a1a1a] rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents List View */}
              {viewMode === "list" && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#d4d4c8]/30 overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#f5f5f0] border-b border-[#d4d4c8]/30">
                        <tr>
                          <th className="px-6 py-4 text-left">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFiles(new Set(documents.map((d) => d.id)))
                                } else {
                                  setSelectedFiles(new Set())
                                }
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-gray-900 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1a1a1a]">Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1a1a1a]">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1a1a1a]">Size</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1a1a1a]">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-[#1a1a1a]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4d4c8]/30">
                        {filteredDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-[#f5f5f0]/50 transition-colors">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedFiles.has(doc.id)}
                                onChange={() => toggleFileSelection(doc.id)}
                                className="w-5 h-5 rounded border-gray-300 text-gray-900 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-[#1a1a1a] flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="font-medium text-[#1a1a1a]">{doc.file_name}</span>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{getSummaryInfo(doc).icon}</span>
                                    <span className={`text-xs ${
                                      getSummaryInfo(doc).status === 'completed' 
                                        ? 'text-gray-600' 
                                        : getSummaryInfo(doc).status === 'failed'
                                        ? 'text-red-500'
                                        : 'text-gray-500'
                                    }`}>
                                      {getSummaryInfo(doc).status === 'completed' ? 'AI Summary Available' : getSummaryInfo(doc).text}
                                    </span>
                                    {(getSummaryInfo(doc).status === 'pending' || getSummaryInfo(doc).status === 'failed') && (
                                      <button
                                        onClick={() => analyzeReport(doc)}
                                        disabled={analyzingFiles.has(doc.id)}
                                        className="ml-2 flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
                                      >
                                        {analyzingFiles.has(doc.id) ? (
                                          <RefreshCw className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Brain className="w-3 h-3" />
                                        )}
                                        {analyzingFiles.has(doc.id) ? 'Analyzing...' : 'Analyze'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm bg-[#e8e8e0] text-[#6b6b6b] px-2 py-1 rounded-full">{doc.file_type.split('/')[1] || 'file'}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#6b6b6b]">{doc.file_type}</td>
                            <td className="px-6 py-4 text-sm text-[#6b6b6b]">{formatDate(doc.uploaded_at)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-[#e8e8e0] rounded-xl transition-colors text-[#1a1a1a]">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => Download(doc)}
                                  className="p-2 hover:bg-[#e8e8e0] rounded-xl transition-colors text-[#1a1a1a]"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => shareDocument(doc.file_name)}
                                  className="p-2 hover:bg-[#e8e8e0] rounded-xl transition-colors text-[#1a1a1a]"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteDocument(doc.id)}
                                  className="p-2 hover:bg-[#e8e8e0] rounded-xl transition-colors text-[#1a1a1a]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredDocuments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-[#d4d4c8] mx-auto mb-4" />
                  <p className="text-[#6b6b6b] mb-4">No documents found</p>
                  <Link
                    href="/upload"
                    className="inline-block px-6 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-full font-medium transition-all shadow-lg"
                  >
                    Upload Documents
                  </Link>
                </div>
              )}

              {/* Share Toast */}
              {shareToast && (
                <div className="fixed bottom-4 right-4 bg-[#1a1a1a] text-white px-4 py-3 rounded-2xl shadow-2xl">
                  {shareToast}
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </AuthGuard>
  )
}