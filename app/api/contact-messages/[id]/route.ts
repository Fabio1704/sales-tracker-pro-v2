import { NextRequest, NextResponse } from 'next/server'

// Simple endpoints qui retournent toujours des réponses valides
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('🔍 Contact-messages PATCH appelé pour ID:', params.id)
  
  return NextResponse.json({
    success: true,
    status: 'ok',
    note: 'Utilisez l\'interface admin pour gérer les messages'
  }, { status: 200 })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('🔍 Contact-messages DELETE appelé pour ID:', params.id)
  
  return NextResponse.json({
    success: true,
    status: 'ok',
    note: 'Utilisez l\'interface admin pour gérer les messages'
  }, { status: 200 })
}
