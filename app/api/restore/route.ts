import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { supabase } from '@/lib/supabaseClient';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(request: Request) {
  // (AUTENTICAÇÃO REMOVIDA TEMPORARIAMENTE PARA CORRIGIR A BUILD)
  // const { userId } = await auth();
  // if (!userId) { ... }

  try {
    const { imageUrl } = await request.json();
    const webhookUrl = new URL('/api/webhook', process.env.VERCEL_URL || 'http://localhost:3000').toString();
    const model = "tencentarc/gfpgan:9283608d2b2c1f11400e200f22f7a83d40A81463148f435f064c0C7b895318eE";

    const prediction = await replicate.predictions.create({
      model: model,
      input: { img: imageUrl, scale: 2 },
      webhook: webhookUrl,
      webhook_events_filter: ["completed"]
    });

    // Vamos usar um user_id "publico" por agora
    const userId = "public_user"; 

    const { error: dbError } = await supabase
      .from('jobs')
      .insert({
        user_id: userId, // Usar o ID público
        replicate_id: prediction.id,
        status: 'processing',
        input_image_url: imageUrl,
      });

    if (dbError) console.error("Erro ao guardar o job:", dbError);

    return NextResponse.json({ job_id: prediction.id }, { status: 201 });

  } catch (error) {
    console.error("Erro ao chamar o Replicate:", error);
    return NextResponse.json({ error: "Erro ao iniciar a restauração" }, { status: 500 });
  }
}