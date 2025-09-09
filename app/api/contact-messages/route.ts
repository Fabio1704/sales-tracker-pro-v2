import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  timestamp: string
  read: boolean
}

const messagesFile = path.join(process.cwd(), 'contact-messages.json')

async function cleanOldMessages(messages: ContactMessage[]): Promise<ContactMessage[]> {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  
  return messages.filter(message => {
    const messageDate = new Date(message.timestamp)
    return messageDate > threeDaysAgo
  })
}

async function getMessages(): Promise<ContactMessage[]> {
  try {
    const fileContent = await fs.readFile(messagesFile, 'utf8')
    let messages = JSON.parse(fileContent)
    
    // Nettoyer les messages de plus de 3 jours
    const cleanedMessages = await cleanOldMessages(messages)
    
    // Sauvegarder si des messages ont été supprimés
    if (cleanedMessages.length !== messages.length) {
      await saveMessages(cleanedMessages)
    }
    
    return cleanedMessages
  } catch (error) {
    // Le fichier n'existe pas encore
    return []
  }
}

async function saveMessages(messages: ContactMessage[]): Promise<void> {
  await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2))
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Début de la requête GET /api/contact-messages')
    
    // Vérifier si l'utilisateur est un superuser
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Auth header présent:', !!authHeader)
    
    if (!authHeader) {
      console.log('❌ Pas d\'en-tête d\'autorisation')
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Vérifier le token JWT pour déterminer si c'est un superuser
    const token = authHeader.replace('Bearer ', '')
    console.log('🎫 Token extrait, longueur:', token.length)
    
    // Appel à l'API Django pour vérifier les permissions
    console.log('🌐 Appel à l\'API Django pour vérification...')
    try {
      const backendResponse = await fetch(`https://sales-tracker-pro-v2.onrender.com/api/accounts/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 Réponse Django status:', backendResponse.status)

      if (!backendResponse.ok) {
        console.log('❌ Réponse Django non OK')
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 401 }
        )
      }

      const userData = await backendResponse.json()
      console.log('👤 Données utilisateur:', { username: userData.username, is_superuser: userData.is_superuser })
      
      // Seuls les superusers peuvent accéder aux messages
      if (!userData.is_superuser) {
        console.log('🚫 Utilisateur n\'est pas superuser')
        return NextResponse.json(
          { error: 'Accès refusé - Permissions insuffisantes' },
          { status: 403 }
        )
      }
    } catch (fetchError) {
      console.error('🔥 Erreur lors de l\'appel Django:', fetchError)
      return NextResponse.json(
        { error: 'Erreur de connexion au backend' },
        { status: 500 }
      )
    }

    console.log('📂 Chargement des messages...')
    const messages = await getMessages()
    console.log(`📧 Messages chargés: ${messages.length} (après nettoyage automatique)`)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('💥 Erreur générale lors de la lecture des messages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la lecture des messages', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
