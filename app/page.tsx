// PASSO 1: Converter para um "Componente de Cliente" para ser interativo
"use client";

import { useState } from "react"; // Para guardar o estado (loading, ficheiros, etc.)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Importar o nosso cliente Supabase (que criámos em lib/supabaseClient.ts)
import { supabase } from "@/lib/supabaseClient";
// Importar o hook de utilizador do Clerk para sabermos quem está logado
import { useUser } from "@clerk/nextjs";

export default function HomePage() {
  // PASSO 2: Criar "estado" para guardar os nossos dados
  const { user } = useUser(); // Obter o utilizador logado

  // Estado para o "Restaurar"
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string>(""); // Ex: "A carregar...", "A restaurar..."
  const [restoreResult, setRestoreResult] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Função para o "Restaurar Foto"
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
      // PASSO 3: Fazer upload para o Supabase
      // Criar um nome de ficheiro único para evitar conflitos
      const fileName = `${user.id}/${new Date().toISOString()}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eternapic-images") // O nome do nosso "balde" (bucket)
        .upload(fileName, restoreFile);

      if (uploadError) throw uploadError;

      // Obter o URL público do ficheiro que acabámos de carregar
      const { data: publicUrlData } = supabase.storage
        .from("eternapic-images")
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;

      // PASSO 4: Chamar o nosso Backend (a API que criámos)
      setRestoreStatus("A restaurar a imagem... (Isto pode levar 1 min)");

      const response = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrl }), // Enviar o URL do Supabase
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "A restauração falhou.");
      }

      const data = await response.json();

      // PASSO 5: Mostrar o resultado
      setRestoreResult(data.restoredImageUrl[0]); // A API devolve uma lista
      setRestoreStatus("Foto restaurada com sucesso!");

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
          {/* A LÓGICA DO ETERNAPIC (FUSÃO) VIRÁ AQUI MAIS TARDE */}
          <Card>
            <CardHeader>
              <CardTitle>EternaPic - Criador de Memórias</CardTitle>
              <CardDescription>
                (Em breve) Crie a "foto impossível" com quem você ama.
              </a-description>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="restore">
          <Card>
            <CardHeader>
              <CardTitle>Restaurar & Colorir</CardTitle>
              <CardDescription>
                Dê nova vida a fotos antigas, P&B ou danificadas.
              </a-description>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label>Foto Antiga</label>
                <Input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp"
                  // Guardar o ficheiro no nosso "estado" quando o utilizador o seleciona
                  onChange={(e) => setRestoreFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <Button 
                className="w-full" 
                // Chamar a nossa função principal ao clicar
                onClick={handleRestoreSubmit}
                // Desativar o botão enquanto a IA está a trabalhar
                disabled={restoreStatus.includes("A carregar...") || restoreStatus.includes("A restaurar...")}
              >
                {/* Mudar o texto do botão com base no estado */}
                {restoreStatus.includes("A") ? restoreStatus : "Restaurar Foto (Custa 1 Crédito)"}
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