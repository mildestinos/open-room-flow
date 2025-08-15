import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface BookingWithRoom {
  id: string;
  title: string;
  description: string;
  organizer_name: string;
  organizer_email: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  rooms: {
    id: string;
    name: string;
    capacity: number;
  };
}

const Dashboard = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ["all-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          rooms (
            id,
            name,
            capacity
          )
        `)
        .eq("status", "active")
        .gte("end_time", new Date().toISOString())
        .order("start_time");
      
      if (error) throw error;
      return data as BookingWithRoom[];
    },
    refetchInterval: autoRefresh ? 30000 : false, // Atualiza a cada 30 segundos
  });

  const getBookingStatus = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isPast(end)) return { label: "Finalizada", variant: "secondary" as const };
    if (now >= start && now <= end) return { label: "Em andamento", variant: "default" as const };
    if (isToday(start)) return { label: "Hoje", variant: "destructive" as const };
    if (isFuture(start)) return { label: "Agendada", variant: "outline" as const };
    
    return { label: "Agendada", variant: "outline" as const };
  };

  const todayBookings = bookings?.filter(booking => 
    isToday(new Date(booking.start_time))
  ) || [];

  const upcomingBookings = bookings?.filter(booking => 
    !isToday(new Date(booking.start_time)) && isFuture(new Date(booking.start_time))
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-8">Carregando agendamentos...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para salas
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Dashboard de Agendamentos</h1>
              <p className="text-xl text-muted-foreground">
                Acompanhe todos os agendamentos em tempo real
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayBookings.length}</div>
              <p className="text-xs text-muted-foreground">
                {todayBookings.length === 1 ? 'agendamento' : 'agendamentos'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Próximos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
              <p className="text-xs text-muted-foreground">
                {upcomingBookings.length === 1 ? 'agendamento' : 'agendamentos'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {(bookings?.length || 0) === 1 ? 'agendamento' : 'agendamentos'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agendamentos de Hoje */}
        {todayBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Agendamentos de Hoje
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayBookings.map((booking) => {
                const status = getBookingStatus(booking.start_time, booking.end_time);
                return (
                  <Card key={booking.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{booking.title}</CardTitle>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {booking.rooms.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(booking.start_time), "HH:mm")} - 
                          {format(new Date(booking.end_time), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>{booking.organizer_name}</span>
                      </div>
                      {booking.description && (
                        <p className="text-sm text-muted-foreground">
                          {booking.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Próximos Agendamentos */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Próximos Agendamentos
          </h2>
          
          {upcomingBookings.length === 0 && todayBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum agendamento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Não há agendamentos ativos no momento
                </p>
                <Button asChild>
                  <Link to="/">
                    <Calendar className="h-4 w-4 mr-2" />
                    Fazer Agendamento
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBookings.map((booking) => {
                const status = getBookingStatus(booking.start_time, booking.end_time);
                return (
                  <Card key={booking.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{booking.title}</CardTitle>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {booking.rooms.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(booking.start_time), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(booking.start_time), "HH:mm")} - 
                          {format(new Date(booking.end_time), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>{booking.organizer_name}</span>
                      </div>
                      {booking.description && (
                        <p className="text-sm text-muted-foreground">
                          {booking.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;