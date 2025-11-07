"use client";

import { useState, useEffect } from "react"; // Importamos o useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";

// Interface para o nosso Job (boa prática)
interface Job {
  id: number;
  replicate_id: string;
  status: string;
  output_image_url: string | null;
  // Adicione outros campos se necessário
}

export default function HomePage() {
  const { user } = useUser();

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string>("");
  const [restoreResult, setRestoreResult] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // O ID do pedido que estamos a "ouvir"
  const [listeningJobId, setListeningJobId] = useState<string | null>(null);

  // PASSO 5 (A MAGIA): "Ouvir" o Supabase em Tempo Real
  useEffect(() => {
    // Se não houver utilizador ou nenhum pedido para ouvir, não faz nada
    if (!user || !listeningJobId) {
      return;
    }

    // O Supabase Realtime!
    const channel = supabase
      .channel(`jobs-feed:${user.id}`) // Um canal único por utilizador
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', // Ouvir apenas por "UPDATEs"
          schema: 'public',
          table: 'jobs', // Na nossa tabela 'jobs'
          filter: `replicate_id=eq.${listeningJobId}` // E só para o *nosso* pedido
        },
        (payload) => {
          // Quando o webhook atualiza o nosso job, isto é acionado!
          const updatedJob = payload.new as Job;
          if (updatedJob.status === 'completed') {
            setRestoreResult(updatedJob.output_image_url);
            setRestoreStatus("Foto restaurada com sucesso!");
            setListeningJobId(null); // Parar de ouvir
            channel.unsubscribe(); // Desligar o canal
          }
        }
      )
      .subscribe();

    // Função de "limpeza"
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listeningJobId, user]); // Correr este efeito sempre que o listeningJobId mudar

  // Função de Submissão (Agora Assíncrona)
  const handleRestoreSubmit = async () => {
    if (!restoreFile) {
      setRestoreError("Por favor, selecione um ficheiro.");
      return;
    }
    if (!user) {
      setRestoreError("Por favor, faça login para restaurar fotos.");
      return;
    }

    setRestoreStatus("A carregar a foto...");
    setRestoreError(null);
    setRestoreResult(null);

    try {
      // 1. Upload para o Supabase (igual a antes)
      const fileName = `${user.id}/${new Date().toISOString()}`;
      const { error: uploadError } = await supabase.storage
        .from("eternapic-images")
        .upload(fileName, restoreFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("eternapic-images")
        .getPublicUrl(fileName);
      const imageUrl = publicUrlData.publicUrl;

      // 2. Chamar a nossa API (agora devolve um job_id)
      setRestoreStatus("A registar o pedido de IA...");

      const response = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "A restauração falhou.");
      }

      const data = await response.json(); // Agora contém { job_id: "..." }

      // 3. ATIVAR A "ESCUTA"
      setListeningJobId(data.job_id); // Guardar o ID do pedido
      setRestoreStatus("Pedido enviado. A aguardar a IA... (Isto pode levar 1 min)");

    } catch (err: any) {
      console.error(err);
      setRestoreError(err.message || "Ocorreu um erro desconhecido.");
      setRestoreStatus("");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Tabs defaultValue="eternapic" className="w-full max-w-lg">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="eternapic">EternaPic (Fusão)</TabsTrigger>
          <TabsTrigger value="restore">Restaurar / Colorir</TabsTrigger>
        </TabsList>

        <TabsContent value="eternapic">
          <Card>
            <CardHeader>
              <CardTitle>EternaPic - Criador de Memórias</CardTitle>
              <CardDescription>
                (Em breve) Crie a "foto impossível" com quem você ama.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="restore">
          <Card>
            <CardHeader>
              <CardTitle>Restaurar & Colorir</CardTitle>
              <CardDescription>
                Dê nova vida a fotos antigas, P&B ou danificadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label>Foto Antiga</label>
                <Input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setRestoreFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleRestoreSubmit}
                disabled={restoreStatus.includes("A") || restoreStatus.includes("enviado")}
              >
                {restoreStatus.includes("A") || restoreStatus.includes("enviado") ? restoreStatus : "Restaurar Foto (Custa 1 Crédito)"}
              </Button>

              {/* Área de Feedback */}
              {restoreError && (
                <p className="text-red-500 text-sm text-center">{restoreError}</p>
              )}
              {restoreResult && (
                <div className="space-y-4 text-center">
                  <p className="text-green-600">Sucesso! Aqui está a sua foto:</p>
                  <img 
                    src={restoreResult} 
                    alt="Foto Restaurada" 
                    className="rounded-lg w-full border"
                  />
                  <a href={restoreResult} download="restaurada.png" className="text-blue-500 hover:underline">
                    Baixar foto
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}