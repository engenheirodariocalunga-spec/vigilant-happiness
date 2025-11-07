import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { supabase } from '@/lib/supabaseClient'; // O nosso conector Supabase
import { auth } from '@clerk/nextjs/server'; // Para obter o user ID

// Inicializa o cliente Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(request: Request) {
  // 1. Verificar se o utilizador está logado (Segurança!)
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // 2. Obter a URL da imagem do frontend
    const { imageUrl } = await request.json();

    // 3. Obter o URL do nosso "carteiro" (webhook)
    // Precisamos do URL completo, não apenas /api/webhook
    const webhookUrl = new URL(
      '/api/webhook',
      process.env.VERCEL_URL || 'http://localhost:3000'
    ).toString();

    // 4. Definir o modelo de IA
    const model = "tencentarc/gfpgan:9283608d2b2c1f11400e200f22f7a83d40A81463148f435f064c0C7b895318eE";

    // 5. DAR A ORDEM À IA (mas sem "await")
    // Usamos replicate.predictions.create() em vez de replicate.run()
    const prediction = await replicate.predictions.create({
      model: model,
      input: {
        img: imageUrl,
        scale: 2,
      },
      webhook: webhookUrl, // Diz à Replicate quem contactar quando terminar!
      webhook_events_filter: ["completed"] // Só nos chame quando terminar
    });

    // 6. GUARDAR O PEDIDO NO SUPABASE
    // Agora temos um ID de previsão (prediction.id)
    const { error: dbError } = await supabase
      .from('jobs') // A nossa tabela
      .insert({
        user_id: userId,
        replicate_id: prediction.id, // O ID da Replicate
        status: 'processing', // O estado inicial
        input_image_url: imageUrl,
      });

    if (dbError) {
      console.error("Erro ao guardar o job no Supabase:", dbError);
      // Não falhe a API, apenas registe o erro
    }

    // 7. RESPONDER IMEDIATAMENTE AO FRONTEND
    // Devolvemos o "número do pedido" (o ID do job da Replicate)
    // para que o nosso frontend saiba o que "ouvir".
    return NextResponse.json({ job_id: prediction.id }, { status: 201 }); // 201 = Criado

  } catch (error) {
    console.error("Erro ao chamar o Replicate:", error);
    return NextResponse.json({ error: "Erro ao iniciar a restauração" }, { status: 500 });
  }
}