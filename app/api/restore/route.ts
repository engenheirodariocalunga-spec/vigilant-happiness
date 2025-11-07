import { NextResponse } from 'next/server';
import Replicate from 'replicate';

// Inicializa o cliente Replicate com a nossa chave de API
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Esta é a função que é chamada quando o nosso frontend faz um "POST"
export async function POST(request: Request) {
  try {
    // 1. Obter os dados do frontend (ex: a URL da imagem a restaurar)
    const { imageUrl } = await request.json(); 

    // 2. Definir o modelo de IA que queremos usar no Replicate
    // Este é um modelo popular para restaurar fotos (GFPGAN)
    const model = "tencentarc/gfpgan:9283608d2b2c1f11400e200f22f7a83d40A81463148f435f064c0C7b895318eE";

    // 3. Dar a ordem à IA
    const output = await replicate.run(model, {
      input: {
        img: imageUrl, // A imagem que o utilizador enviou
        scale: 2, // Aumentar a escala da imagem 2x
      }
    });

    // 4. Devolver o resultado (a nova imagem) ao nosso frontend
    return NextResponse.json({ restoredImageUrl: output }, { status: 200 });

  } catch (error) {
    console.error("Erro ao chamar o Replicate:", error);
    return NextResponse.json({ error: "Erro ao restaurar a imagem" }, { status: 500 });
  }
}