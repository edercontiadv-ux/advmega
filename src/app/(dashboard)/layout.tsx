"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileText, Activity, LogOut, Scale, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-100 mx-auto"></div>
          <p className="text-sm font-medium text-zinc-400">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Sidebar Fixa */}
      <aside className="fixed inset-y-0 left-0 flex w-[200px] flex-col justify-between border-r border-[#222] bg-[#111111] p-4">
        <div>
          {/* Header da Sidebar */}
          <div className="mb-8 flex items-center gap-2 px-2 py-1.5">
            <Scale className="size-5 text-zinc-100" />
            <span className="font-bold text-sm tracking-tight text-zinc-100 line-clamp-1">
              Godoi, Santos & Conti
            </span>
          </div>

          {/* Links de Navegação */}
          <nav className="space-y-1">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 hover:text-zinc-50",
                pathname === "/" ? "bg-zinc-800 text-zinc-50 font-semibold" : "text-zinc-400"
              )}
            >
              <FileText className="size-4" />
              Publicações
            </Link>

            <Link
              href="/logs"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 hover:text-zinc-50",
                pathname === "/logs" ? "bg-zinc-800 text-zinc-50 font-semibold" : "text-zinc-400"
              )}
            >
              <Activity className="size-4" />
              Logs
            </Link>

            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 hover:text-zinc-50",
                pathname === "/settings" ? "bg-zinc-800 text-zinc-50 font-semibold" : "text-zinc-400"
              )}
            >
              <Settings className="size-4" />
              Configurações
            </Link>
          </nav>
        </div>


        {/* Rodapé da Sidebar */}
        <div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-950/40 hover:text-red-300"
          >
            <LogOut className="size-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="ml-[200px] flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
