import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BMF Panel',
  description: 'Black Mafia Family - Panel de management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>
        <div className="bg-app">
          <svg className="bg-stars" viewBox="0 0 700 300" preserveAspectRatio="xMidYMin slice">
            <circle cx="40" cy="30" r="1" fill="#fff" opacity="0.6"></circle>
            <circle cx="120" cy="60" r="1.2" fill="#fff" opacity="0.4"></circle>
            <circle cx="200" cy="20" r="0.8" fill="#fff" opacity="0.5"></circle>
            <circle cx="280" cy="80" r="1" fill="#fff" opacity="0.3"></circle>
            <circle cx="360" cy="40" r="1.3" fill="#fff" opacity="0.5"></circle>
            <circle cx="450" cy="70" r="0.9" fill="#fff" opacity="0.4"></circle>
            <circle cx="530" cy="25" r="1.1" fill="#fff" opacity="0.6"></circle>
            <circle cx="600" cy="55" r="0.8" fill="#fff" opacity="0.3"></circle>
            <circle cx="660" cy="90" r="1" fill="#fff" opacity="0.5"></circle>
            <circle cx="90" cy="110" r="0.7" fill="#fff" opacity="0.3"></circle>
            <circle cx="320" cy="130" r="0.9" fill="#fff" opacity="0.4"></circle>
            <circle cx="500" cy="120" r="0.7" fill="#fff" opacity="0.3"></circle>
            <circle cx="160" cy="150" r="0.6" fill="#fff" opacity="0.25"></circle>
            <circle cx="420" cy="160" r="0.8" fill="#fff" opacity="0.3"></circle>
          </svg>
          <svg className="bg-skyline" viewBox="0 0 700 160" preserveAspectRatio="none">
            <rect x="0" y="60" width="30" height="100" fill="#0c0c0e"></rect>
            <rect x="32" y="40" width="22" height="120" fill="#0e0e10"></rect>
            <rect x="56" y="75" width="28" height="85" fill="#0c0c0e"></rect>
            <rect x="86" y="30" width="18" height="130" fill="#101012"></rect>
            <rect x="106" y="55" width="34" height="105" fill="#0c0c0e"></rect>
            <rect x="142" y="20" width="20" height="140" fill="#0e0e10"></rect>
            <rect x="164" y="65" width="26" height="95" fill="#0c0c0e"></rect>
            <rect x="192" y="10" width="24" height="150" fill="#111114"></rect>
            <rect x="218" y="45" width="30" height="115" fill="#0c0c0e"></rect>
            <rect x="250" y="70" width="22" height="90" fill="#0e0e10"></rect>
            <rect x="274" y="25" width="18" height="135" fill="#0c0c0e"></rect>
            <rect x="294" y="50" width="32" height="110" fill="#101012"></rect>
            <rect x="328" y="5" width="26" height="155" fill="#0e0e10"></rect>
            <rect x="356" y="60" width="20" height="100" fill="#0c0c0e"></rect>
            <rect x="378" y="35" width="28" height="125" fill="#111114"></rect>
            <rect x="408" y="75" width="24" height="85" fill="#0c0c0e"></rect>
            <rect x="434" y="15" width="22" height="145" fill="#0e0e10"></rect>
            <rect x="458" y="55" width="30" height="105" fill="#0c0c0e"></rect>
            <rect x="490" y="30" width="18" height="130" fill="#101012"></rect>
            <rect x="510" y="65" width="26" height="95" fill="#0c0c0e"></rect>
            <rect x="538" y="10" width="24" height="150" fill="#0e0e10"></rect>
            <rect x="564" y="45" width="32" height="115" fill="#0c0c0e"></rect>
            <rect x="598" y="70" width="20" height="90" fill="#111114"></rect>
            <rect x="620" y="25" width="22" height="135" fill="#0c0c0e"></rect>
            <rect x="644" y="55" width="28" height="105" fill="#0e0e10"></rect>
            <rect x="674" y="40" width="26" height="120" fill="#0c0c0e"></rect>
          </svg>
        </div>
        {children}
      </body>
    </html>
  )
}
