"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Activity, Scale, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 flex w-[200px] flex-col justify-between border-r border-[#222] bg-[#111111] p-4 z-50">
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
      <div className="px-2 py-1.5 text-center border-t border-zinc-800 pt-4">
        <p className="text-[10px] text-zinc-500 font-mono">AdvPlus v1.0</p>
        <p className="text-[10px] text-zinc-500 font-mono">Uso Interno</p>
      </div>
    </aside>
  )
}
