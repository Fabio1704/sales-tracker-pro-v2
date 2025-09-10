"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Copy, Send, Mail, User, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  timestamp: string
  read: boolean
}

interface InvitationModalProps {
  message: ContactMessage
  onClose: () => void
}

export default function InvitationModal({ message, onClose }: InvitationModalProps) {
  const { token, refreshToken: refreshTokenFn } = useAuth()
  const [customMessage, setCustomMessage] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isCreated, setIsCreated] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState("")
  const [invitationId, setInvitationId] = useState<number | null>(null)
  const [error, setError] = useState("")

  const createInvitation = async () => {
    setError('')
    setIsCreating(true)
    setInvitationUrl('')

    try {
      console.log('=== Frontend: Création invitation ===')
      console.log('Message:', message)
      
      console.log('Token depuis AuthContext:', token ? 'Présent' : 'Absent')
      console.log('Tokens dans localStorage:', {
        access_token: localStorage.getItem('access_token') ? 'Présent' : 'Absent',
        authToken: localStorage.getItem('authToken') ? 'Présent' : 'Absent',
        token: localStorage.getItem('token') ? 'Présent' : 'Absent'
      })
      
      // Utiliser le token du contexte d'auth en priorité
      let authToken = token || localStorage.getItem('authToken') || localStorage.getItem('access_token')
      
      if (!authToken) {
        setError('Token d\'authentification manquant. Veuillez vous reconnecter.')
        setIsCreating(false)
        return
      }

      const requestBody = {
        contact_name: message.name,
        contact_email: message.email,
        contact_subject: message.subject,
        contact_message: message.message,
        invitation_type: 'email'
      }
      console.log('Corps de la requête:', requestBody)

      const response = await fetch('https://sales-tracker-pro-v2.onrender.com/api/accounts/create-contact-invitation/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Réponse status:', response.status)
      console.log('Réponse headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('Données reçues:', data)

      // Si le token est invalide, essayer de le rafraîchir
      if (response.status === 401 && data.code === 'token_not_valid') {
        console.log('Token invalide, tentative de rafraîchissement...')
        try {
          authToken = await refreshTokenFn()
          
          // Refaire la requête avec le nouveau token
          const retryResponse = await fetch('https://sales-tracker-pro-v2.onrender.com/api/accounts/create-contact-invitation/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestBody)
          })
          
          const retryData = await retryResponse.json()
          
          if (retryResponse.ok && retryData.success) {
            setInvitationUrl(retryData.invitation_url)
            setInvitationId(retryData.invitation_id)
            setIsCreated(true)
          } else {
            throw new Error(retryData.error || 'Erreur lors de la création de l\'invitation')
          }
          
        } catch (refreshError) {
          console.error('Erreur lors du rafraîchissement du token:', refreshError)
          setError('Session expirée. Veuillez vous reconnecter.')
          setIsCreating(false)
          return
        }
      } else if (response.ok && data.success) {
        setInvitationUrl(data.invitation_url)
        setInvitationId(data.invitation_id)
        setIsCreated(true)
        
        // Afficher un message différent si l'invitation existait déjà
        if (data.existing) {
          console.log('Invitation existante réutilisée')
        }
      } else {
        console.error('Erreur serveur:', data)
        setError(data.error || data.details || 'Erreur lors de la création de l\'invitation')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsCreating(false)
    }
  }

  const sendInvitation = async () => {
    try {
      // Utiliser le même token que pour create-invitation
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('access_token')
      
      if (!authToken) {
        setError('Token d\'authentification manquant pour l\'envoi.')
        return
      }

      const response = await fetch('/api/accounts/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          invitation_id: invitationId,
          custom_message: customMessage
        })
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response text:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          console.error('Error data:', errorData)
          setError(errorData.error || errorData.details || 'Erreur lors de l\'envoi')
        } catch (e) {
          setError(`Erreur ${response.status}: ${errorText}`)
        }
        return
      }

      const data = await response.json()

      if (data.success) {
        alert('Invitation envoyée avec succès !')
        onClose()
      } else {
        setError(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err)
      // En cas d'erreur d'envoi, afficher le lien pour partage manuel
      if (invitationUrl) {
        setError(`Erreur d'envoi email. Lien d'invitation disponible ci-dessous pour partage manuel.`)
      } else {
        setError('Erreur de connexion')
      }
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.origin + invitationUrl)
    alert('Lien copié dans le presse-papiers !')
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Créer une invitation client
              </CardTitle>
              <CardDescription>
                Générer un lien d'inscription sécurisé pour ce contact
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informations du contact */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations du contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Nom</Label>
                <p className="font-medium">{message.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {message.email}
                </p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Sujet</Label>
                <p className="font-medium">{message.subject}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Message</Label>
                <p className="text-sm bg-background p-3 rounded border">
                  {message.message}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(message.timestamp)}
                </p>
              </div>
            </div>
          </div>

          {/* Message personnalisé */}
          {!isCreated && (
            <div className="space-y-3">
              <Label htmlFor="customMessage">Message personnalisé (optionnel)</Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Ajoutez un message personnel à inclure dans l'invitation..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Ce message sera inclus dans l'email d'invitation envoyé au client.
              </p>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Erreur</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Invitation créée */}
          {isCreated && invitationUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Invitation créée avec succès !</h4>
                  <p className="text-sm text-green-700">
                    Le lien d'inscription sécurisé a été généré pour {message.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Lien d'invitation</Label>
                <div className="flex gap-2">
                  <Input
                    value={window.location.origin + invitationUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button onClick={copyToClipboard} variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">Expire dans 7 jours</Badge>
                  <span>•</span>
                  <span>Page masquée accessible uniquement par ce lien</span>
                </div>
              </div>
            </div>
          )}

          {/* Sécurité */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              🛡️ Sécurité avancée incluse
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Validation Gmail ultra-stricte</li>
              <li>✅ Mots de passe sécurisés obligatoires</li>
              <li>✅ Authentification Firebase intégrée</li>
              <li>✅ Lien unique à usage unique</li>
              <li>✅ Expiration automatique après 7 jours</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {!isCreated ? (
              <>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={createInvitation} 
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Créer l'invitation
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Fermer
                </Button>
                <Button onClick={sendInvitation} className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer par email
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
