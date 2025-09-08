"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Mail, Send, Loader2, UserPlus } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface InvitationModalProps {
  onInvitationSent?: () => void
}

export default function InvitationModal({ onInvitationSent }: InvitationModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    contact_name: "",
    contact_email: "",
    contact_subject: "",
    contact_message: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await fetch('http://localhost:8000/api/accounts/send-invitation/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Invitation envoyée avec succès !')
        setFormData({
          contact_name: "",
          contact_email: "",
          contact_subject: "",
          contact_message: ""
        })
        
        // Fermer le modal après 2 secondes
        setTimeout(() => {
          setOpen(false)
          setSuccess(null)
          onInvitationSent?.()
        }, 2000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de l\'invitation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      contact_name: "",
      contact_email: "",
      contact_subject: "",
      contact_message: ""
    })
    setError(null)
    setSuccess(null)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Inviter un client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer une invitation
          </DialogTitle>
          <DialogDescription>
            Invitez un nouveau client à créer son compte sur la plateforme.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="contact_name">Nom du client</Label>
              <Input
                id="contact_name"
                name="contact_name"
                type="text"
                placeholder="Ex: Jean Dupont"
                value={formData.contact_name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="contact_email">Email du client</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="client@example.com"
                value={formData.contact_email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="contact_subject">Sujet de l'invitation</Label>
              <Input
                id="contact_subject"
                name="contact_subject"
                type="text"
                placeholder="Ex: Invitation à rejoindre Sales Tracker Pro"
                value={formData.contact_subject}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="contact_message">Message personnalisé (optionnel)</Label>
              <Textarea
                id="contact_message"
                name="contact_message"
                placeholder="Ajoutez un message personnalisé pour votre client..."
                value={formData.contact_message}
                onChange={handleInputChange}
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
