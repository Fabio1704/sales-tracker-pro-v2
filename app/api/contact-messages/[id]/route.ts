import { NextRequest, NextResponse } from 'next/server'

// Redirection vers le backend Django pour les opérations sur un message spécifique
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const backendUrl = `https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/${id}/mark_read/`
    
    const authHeader = request.headers.get('Authorization')
    
    const response = await fetch(backendUrl, {
      method: 'POST',
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
    console.error('Erreur PATCH contact-messages:', error)
    return NextResponse.json(
      { 
        error: 'Service temporairement indisponible',
        redirect: `https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/`
      },
      { status: 503 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const backendUrl = `https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/${id}/`
    
    const authHeader = request.headers.get('Authorization')
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erreur DELETE contact-messages:', error)
    return NextResponse.json(
      { 
        error: 'Service temporairement indisponible',
        redirect: `https://sales-tracker-pro-v2.onrender.com/api/accounts/contact-messages/`
      },
      { status: 503 }
    )
  }
}
