import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== API Route create-invitation ===')
    
    const body = await request.json()
    console.log('Body reçu:', body)
    
    // Récupérer le token d'authentification
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Token manquant ou invalide')
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    console.log('Token extrait:', token ? 'Présent' : 'Absent')

    // Vérifier si Django est accessible
    console.log('Tentative de connexion à Django...')
    
    const djangoResponse = await fetch('http://localhost:8000/api/accounts/create-invitation/', {
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
    console.error('=== ERREUR API create-invitation ===')
    console.error('Type d\'erreur:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Message:', error instanceof Error ? error.message : String(error))
    console.error('Stack:', error instanceof Error ? error.stack : 'Pas de stack trace')
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
