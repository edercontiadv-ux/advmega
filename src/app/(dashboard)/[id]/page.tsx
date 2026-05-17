"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Publication } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Calendar, FileText, User } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PublicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const [publication, setPublication] = useState<Publication | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchPublication = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .eq("id", unwrappedParams.id)
        .single()

      if (error) {
        console.error("Erro ao buscar publicação:", error)
      } else {
        setPublication(data)
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar publicação:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, unwrappedParams.id])

  useEffect(() => {
    fetchPublication()
  }, [fetchPublication])

  async function handleMarkAsRead() {
    if (!publication) return
    setMarkingRead(true)
    try {
      const { error } = await supabase
        .from("publications")
        .update({ is_read: true })
        .eq("id", publication.id)

      if (error) {
        console.error("Erro ao atualizar publicação:", error)
        return
      }

      setPublication({ ...publication, is_read: true })
    } catch (err) {
      console.error("Erro inesperado ao marcar como lida:", err)
    } finally {
      setMarkingRead(false)
    }
  }

  function formatDate(dateString: string) {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        Carregando detalhes da publicação...
      </div>
    )
  }

  if (!publication) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-zinc-500">Publicação não encontrada ou indisponível.</p>
        <Button onClick={() => router.push("/")} variant="outline" className="gap-2">
          <ArrowLeft className="size-4" />
          Voltar para Publicações
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Botão Voltar */}
      <Button onClick={() => router.push("/")} variant="ghost" className="pl-0 gap-2 text-zinc-400 hover:text-zinc-100">
        <ArrowLeft className="size-4" />
        Voltar para a Lista
      </Button>

      {/* Cabeçalho */}
      <div className="rounded-lg border border-zinc-800 bg-[#111111] p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={publication.is_read ? "read" : "unread"}>
              {publication.is_read ? "Lida" : "Não Lida"}
            </Badge>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Calendar className="size-3.5" />
              Publicado em {formatDate(publication.publication_date)}
            </span>
          </div>

          {!publication.is_read && (
            <Button
              onClick={handleMarkAsRead}
              disabled={markingRead}
              className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 gap-2 shadow"
            >
              <Check className="size-4" />
              {markingRead ? "Marcando..." : "Marcar como Lida"}
            </Button>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold font-mono text-zinc-100 break-all">
            {publication.process_number}
          </h1>
          <div className="mt-2 flex items-start gap-2 text-sm text-zinc-300">
            <User className="size-4 text-zinc-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-400 block">Partes do Processo:</span>
              {publication.parties}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo IA */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-500 animate-pulse"></span>
          Resumo Gerado por IA
        </h2>
        <p className="text-base leading-relaxed text-zinc-200 whitespace-pre-wrap">
          {publication.summary}
        </p>
      </div>

      {/* Íntegra */}
      <div className="rounded-lg border border-zinc-800 bg-[#111111] p-6 shadow-sm space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <FileText className="size-4 text-zinc-500" />
          Íntegra da Publicação
        </h2>
        <div className="rounded border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300 overflow-x-auto whitespace-pre-wrap">
          {publication.content}
        </div>
      </div>
    </div>
  )
}
