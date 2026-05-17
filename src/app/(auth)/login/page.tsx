"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Scale } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError("Credenciais inválidas. Verifique seu e-mail e senha.")
        setLoading(false)
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Erro inesperado ao conectar ao servidor.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-[#111111] p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-zinc-800">
            <Scale className="size-6 text-zinc-200" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Godoi, Santos & Conti</h1>
          <p className="mt-1 text-sm text-zinc-400">Acesso Restrito do Escritório</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-950/50 border border-red-900 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300" htmlFor="email">
              E-mail Institucional
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="advogado@godoisantosconti.com.br"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300" htmlFor="password">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200" disabled={loading}>
            {loading ? "Autenticando..." : "Entrar no Sistema"}
          </Button>
        </form>
      </div>
    </div>
  )
}
