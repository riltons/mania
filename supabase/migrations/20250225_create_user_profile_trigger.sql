-- Criar função para criar perfil do usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, nickname, phone_number)
  VALUES (new.id, NULL, NULL, NULL);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'player');
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Criar perfis para usuários existentes que não têm perfil
INSERT INTO public.user_profiles (user_id, full_name, nickname, phone_number)
SELECT id, NULL, NULL, NULL
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.user_profiles p 
    WHERE p.user_id = u.id
);

-- Criar papéis para usuários existentes que não têm papel
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'player'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.user_roles r 
    WHERE r.user_id = u.id
);
