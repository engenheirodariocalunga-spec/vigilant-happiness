"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";

// (REMOVEMOS A IMPORTAÇÃO DO CLERK)
// import { useUser } from "@clerk/nextjs";

interface Job {
  id: number;
  replicate_id: string;
  status: string;
  output_image_url: string | null;
}

export default function HomePage() {
  // (REMOVEMOS O useUser())
  // const { user } = useUser();
  const userId = "public_user"; // Usar o mesmo ID público

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string>("");
  const [restoreResult, setRestoreResult] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [listeningJobId, setListeningJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !listeningJobId) return;

    const channel = supabase
      .channel(`jobs-feed:${userId}`) // Ouvir o canal público
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public',
          table: 'jobs',
          filter: `replicate_id=eq.${listeningJobId}`
        },
        (payload) => {
          const updatedJob = payload.new as Job;
          if (updatedJob.status === 'completed') {
            setRestoreResult(updatedJob.output_image_url);
            setRestoreStatus("Foto restaurada com sucesso!");
            setListeningJobId(null);
            channel.unsubscribe();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listeningJobId, userId]);

  const handleRestoreSubmit = async () => {
    if (!restoreFile) {
      setRestoreError("Por favor, selecione um ficheiro.");
      return;
    }
    // (REMOVEMOS A VERIFICAÇÃO DE LOGIN)

    setRestoreStatus("A carregar a foto...");
    setRestoreError(null);
    setRestoreResult(null);

    try {
      const fileName = `${userId}/${new Date().toISOString()}`; // Salvar na pasta "public_user"
      const { error: uploadError } = await supabase.storage
        .from("eternapic-images")
        .upload(fileName, restoreFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("eternapic-images")
        .getPublicUrl(fileName);
      const imageUrl = publicUrlData.publicUrl;

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

      const data = await response.json();
      setListeningJobId(data.job_id);
      setRestoreStatus("Pedido enviado. A aguardar a IA... (Isto pode levar 1 min)");

    } catch (err: any) {
      console.error(err);
      setRestoreError(err.message || "Ocorreu um erro desconhecido.");
      setRestoreStatus("");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      {/* (REMOVEMOS O CABEÇALHO DE LOGIN) */}
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
                {restoreStatus.includes("A") || restoreStatus.includes("enviado") ? restoreStatus : "Restaurar Foto"}
              </Button>

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