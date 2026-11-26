"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Mail,
  Eye,
  Trash2,
  MessageCircle,
  Calendar,
  User,
  RefreshCw,
  UserPlus,
  Search,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { AppSidebar } from "@/components/app-sidebar"
import InvitationModal from "./components/InvitationModal"

interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  timestamp: string
  read: boolean
}

export default function ContactMessagesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [showInvitationModal, setShowInvitationModal] = useState(false)
  const [invitationMessage, setInvitationMessage] = useState<ContactMessage | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!user?.is_staff && user?.username !== "fabio") {
      router.push("/dashboard")
      return
    }
    loadMessages()
  }, [user, authLoading, router])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("authToken")
      const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://sales-tracker-pro-v2.onrender.com/api"
      const response = await fetch(
        `${apiBase}/accounts/contact-messages/list/`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setMessages(data || [])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (messageId: number) => {
    try {
      const token = localStorage.getItem("authToken")
      const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://sales-tracker-pro-v2.onrender.com/api"
      const response = await fetch(
        `${apiBase}/accounts/contact-messages/${messageId}/read/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg))
        )
      }
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error)
    }
  }

  const deleteMessage = async (messageId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return
    try {
      const token = localStorage.getItem("authToken")
      const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://sales-tracker-pro-v2.onrender.com/api"
      const response = await fetch(
        `${apiBase}/accounts/contact-messages/${messageId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  const openInvitationModal = (message: ContactMessage) => {
    setInvitationMessage(message)
    setShowInvitationModal(true)
  }

  const closeInvitationModal = () => {
    setShowInvitationModal(false)
    setInvitationMessage(null)
  }

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const unreadCount = messages.filter((msg) => !msg.read).length

  const filteredMessages = messages
    .filter((msg) => {
      const q = search.toLowerCase()
      return (
        !q ||
        msg.name?.toLowerCase().includes(q) ||
        msg.email?.toLowerCase().includes(q) ||
        msg.subject?.toLowerCase().includes(q) ||
        msg.message?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#111827] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500 dark:text-green-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111827] flex">
      <AppSidebar unreadMessages={unreadCount} />

      <div className="flex-1 min-w-0 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-white/5 flex items-center gap-4 px-6 py-3">
          <div className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un message..."
              className="pl-9 bg-slate-100 dark:bg-[#1a1f2e] border-slate-200 dark:border-white/10 text-slate-900 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus-visible:ring-green-500/30 h-9 text-sm rounded-lg"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={loadMessages}
              disabled={isLoading}
              className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Messages de Contact
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-500 mt-0.5">
                {messages.length} message(s) • {unreadCount} non lu(s)
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-500">Total messages</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{messages.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-500">Non lus</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{unreadCount}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-500">Lus</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {messages.length - unreadCount}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {filteredMessages.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 py-20 text-center">
              <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-7 w-7 text-slate-400 dark:text-gray-600" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-1">
                {search ? "Aucun résultat" : "Aucun message"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-gray-500">
                {search
                  ? `Aucun message ne correspond à "${search}"`
                  : "Aucun message de contact n'a été reçu pour le moment."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Liste des messages */}
              <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Boîte de réception ({filteredMessages.length})
                  </h2>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-white/5 max-h-[650px] overflow-y-auto">
                  {filteredMessages.map((message) => {
                    const isSelected = selectedMessage?.id === message.id
                    return (
                      <div
                        key={message.id}
                        onClick={() => {
                          setSelectedMessage(message)
                          if (!message.read) markAsRead(message.id)
                        }}
                        className={`p-4 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-green-500/10 dark:bg-green-500/10"
                            : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                        } ${!message.read ? "border-l-2 border-l-green-500" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                  {message.name}
                                </span>
                                {!message.read && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-600 dark:text-green-400">
                                    Nouveau
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-gray-500 truncate">
                                {message.email}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1 flex-shrink-0">
                            <Calendar className="h-3 w-3" />
                            {new Date(message.timestamp).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-gray-200 truncate mb-0.5">
                          {message.subject}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2">
                          {message.message}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Détail du message */}
              <div className="xl:sticky xl:top-20 h-fit">
                {selectedMessage ? (
                  <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-6 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {selectedMessage.subject}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-gray-400 truncate">
                            De : {selectedMessage.name} ({selectedMessage.email})
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMessage(selectedMessage.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:text-gray-500 dark:hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 rounded-full px-3 py-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Reçu le {formatDate(selectedMessage.timestamp)}
                    </div>

                    <div className="bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-white/5 p-4">
                      <p className="text-xs font-medium text-slate-500 dark:text-gray-500 mb-2 uppercase tracking-wider">
                        Message
                      </p>
                      <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-gray-300 leading-relaxed">
                        {selectedMessage.message}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                            selectedMessage.email
                          )}&su=${encodeURIComponent(`Re: ${selectedMessage.subject}`)}`
                          window.open(gmailUrl, "_blank")
                        }}
                        className="flex-1 border-slate-200 dark:border-white/10 bg-transparent text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Répondre par Gmail
                      </Button>
                      <Button
                        onClick={() => openInvitationModal(selectedMessage)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Inviter à s'inscrire
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Eye className="h-6 w-6 text-slate-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-1">
                      Sélectionnez un message
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-500">
                      Cliquez sur un message à gauche pour voir les détails.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showInvitationModal && invitationMessage && (
        <InvitationModal message={invitationMessage} onClose={closeInvitationModal} />
      )}
    </div>
  )
}
