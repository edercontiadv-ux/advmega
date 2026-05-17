"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { ExecutionLog } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function LogsPage() {
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Erro ao buscar logs:", error)
      } else {
        setLogs(data || [])
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar logs:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  function formatDateTime(dateString: string) {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Logs de Execução</h1>
          <p className="text-sm text-zinc-400">Histórico de execuções diárias do scraper no DJEN.</p>
        </div>

        <Button
          onClick={fetchLogs}
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar Logs
        </Button>
      </div>

      {/* Tabela de Logs */}
      <div className="rounded-lg border border-zinc-800 bg-[#111111] shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[180px]">Data / Hora</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[150px] text-center">Novas Publicações</TableHead>
              <TableHead className="flex-1">Detalhes / Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                  Carregando logs de execução...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                  Nenhum log de execução registrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-zinc-900/40">
                  <TableCell className="font-mono text-xs text-zinc-300">
                    {formatDateTime(log.executed_at)}
                  </TableCell>
                  <TableCell>
                    {log.status === "success" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-2.5 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-900/50">
                        <CheckCircle2 className="size-3 text-emerald-400" />
                        Sucesso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/60 px-2.5 py-0.5 text-xs font-medium text-red-300 border border-red-900/50">
                        <XCircle className="size-3 text-red-400" />
                        Erro
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono font-medium text-zinc-200">
                    {log.status === "success" ? `+${log.publications_new}` : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400 font-mono max-w-md truncate" title={log.error_message || "Execução concluída sem erros."}>
                    {log.error_message || `Encontradas: ${log.publications_found} | Novas: ${log.publications_new}`}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
