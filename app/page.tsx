import { redirect } from 'next/navigation'

// For testing, redirect directly to dashboard
export default function LandingPage() {
  redirect('/dashboard')
}
