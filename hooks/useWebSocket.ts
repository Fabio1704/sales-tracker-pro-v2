import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface WebSocketMessage {
  type: string
  data: any
}

interface UserDeletedData {
  type: 'user_deleted'
  user_id: string
  user_email: string
  user_name: string
  timestamp: string
}

export const useWebSocket = (onUserDeleted?: (data: UserDeletedData) => void) => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastCheckRef = useRef<string>('')

  // Utiliser polling au lieu de WebSocket car Render ne supporte pas les WebSockets
  const startPolling = () => {
    if (!user?.is_staff) return

    console.log('🔄 Démarrage du polling pour synchronisation admin')
    setIsConnected(true)

    const pollForUpdates = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        // Vérifier les mises à jour via l'API
        const response = await fetch('https://sales-tracker-pro-v2.onrender.com/api/accounts/users/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const currentUsers = await response.json()
          const currentUserIds = currentUsers.map((u: any) => u.id).sort().join(',')
          
          if (lastCheckRef.current && lastCheckRef.current !== currentUserIds) {
            console.log('🔄 Changement détecté dans la liste des utilisateurs')
            // Simuler une notification de suppression
            if (onUserDeleted) {
              // Trouver les utilisateurs supprimés
              const previousIds = lastCheckRef.current.split(',')
              const currentIds = currentUserIds.split(',')
              const deletedIds = previousIds.filter(id => !currentIds.includes(id) && id !== '')
              
              if (deletedIds.length > 0) {
                deletedIds.forEach(deletedId => {
                  onUserDeleted({
                    type: 'user_deleted',
                    user_id: deletedId,
                    user_email: 'utilisateur.supprime@example.com',
                    user_name: 'Utilisateur supprimé',
                    timestamp: new Date().toISOString()
                  })
                })
              }
            }
          }
          
          lastCheckRef.current = currentUserIds
        }
      } catch (error) {
        console.error('❌ Erreur lors du polling:', error)
      }
    }

    // Polling initial
    pollForUpdates()
    
    // Polling désactivé - synchronisation WebSocket uniquement
    // pollingIntervalRef.current = setInterval(pollForUpdates, 5000) as unknown as NodeJS.Timeout
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    setIsConnected(false)
    console.log('⏹️ Arrêt du polling')
  }

  const sendMessage = (message: any) => {
    console.log('📤 Message envoyé (polling mode):', message)
  }

  useEffect(() => {
    if (user?.is_staff) {
      startPolling()
    }

    return () => {
      stopPolling()
    }
  }, [user?.is_staff])

  // Reconnexion automatique quand la fenêtre reprend le focus
  useEffect(() => {
    const handleFocus = () => {
      if (user?.is_staff && !isConnected) {
        console.log('🔄 Fenêtre active, redémarrage du polling')
        startPolling()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user?.is_staff, isConnected])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect: startPolling,
    disconnect: stopPolling
  }
}
