import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:8080/reset-password/'
    })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for a password reset link.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleReset} className="space-y-4">
      <Input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !email}>
        {loading ? 'Sending...' : 'Reset Password'}
      </Button>
      <Button type="button" variant="link" onClick={onBack}>
        Back to Sign In
      </Button>
      {message && <div className="text-sm mt-2">{message}</div>}
    </form>
  )
} 