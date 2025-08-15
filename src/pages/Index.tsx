import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10">
      {/* Hero Section */}
      <div className="bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Sistema de Agendamento
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Reserve salas de reunião de forma rápida e sem complicações. 
              Não é necessário login ou cadastro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/rooms">
                  <MapPin className="h-5 w-5 mr-2" />
                  Ver Salas Disponíveis
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/dashboard">
                  <Clock className="h-5 w-5 mr-2" />
                  Acompanhar Agendamentos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Como funciona</h2>
          <p className="text-lg text-muted-foreground">
            Processo simples e rápido para reservar sua sala
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>1. Escolha a Sala</CardTitle>
              <CardDescription>
                Visualize as salas disponíveis com suas características e equipamentos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>2. Faça o Agendamento</CardTitle>
              <CardDescription>
                Preencha os dados básicos e escolha data e horário desejados
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>3. Confirmação Imediata</CardTitle>
              <CardDescription>
                Receba confirmação instantânea e acompanhe no dashboard
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="bg-card/50 border-y">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <QrCode className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Acesso via QR Code</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Cada sala possui um QR Code único para acesso direto ao agendamento. 
              Basta escanear e fazer sua reserva instantaneamente.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link to="/rooms">
                <QrCode className="h-5 w-5 mr-2" />
                Gerar QR Code das Salas
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-background border-t">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p>Sistema de Agendamento de Salas • Desenvolvido com ❤️</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
