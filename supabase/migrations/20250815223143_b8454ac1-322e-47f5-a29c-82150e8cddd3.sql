-- Corrigir problemas de segurança adicionando search_path nas funções

-- Atualizar função check_booking_conflict
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  room_id_param UUID,
  start_time_param TIMESTAMP WITH TIME ZONE,
  end_time_param TIMESTAMP WITH TIME ZONE,
  booking_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Atualizar função prevent_booking_conflicts
CREATE OR REPLACE FUNCTION public.prevent_booking_conflicts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Atualizar função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;