-- Adiciona coluna disabled para controlar comunidades desabilitadas
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;
