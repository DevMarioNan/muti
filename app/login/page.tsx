"use client"

import { useEffect } from "react"

export default function LoginPage() {
  useEffect(() => {
    // Redirect to Instagram OAuth
    window.location.href = "/api/auth/meta"
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-pulse">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <p className="text-white/60 text-sm">Redirecting to Instagram...</p>
      </div>
    </div>
  )
}