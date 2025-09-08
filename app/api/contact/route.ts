import { NextRequest, NextResponse } from 'next/server'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json()
    
    // Validation des données
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    // Ici vous pouvez choisir l'une des options suivantes :

    // OPTION 1: Sauvegarder en base de données (si vous avez une table contact_messages)
    /*
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact-messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: body.name,
          email: body.email,
          subject: body.subject,
          message: body.message,
          created_at: new Date().toISOString()
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde en base')
      }
    } catch (dbError) {
      console.error('Erreur base de données:', dbError)
      // Continuer avec l'envoi d'email même si la DB échoue
    }
    */

    // OPTION 2: Envoyer par email (exemple avec un service d'email)
    // Vous devrez configurer un service comme SendGrid, Nodemailer, etc.
    /*
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // ou votre service email
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'contact@salestrackerpro.com',
      subject: `[Contact] ${body.subject}`,
      html: `
        <h3>Nouveau message de contact</h3>
        <p><strong>Nom:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Sujet:</strong> ${body.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${body.message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Envoyé depuis Sales Tracker Pro</small></p>
      `
    })
    */

    // OPTION 3: Log dans la console (pour développement)
    console.log(`📧 Nouveau message de contact reçu:`)
    console.log('='.repeat(50))
    console.log(`Nom: ${body.name}`)
    console.log(`Email: ${body.email}`)
    console.log(`Sujet: ${body.subject}`)
    console.log(`Message: ${body.message}`)
    console.log(`Date: ${new Date().toLocaleString('fr-FR')}`)
    console.log('='.repeat(50))

    // OPTION 4: Sauvegarder dans un fichier JSON local (pour développement)
    const fs = require('fs').promises
    const path = require('path')
    
    try {
      const messagesFile = path.join(process.cwd(), 'contact-messages.json')
      let messages = []
      
      try {
        const fileContent = await fs.readFile(messagesFile, 'utf8')
        messages = JSON.parse(fileContent)
        
        // Nettoyer les messages de plus de 3 jours avant d'ajouter le nouveau
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        
        messages = messages.filter((msg: any) => {
          const messageDate = new Date(msg.timestamp)
          return messageDate > threeDaysAgo
        })
        
      } catch (error) {
        // Le fichier n'existe pas encore, on commence avec un tableau vide
      }
      
      messages.push({
        id: Date.now(),
        name: body.name,
        email: body.email,
        subject: body.subject,
        message: body.message,
        timestamp: new Date().toISOString(),
        read: false
      })
      
      await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2))
      console.log(`💾 Message sauvegardé dans ${messagesFile} (${messages.length} messages après nettoyage)`)
    } catch (fileError) {
      console.error('Erreur lors de la sauvegarde du fichier:', fileError)
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Message envoyé avec succès' 
      },
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
