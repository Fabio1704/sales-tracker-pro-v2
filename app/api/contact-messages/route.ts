import { NextRequest, NextResponse } from 'next/server'

// Redirection vers le backend Django pour éviter l'erreur 500
export async function GET(request: NextRequest) {
  try {
    // Rediriger vers le backend Django
    const backendUrl = 'https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/'
    
    // Récupérer le token d'autorisation
    const authHeader = request.headers.get('Authorization')
    
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Erreur redirection contact-messages:', error)
    return NextResponse.json(
      { 
        error: 'Service temporairement indisponible',
        redirect: 'https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/'
      },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendUrl = 'https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/'
    
    const authHeader = request.headers.get('Authorization')
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Erreur POST contact-messages:', error)
    return NextResponse.json(
      { 
        error: 'Service temporairement indisponible',
        redirect: 'https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/'
      },
      { status: 503 }
    )
  }
}
