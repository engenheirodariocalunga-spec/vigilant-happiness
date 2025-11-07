import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Tabs defaultValue="eternapic" className="w-[450px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="eternapic">EternaPic (Fusão)</TabsTrigger>
          <TabsTrigger value="restore">Restaurar / Colorir</TabsTrigger>
        </TabsList>

        {/* Tab 1: A nossa feature principal */}
        <TabsContent value="eternapic">
          <Card>
            <CardHeader>
              <CardTitle>EternaPic - Criador de Memórias</CardTitle>
              <CardDescription>
                Crie a "foto impossível" com quem você ama.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label>Pessoa A (Ex: Você)</label>
                {/* Mais tarde, isto será um botão de upload */}
                <Input type="file" />
              </div>
              <div className="space-y-2">
                <label>Pessoa B (Ex: O seu Parente)</label>
                <Input type="file" />
              </div>
              <div className="space-y-2">
                <label>Descreva a Cena</label>
                <Input placeholder="Ex: 'Nós os dois num parque, sorrindo'" />
              </div>
              <Button className="w-full">Gerar Memória (Custa 10 Créditos)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: O "gancho" de aquisição */}
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
                <Input type="file" />
              </div>
              <Button className="w-full">Restaurar Foto (Custa 1 Crédito)</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}