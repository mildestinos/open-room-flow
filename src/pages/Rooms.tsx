import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  equipment: string[];
  qr_code_url: string | null;
}

const Rooms = () => {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Room[];
    },
  });

  const generateQRCode = async (roomId: string) => {
    try {
      const url = `${window.location.origin}/booking/${roomId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
      });
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `qrcode-sala-${roomId}.png`;
      link.href = qrCodeDataUrl;
      link.click();
      
      toast({
        title: "QR Code gerado",
        description: "O QR Code foi baixado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-8">Carregando salas...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Salas de Reunião</h1>
          <p className="text-xl text-muted-foreground">
            Selecione uma sala para fazer seu agendamento
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms?.map((room) => (
            <Card key={room.id} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {room.name}
                </CardTitle>
                <CardDescription>{room.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>Capacidade: {room.capacity} pessoas</span>
                </div>
                
                {room.equipment && room.equipment.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Equipamentos:</p>
                    <div className="flex flex-wrap gap-1">
                      {room.equipment.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs">
                          {item.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button asChild className="flex-1">
                    <Link to={`/booking/${room.id}`}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => generateQRCode(room.id)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <Clock className="h-4 w-4 mr-2" />
              Ver Agendamentos
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Rooms;