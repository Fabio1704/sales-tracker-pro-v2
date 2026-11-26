import { NextRequest, NextResponse } from 'next/server'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://sales-tracker-pro-v2.onrender.com/api'

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json()

    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(`${API_BASE_URL}/accounts/contact-messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: body.name,
          email: body.email,
          subject: body.subject,
          message: body.message,
          created_at: new Date().toISOString(),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('Erreur backend contact:', response.status, errorText)
        return NextResponse.json(
          { error: 'Erreur lors de la sauvegarde du message' },
          { status: response.status >= 500 ? 502 : response.status }
        )
      }
    } catch (dbError: any) {
      clearTimeout(timeoutId)
      console.error('Erreur connexion backend contact:', dbError)
      const isTimeout = dbError?.name === 'AbortError'
      return NextResponse.json(
        {
          error: isTimeout
            ? 'Le serveur met trop de temps à répondre, veuillez réessayer.'
            : 'Impossible de contacter le serveur',
        },
        { status: isTimeout ? 504 : 502 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Message envoyé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur API contact:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
