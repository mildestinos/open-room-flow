import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { format, addHours, startOfHour, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  equipment: string[];
}

interface Booking {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
}

const Booking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    organizer_name: "",
    organizer_email: "",
    start_time: "",
    end_time: "",
  });

  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      
      if (error) throw error;
      return data as Room;
    },
  });

  const { data: existingBookings } = useQuery({
    queryKey: ["bookings", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("room_id", roomId)
        .eq("status", "active")
        .gte("end_time", new Date().toISOString())
        .order("start_time");
      
      if (error) throw error;
      return data as Booking[];
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: typeof formData) => {
      const { data, error } = await supabase
        .from("bookings")
        .insert([
          {
            ...bookingData,
            room_id: roomId,
            start_time: new Date(bookingData.start_time).toISOString(),
            end_time: new Date(bookingData.end_time).toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Agendamento realizado",
        description: "Sua sala foi reservada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no agendamento",
        description: error.message || "Não foi possível agendar a sala",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.organizer_name || !formData.start_time || !formData.end_time) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);
    
    if (isBefore(startTime, new Date())) {
      toast({
        title: "Horário inválido",
        description: "Não é possível agendar para horários passados",
        variant: "destructive",
      });
      return;
    }

    if (endTime <= startTime) {
      toast({
        title: "Horário inválido",
        description: "O horário de fim deve ser posterior ao de início",
        variant: "destructive",
      });
      return;
    }

    createBookingMutation.mutate(formData);
  };

  const getMinDateTime = () => {
    const now = startOfHour(addHours(new Date(), 1));
    return format(now, "yyyy-MM-dd'T'HH:mm");
  };

  if (roomLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-8">Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Sala não encontrada</h1>
          <Button onClick={() => navigate("/")}>Voltar para salas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para salas
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {room.name}
            </CardTitle>
            <CardDescription>{room.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Capacidade: {room.capacity} pessoas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
            <CardDescription>
              Preencha os dados para reservar a sala
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Reunião *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Reunião de planejamento"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da reunião"
                />
              </div>

              <div>
                <Label htmlFor="organizer_name">Nome do Responsável *</Label>
                <Input
                  id="organizer_name"
                  value={formData.organizer_name}
                  onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="organizer_email">Email de Contato</Label>
                <Input
                  id="organizer_email"
                  type="email"
                  value={formData.organizer_email}
                  onChange={(e) => setFormData({ ...formData, organizer_email: e.target.value })}
                  placeholder="seu.email@empresa.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Início *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    min={getMinDateTime()}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_time">Fim *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    min={formData.start_time || getMinDateTime()}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={createBookingMutation.isPending}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {createBookingMutation.isPending ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {existingBookings && existingBookings.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{booking.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - 
                        {format(new Date(booking.end_time), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Booking;