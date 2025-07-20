import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [canReset, setCanReset] = useState(false)

  useEffect(() => {
    // Check if the user is authenticated (session exists)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCanReset(true)
      } else {
        navigate('/auth')
      }
    })
  }, [navigate])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated! You can now sign in.')
      setTimeout(() => navigate('/auth'), 2000)
    }
    setLoading(false)
  }

  if (!canReset) return null

  return (
    <form onSubmit={handleReset} className="space-y-4 max-w-md mx-auto mt-20">
      <Input
        type="password"
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !password}>
        {loading ? 'Updating...' : 'Set New Password'}
      </Button>
      {message && <div className="text-sm mt-2">{message}</div>}
    </form>
  )
} 