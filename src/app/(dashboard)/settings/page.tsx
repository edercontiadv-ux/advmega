"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { OfficeSettings, OABCredential } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Eye, EyeOff, ShieldCheck, HelpCircle, Plus, Trash2, UserPlus } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState<OfficeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  
  // Lista dinamica de OABs (Advogados)
  const [oabList, setOabList] = useState<OABCredential[]>([])

  // States for masking credentials
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showTelegramToken, setShowTelegramToken] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .single()

        if (error) {
          console.error("Erro ao buscar configurações:", error)
        } else {
          setSettings(data)
          // Se a lista de OABs em JSON existir, define no estado, senao inicializa com a OAB legada
          if (data.oabs && Array.isArray(data.oabs) && data.oabs.length > 0) {
            setOabList(data.oabs)
          } else if (data.oab_number && data.oab_state) {
            setOabList([{ name: "Advogado Principal", number: data.oab_number, state: data.oab_state }])
          } else {
            setOabList([])
          }
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar configurações:", err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [supabase])

  // Funcoes para manipular a lista de advogados dinamicamente
  const handleAddOAB = () => {
    setOabList(prev => [...prev, { name: "", number: "", state: "" }])
  }

  const handleRemoveOAB = (index: number) => {
    setOabList(prev => prev.filter((_, i) => i !== index))
  }

  const handleOABChange = (index: number, field: keyof OABCredential, value: string) => {
    setOabList(prev => {
      const updated = [...prev]
      if (field === "state") {
        updated[index][field] = value.toUpperCase().slice(0, 2)
      } else {
        updated[index][field] = value
      }
      return updated
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return

    // Valida se todos os advogados adicionados tem os dados preenchidos
    const isListValid = oabList.every(oab => oab.name.trim() !== "" && oab.number.trim() !== "" && oab.state.trim() !== "")
    if (oabList.length > 0 && !isListValid) {
      alert("Por favor, preencha todos os campos (Nome, OAB e UF) de todos os advogados listados.")
      return
    }

    setSaving(true)
    setSaveStatus("idle")

    try {
      // Usamos a primeira OAB da lista como legacy fallback para os campos legados (oab_number/oab_state)
      const primaryOAB = oabList[0] || { number: "", state: "" }

      const { error } = await supabase
        .from("settings")
        .update({
          oab_number: primaryOAB.number,
          oab_state: primaryOAB.state,
          oabs: oabList, // Envia a lista completa de advogados em JSONB
          openai_api_key: settings.openai_api_key,
          telegram_bot_token: settings.telegram_bot_token,
          telegram_chat_id: settings.telegram_chat_id,
          updated_at: new Date().toISOString()
        })
        .eq("id", "default")

      if (error) {
        console.error("Erro ao salvar configurações:", error)
        setSaveStatus("error")
      } else {
        setSaveStatus("success")
        setTimeout(() => setSaveStatus("idle"), 4000)
      }
    } catch (err) {
      console.error("Erro inesperado ao salvar:", err)
      setSaveStatus("error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-zinc-500">
        Carregando configurações do sistema...
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Configurações Gerais</h1>
        <p className="text-sm text-zinc-400">Gerencie a lista de OABs dos advogados e credenciais do escritório.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Configurações de Múltiplas OABs */}
        <div className="rounded-lg border border-zinc-800 bg-[#111111] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-blue-500" />
              <h2 className="text-base font-semibold text-zinc-200">Advogados do Escritório</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOAB}
              className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-zinc-100 gap-1.5 text-xs font-semibold py-1.5"
            >
              <UserPlus className="size-3.5" />
              Adicionar Advogado
            </Button>
          </div>

          {oabList.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-sm">
              Nenhum advogado cadastrado. Clique no botão acima para adicionar a primeira OAB.
            </div>
          ) : (
            <div className="space-y-4">
              {oabList.map((oab, index) => (
                <div 
                  key={index} 
                  className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-zinc-950/40 p-4 border border-zinc-900 rounded-md relative group transition-all"
                >
                  <div className="flex-1 w-full space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Nome do Advogado
                    </label>
                    <Input
                      value={oab.name}
                      onChange={(e) => handleOABChange(index, "name", e.target.value)}
                      placeholder="Ex: Dr. Eder Conti"
                      className="bg-zinc-900 border-zinc-850 text-zinc-100 text-sm py-1.5"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-[150px] space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Número da OAB
                    </label>
                    <Input
                      value={oab.number}
                      onChange={(e) => handleOABChange(index, "number", e.target.value)}
                      placeholder="Ex: 307844"
                      className="bg-zinc-900 border-zinc-850 font-mono text-zinc-100 text-sm py-1.5"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-[80px] space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      UF
                    </label>
                    <Input
                      value={oab.state}
                      onChange={(e) => handleOABChange(index, "state", e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      className="bg-zinc-900 border-zinc-850 font-mono text-zinc-100 text-sm py-1.5 text-center"
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOAB(index)}
                    className="text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 p-1.5 rounded transition-all self-end sm:self-center"
                    title="Excluir advogado"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-zinc-500">O sistema rodará a busca no portal DJEN individualmente para cada uma das OABs cadastradas acima.</p>
        </div>

        {/* Card 2: OpenAI API */}
        <div className="rounded-lg border border-zinc-800 bg-[#111111] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="size-5 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-200">AI</span>
              <h2 className="text-base font-semibold text-zinc-200">Inteligência Artificial (OpenAI)</h2>
            </div>
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="size-3" />
              Obter Chave API
            </a>
          </div>

          <div className="space-y-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              OpenAI API Key
            </label>
            <div className="relative">
              <Input
                type={showOpenAIKey ? "text" : "password"}
                value={settings?.openai_api_key || ""}
                onChange={(e) => setSettings(prev => prev ? { ...prev, openai_api_key: e.target.value } : null)}
                placeholder="sk-..."
                className="bg-zinc-900 border-zinc-800 font-mono text-zinc-100 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showOpenAIKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">Esta chave é usada exclusivamente para gerar resumos de 3 linhas com o modelo gpt-4o-mini.</p>
          </div>
        </div>

        {/* Card 3: Telegram Alertas */}
        <div className="rounded-lg border border-zinc-800 bg-[#111111] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <svg className="size-5 text-[#24A1DE]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.89 1.19-5.34 3.52-.5.35-.96.52-1.37.51-.45-.01-1.32-.26-1.97-.47-.79-.26-1.42-.4-1.36-.84.03-.23.35-.46.96-.71 3.76-1.63 6.27-2.71 7.54-3.23 3.59-1.48 4.33-1.74 4.82-1.75.11 0 .35.03.5.15.13.1.17.24.19.34.02.13.03.27.02.41z"/>
            </svg>
            <h2 className="text-base font-semibold text-zinc-200">Alertas no Telegram</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Token do Bot
              </label>
              <div className="relative">
                <Input
                  type={showTelegramToken ? "text" : "password"}
                  value={settings?.telegram_bot_token || ""}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, telegram_bot_token: e.target.value } : null)}
                  placeholder="123456789:ABC..."
                  className="bg-zinc-900 border-zinc-800 font-mono text-zinc-100 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowTelegramToken(!showTelegramToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showTelegramToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                ID do Chat / Canal
              </label>
              <Input
                value={settings?.telegram_chat_id || ""}
                onChange={(e) => setSettings(prev => prev ? { ...prev, telegram_chat_id: e.target.value } : null)}
                placeholder="Ex: -1001234567890"
                className="bg-zinc-900 border-zinc-800 font-mono text-zinc-100"
                required
              />
            </div>
          </div>
        </div>

        {/* Feedback visual de Sucesso / Erro */}
        {saveStatus === "success" && (
          <div className="rounded-md bg-emerald-950/40 border border-emerald-800 p-3 text-sm text-emerald-300 transition-all duration-300">
            ✓ Configurações salvas e aplicadas ao banco de dados com sucesso!
          </div>
        )}
        {saveStatus === "error" && (
          <div className="rounded-md bg-red-950/40 border border-red-800 p-3 text-sm text-red-300 transition-all duration-300">
            ✗ Falha ao salvar configurações. Tente novamente mais tarde.
          </div>
        )}

        {/* Barra de Ações com Botão de Salvar */}
        <div className="flex items-center justify-end pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold px-6 shadow transition-all duration-200"
          >
            <Save className="size-4" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </div>
  )
}
