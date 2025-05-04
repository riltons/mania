-- Permitir valores nulos nos campos do perfil
ALTER TABLE public.user_profiles
ALTER COLUMN full_name DROP NOT NULL,
ALTER COLUMN nickname DROP NOT NULL,
ALTER COLUMN phone_number DROP NOT NULL;
