import './globals.css'

export const metadata = {
  title: 'Marketing Agent Orchestra',
  description: 'Three AI agents working in harmony to research, evaluate, and report on marketing trends',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
