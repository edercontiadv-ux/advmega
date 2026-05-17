"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Publication } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Search, Filter, Check, RefreshCw } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUnread, setFilterUnread] = useState(false)
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)

  const supabase = createClient()

  const fetchPublications = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("publications")
        .select("*")
        .order("publication_date", { ascending: false })

      if (filterUnread) {
        query = query.eq("is_read", false)
      }

      if (searchQuery.trim()) {
        query = query.ilike("process_number", `%${searchQuery.trim()}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar publicações:", error)
      } else {
        setPublications(data || [])
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar publicações:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase, filterUnread, searchQuery])

  useEffect(() => {
    fetchPublications()
  }, [fetchPublications])

  async function handleMarkAsRead(id: string) {
    setMarkingRead(true)
    try {
      const { error } = await supabase
        .from("publications")
        .update({ is_read: true })
        .eq("id", id)

      if (error) {
        console.error("Erro ao atualizar publicação:", error)
        return
      }

      // Atualiza o estado local
      setPublications((prev) =>
        prev.map((pub) => (pub.id === id ? { ...pub, is_read: true } : pub))
      )
      if (selectedPublication && selectedPublication.id === id) {
        setSelectedPublication({ ...selectedPublication, is_read: true })
      }
    } catch (err) {
      console.error("Erro inesperado ao marcar como lida:", err)
    } finally {
      setMarkingRead(false)
    }
  }

  function handleRowClick(pub: Publication) {
    setSelectedPublication(pub)
    setSheetOpen(true)
  }

  function formatDate(dateString: string) {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Publicações do DJEN</h1>
          <p className="text-sm text-zinc-400">Acompanhamento diário e resumos gerados por inteligência artificial.</p>
        </div>

        <Button
          onClick={fetchPublications}
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-zinc-800 bg-[#111111] p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por número do processo..."
            className="pl-9 bg-zinc-900 border-zinc-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-300">Filtrar:</span>
          <div className="flex rounded-md bg-zinc-900 p-0.5 border border-zinc-800">
            <button
              onClick={() => setFilterUnread(false)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                !filterUnread ? "bg-zinc-800 text-zinc-100 shadow-sm font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterUnread(true)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                filterUnread ? "bg-zinc-800 text-zinc-100 shadow-sm font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Não Lidas
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Publicações */}
      <div className="rounded-lg border border-zinc-800 bg-[#111111] shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px]">Processo</TableHead>
              <TableHead className="w-[250px]">Partes</TableHead>
              <TableHead className="w-[120px]">Data</TableHead>
              <TableHead className="flex-1">Resumo IA</TableHead>
              <TableHead className="w-[120px] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                  Carregando publicações...
                </TableCell>
              </TableRow>
            ) : publications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                  Nenhuma publicação encontrada para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              publications.map((pub) => (
                <TableRow
                  key={pub.id}
                  onClick={() => handleRowClick(pub)}
                  className="cursor-pointer hover:bg-zinc-900/60 transition-colors"
                >
                  <TableCell className="font-mono font-medium text-zinc-200">
                    {pub.process_number}
                  </TableCell>
                  <TableCell className="text-zinc-300 max-w-[250px] truncate" title={pub.parties}>
                    {pub.parties}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {formatDate(pub.publication_date)}
                  </TableCell>
                  <TableCell className="text-zinc-300 max-w-md truncate" title={pub.summary}>
                    {pub.summary}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={pub.is_read ? "read" : "unread"}>
                      {pub.is_read ? "Lida" : "Não Lida"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sheet Lateral (Detalhes da Publicação) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex flex-col h-full sm:max-w-xl">
          {selectedPublication && (
            <>
              <SheetHeader className="border-b border-zinc-800 pb-4 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <Badge variant={selectedPublication.is_read ? "read" : "unread"}>
                    {selectedPublication.is_read ? "Lida" : "Não Lida"}
                  </Badge>
                  <span className="text-xs text-zinc-400">
                    Publicado em {formatDate(selectedPublication.publication_date)}
                  </span>
                </div>
                <SheetTitle className="text-xl font-bold font-mono mt-2 text-zinc-100 break-all">
                  {selectedPublication.process_number}
                </SheetTitle>
                <SheetDescription className="text-sm text-zinc-300 mt-1">
                  <span className="font-semibold text-zinc-400 block mb-0.5">Partes do Processo:</span>
                  {selectedPublication.parties}
                </SheetDescription>
              </SheetHeader>

              {/* Corpo do Sheet com Scroll */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Seção Resumo IA */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Resumo Gerado por IA
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
                    {selectedPublication.summary}
                  </p>
                </div>

                {/* Seção Íntegra */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Íntegra da Publicação
                  </h3>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300 max-h-[350px] overflow-y-auto whitespace-pre-wrap">
                    {selectedPublication.content}
                  </div>
                </div>
              </div>

              {/* Rodapé do Sheet com Ações */}
              <div className="border-t border-zinc-800 pt-4 mt-4 flex items-center justify-end gap-3">
                {!selectedPublication.is_read && (
                  <Button
                    onClick={() => handleMarkAsRead(selectedPublication.id)}
                    disabled={markingRead}
                    className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 gap-2 shadow"
                  >
                    <Check className="size-4" />
                    {markingRead ? "Marcando..." : "Marcar como Lida"}
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
