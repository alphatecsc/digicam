import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Digicam VMS - Sistema de Gerenciamento de Vídeo',
  description: 'Sistema avançado de gerenciamento de vídeo com monitoramento, análise e automação',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

