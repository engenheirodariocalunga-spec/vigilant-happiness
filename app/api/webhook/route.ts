import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // O nosso conector do Supabase

// Este é o "carteiro" que a Replicate chama
export async function POST(request: Request) {
  try {
    // 1. Ler o "pacote" (a carga) que a Replicate enviou
    const body = await request.json();

    // A Replicate envia um objeto com o ID do trabalho e o resultado (output)
    const replicateID = body.id;
    const status = body.status; // ex: "succeeded" ou "failed"
    const outputImageUrl = body.output ? body.output[0] : null; // O resultado da IA

    // 2. Encontrar o trabalho correspondente no nosso Supabase
    // (Vamos procurar pelo ID que a Replicate nos deu)
    if (status === 'succeeded' && outputImageUrl) {
      const { data, error } = await supabase
        .from('jobs') // A nossa tabela
        .update({ 
          status: 'completed', // Atualizar o estado
          output_image_url: outputImageUrl // Guardar o resultado!
        })
        .eq('replicate_id', replicateID); // Onde o ID do Replicate corresponde

      if (error) {
        console.error("Erro ao atualizar o job no Supabase:", error);
        // Mesmo que falhe a guardar, temos de dizer à Replicate que recebemos (200 OK)
      }
    }

    // 3. Responder à Replicate
    // Temos de responder 200 OK (Sucesso) imediatamente,
    // caso contrário, a Replicate pensa que o nosso webhook falhou e tenta de novo.
    return NextResponse.json({ message: "Webhook recebido" }, { status: 200 });

  } catch (error: any) {
    console.error("Erro no webhook:", error.message);
    return NextResponse.json({ error: "Erro no processamento do webhook" }, { status: 500 });
  }
}