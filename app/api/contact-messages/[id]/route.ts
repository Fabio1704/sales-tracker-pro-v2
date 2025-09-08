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

async function getMessages(): Promise<ContactMessage[]> {
  try {
    const fileContent = await fs.readFile(messagesFile, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    return []
  }
}

async function saveMessages(messages: ContactMessage[]): Promise<void> {
  await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier les permissions superuser
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/`, {
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
    
    if (!userData.is_superuser) {
      return NextResponse.json(
        { error: 'Accès refusé - Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const messageId = parseInt(params.id)
    const body = await request.json()
    
    const messages = await getMessages()
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    
    if (messageIndex === -1) {
      return NextResponse.json(
        { error: 'Message non trouvé' },
        { status: 404 }
      )
    }
    
    // Mettre à jour le message
    messages[messageIndex] = { ...messages[messageIndex], ...body }
    await saveMessages(messages)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier les permissions superuser
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/`, {
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
    
    if (!userData.is_superuser) {
      return NextResponse.json(
        { error: 'Accès refusé - Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const messageId = parseInt(params.id)
    
    const messages = await getMessages()
    const filteredMessages = messages.filter(msg => msg.id !== messageId)
    
    if (messages.length === filteredMessages.length) {
      return NextResponse.json(
        { error: 'Message non trouvé' },
        { status: 404 }
      )
    }
    
    await saveMessages(filteredMessages)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
