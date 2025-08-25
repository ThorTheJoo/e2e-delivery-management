import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'E2E Delivery Management - TMF Scoping & Architecture Orchestrator',
  description: 'Comprehensive E2E Delivery Management System for TMF capabilities, eTOM processes, and project orchestration',
  keywords: ['TMF', 'eTOM', 'Delivery Management', 'Project Management', 'Architecture'],
  authors: [{ name: 'CSG Systems Inc' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  )
}
