import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Récupérer le token d'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Faire la requête vers le backend Django
    const djangoResponse = await fetch('http://localhost:8000/api/accounts/send-invitation/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    console.log('Réponse Django status:', djangoResponse.status)
    console.log('Réponse Django headers:', Object.fromEntries(djangoResponse.headers.entries()))

    // Vérifier le content-type de la réponse
    const contentType = djangoResponse.headers.get('content-type')
    console.log('Content-Type Django:', contentType)
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await djangoResponse.text()
      console.log('Réponse Django (HTML/Text):', textResponse.substring(0, 500))
      
      return NextResponse.json(
        { 
          error: 'Réponse Django invalide',
          details: `Django a retourné du HTML au lieu de JSON. Status: ${djangoResponse.status}`,
          response_preview: textResponse.substring(0, 200)
        },
        { status: 502 }
      )
    }

    const data = await djangoResponse.json()
    console.log('Données Django:', data)

    if (!djangoResponse.ok) {
      console.log('Erreur Django:', data)
      return NextResponse.json(data, { status: djangoResponse.status })
    }

    console.log('Succès - retour des données')
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur API send-invitation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
