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
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (!user?.is_staff) return

    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
      // URL WebSocket pour les notifications admin
      const wsUrl = `wss://sales-tracker-pro-v2.onrender.com/ws/admin/notifications/?token=${token}`
      
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket connecté pour les notifications admin')
        setIsConnected(true)
        reconnectAttempts.current = 0
        
        // Envoyer un ping pour maintenir la connexion
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            }))
          } else {
            clearInterval(pingInterval)
          }
        }, 30000) // Ping toutes les 30 secondes
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('📨 Message WebSocket reçu:', message)
          
          setLastMessage(message)

          // Traiter les différents types de messages
          if (message.type === 'notification' && message.data) {
            const notificationData = message.data

            if (notificationData.type === 'user_deleted' && onUserDeleted) {
              console.log('👤 Utilisateur supprimé détecté:', notificationData)
              onUserDeleted(notificationData as UserDeletedData)
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors du parsing du message WebSocket:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket fermé:', event.code, event.reason)
        setIsConnected(false)
        
        // Tentative de reconnexion automatique
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000 // Backoff exponentiel
          console.log(`🔄 Tentative de reconnexion dans ${delay}ms (tentative ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          console.log('❌ Nombre maximum de tentatives de reconnexion atteint')
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error)
        setIsConnected(false)
      }

    } catch (error) {
      console.error('❌ Erreur lors de la création de la connexion WebSocket:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
    reconnectAttempts.current = 0
  }

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible d\'envoyer le message')
    }
  }

  useEffect(() => {
    if (user?.is_staff) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [user?.is_staff])

  // Reconnexion automatique quand la fenêtre reprend le focus
  useEffect(() => {
    const handleFocus = () => {
      if (user?.is_staff && !isConnected) {
        console.log('🔄 Fenêtre active, tentative de reconnexion WebSocket')
        connect()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user?.is_staff, isConnected])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  }
}
