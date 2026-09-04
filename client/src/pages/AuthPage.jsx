import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginLeft from '../components/LoginLeft'
import { useAppContext } from '../context/AppContext'
import api from '../api/api'

const AuthPage = ({mode}) => {
  const isLogin = mode === 'login';
  const navigate = useNavigate()
  const { setUser } = useAppContext()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const { data } = await api.post(endpoint, { name, email, password })
      setUser(data.user)
      navigate('/', { replace: true })
    } catch {
      setError('Unable to continue. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex text-zinc-900 font-sans">
      <LoginLeft/>
      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">AI Site Builder</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-3 text-zinc-600">
            {isLogin ? 'Sign in to continue building your website.' : 'Start creating your website with AI.'}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <label className="block text-sm font-medium text-zinc-700">
                Name
                <input className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 outline-none transition focus:border-zinc-950" value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
            )}
            <label className="block text-sm font-medium text-zinc-700">
              Email address
              <input className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 outline-none transition focus:border-zinc-950" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Password
              <input className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2.5 outline-none transition focus:border-zinc-950" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" required />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="w-full rounded-lg bg-zinc-950 px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting}>
              {submitting ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-zinc-600">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <Link className="font-semibold text-zinc-950 underline underline-offset-4" to={isLogin ? '/register' : '/login'}>
              {isLogin ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default AuthPage
