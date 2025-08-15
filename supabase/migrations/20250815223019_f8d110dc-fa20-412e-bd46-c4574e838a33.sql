-- Criar tabela de salas
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 1,
  equipment TEXT[], -- projetor, tv, quadro, etc
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de agendamentos
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  organizer_name TEXT NOT NULL,
  organizer_email TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (mesmo sendo público, é boa prática)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso público (sem autenticação)
CREATE POLICY "Anyone can view rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view bookings" 
ON public.bookings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update bookings" 
ON public.bookings 
FOR UPDATE 
USING (true);

-- Função para verificar conflitos de agendamento
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  room_id_param UUID,
  start_time_param TIMESTAMP WITH TIME ZONE,
  end_time_param TIMESTAMP WITH TIME ZONE,
  booking_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se existe conflito com outros agendamentos ativos
  RETURN EXISTS (
    SELECT 1 
    FROM public.bookings 
    WHERE room_id = room_id_param
      AND status = 'active'
      AND (booking_id_param IS NULL OR id != booking_id_param)
      AND (
        (start_time_param >= start_time AND start_time_param < end_time) OR
        (end_time_param > start_time AND end_time_param <= end_time) OR
        (start_time_param <= start_time AND end_time_param >= end_time)
      )
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger para prevenir conflitos
CREATE OR REPLACE FUNCTION public.prevent_booking_conflicts()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o horário de fim é posterior ao de início
  IF NEW.end_time <= NEW.start_time THEN
    RAISE EXCEPTION 'O horário de fim deve ser posterior ao horário de início';
  END IF;
  
  -- Verifica conflitos
  IF public.check_booking_conflict(NEW.room_id, NEW.start_time, NEW.end_time, NEW.id) THEN
    RAISE EXCEPTION 'Já existe um agendamento para esta sala neste horário';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_booking_conflicts
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_booking_conflicts();

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas salas de exemplo
INSERT INTO public.rooms (name, description, capacity, equipment) VALUES
('Sala de Reunião A', 'Sala com vista para o jardim', 8, ARRAY['projetor', 'quadro_branco', 'tv']),
('Sala de Reunião B', 'Sala executiva com mesa redonda', 6, ARRAY['projetor', 'sistema_audio', 'tv']),
('Auditório', 'Espaço para apresentações grandes', 30, ARRAY['projetor', 'sistema_audio', 'microfone', 'palco']),
('Sala de Videoconferência', 'Equipada para reuniões remotas', 4, ARRAY['tv', 'camera', 'microfone', 'sistema_audio']);