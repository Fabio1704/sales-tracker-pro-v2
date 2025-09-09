"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Eye, Trash2, MessageCircle, Calendar, User, RefreshCw, Moon, Sun, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "next-themes"
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
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [showInvitationModal, setShowInvitationModal] = useState(false)
  const [invitationMessage, setInvitationMessage] = useState<ContactMessage | null>(null)

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (!user?.is_staff && user?.username !== 'fabio') {
      router.push('/dashboard')
      return
    }
    loadMessages()
  }, [user, router])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch('https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (messageId: number) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/${messageId}/mark_read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, read: true } : msg
          )
        )
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    }
  }

  const deleteMessage = async (messageId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/${messageId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
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

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const unreadCount = messages.filter(msg => !msg.read).length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Apple-Style Dynamic Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/50"></div>
        
        {/* Floating gradient orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            left: '10%',
            top: '20%'
          }}
        ></div>
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-float-delayed"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            right: '10%',
            top: '10%'
          }}
        ></div>
        <div 
          className="absolute w-80 h-80 rounded-full opacity-25 blur-3xl animate-float-slow"
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            left: '60%',
            bottom: '20%'
          }}
        ></div>
        <div 
          className="absolute w-72 h-72 rounded-full opacity-20 blur-3xl animate-float-reverse"
          style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            left: '20%',
            bottom: '10%'
          }}
        ></div>
        
        {/* Interactive mesh gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-gradient-x"></div>
        </div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-grid-move"></div>
      </div>

      {/* Fixed Apple-Style Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-700/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin')} 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 rounded-full px-4 py-2 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Retour Admin</span>
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10 rounded-full px-4 py-2 backdrop-blur-sm">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{unreadCount}</span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 dark:from-white dark:via-green-200 dark:to-emerald-200 bg-clip-text text-transparent">
                  Messages de Contact
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gestion des demandes clients
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleTheme}
              className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0 rounded-full w-10 h-10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button 
              onClick={loadMessages} 
              variant="outline" 
              size="icon"
              className="rounded-full w-10 h-10 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border-gray-200/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 pt-24 pb-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 dark:from-white dark:via-green-200 dark:to-emerald-200 bg-clip-text text-transparent">
            Centre de Messages
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Gérez efficacement toutes les demandes de contact de vos clients
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Aucun message</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Aucun message de contact n'a été reçu pour le moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Liste des messages */}
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-green-800 dark:from-white dark:to-green-200 bg-clip-text text-transparent">
                  Messages reçus
                </h2>
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10 rounded-full px-3 lg:px-4 py-2 backdrop-blur-sm w-fit">
                  <span className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {messages.length} message{messages.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              {messages
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((message) => (
                <div
                  key={message.id}
                  className={`group relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                    selectedMessage?.id === message.id ? 'ring-2 ring-blue-500 shadow-blue-500/25' : ''
                  } ${!message.read ? 'border-l-4 border-l-blue-500' : ''}`}
                  onClick={() => {
                    setSelectedMessage(message)
                    if (!message.read) {
                      markAsRead(message.id)
                    }
                  }}
                >
                  <div className="p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <User className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm lg:text-base truncate">{message.name}</span>
                            {!message.read && (
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full w-fit">
                                Nouveau
                              </div>
                            )}
                          </div>
                          <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
                            {message.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 rounded-full px-2 lg:px-3 py-1 w-fit">
                        <Calendar className="h-3 w-3" />
                        <span className="hidden sm:inline">{formatDate(message.timestamp)}</span>
                        <span className="sm:hidden">{new Date(message.timestamp).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm lg:text-base truncate">
                      {message.subject}
                    </h3>
                    <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Détail du message sélectionné */}
            <div className="xl:sticky xl:top-28">
              {selectedMessage ? (
                <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl overflow-hidden">
                  <div className="p-4 lg:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Mail className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                            {selectedMessage.subject}
                          </h3>
                          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 truncate">
                            De: {selectedMessage.name} ({selectedMessage.email})
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMessage(selectedMessage.id)}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-6 bg-gray-100/50 dark:bg-gray-800/50 rounded-full px-3 lg:px-4 py-2 w-fit">
                      <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span className="hidden sm:inline">Reçu le {formatDate(selectedMessage.timestamp)}</span>
                      <span className="sm:hidden">{new Date(selectedMessage.timestamp).toLocaleDateString('fr-FR')}</span>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-gray-200/30 dark:border-gray-700/30 mb-6">
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white text-sm lg:text-base">Message:</h4>
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm lg:text-base">
                        {selectedMessage.message}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => {
                          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedMessage.email)}&su=${encodeURIComponent(`Re: ${selectedMessage.subject}`)}`
                          window.open(gmailUrl, '_blank')
                        }}
                        variant="outline"
                        className="flex-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/30 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-xl py-2 lg:py-3 text-sm lg:text-base transition-all duration-300 hover:scale-105"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Répondre par Gmail</span>
                        <span className="sm:hidden">Gmail</span>
                      </Button>
                      <Button 
                        onClick={() => openInvitationModal(selectedMessage)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl py-2 lg:py-3 text-sm lg:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Inviter à s'inscrire</span>
                        <span className="sm:hidden">Inviter</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl p-8 lg:p-12 text-center">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Eye className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sélectionnez un message</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-base lg:text-lg">
                    <span className="hidden sm:inline">Cliquez sur un message à gauche pour voir les détails.</span>
                    <span className="sm:hidden">Cliquez sur un message pour voir les détails.</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal d'invitation */}
      {showInvitationModal && invitationMessage && (
        <InvitationModal 
          message={invitationMessage} 
          onClose={closeInvitationModal} 
        />
      )}
    </div>
  )
}
