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
    // Vérifier si l'utilisateur est un superuser
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Vérifier le token JWT pour déterminer si c'est un superuser
    const token = authHeader.replace('Bearer ', '')
    
    // Appel à l'API Django pour vérifier les permissions
    const backendResponse = await fetch(`https://sales-tracker-pro-v2.onrender.com/api/accounts/users/me/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const userData = await backendResponse.json()
    
    // Seuls les superusers peuvent accéder aux messages
    if (!userData.is_superuser) {
      return NextResponse.json(
        { error: 'Accès refusé - Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const messages = await getMessages()
    console.log(`📧 Messages chargés: ${messages.length} (après nettoyage automatique)`)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Erreur lors de la lecture des messages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la lecture des messages' },
      { status: 500 }
    )
  }
}
