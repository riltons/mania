-- Garante permissões para a função get_shared_players
GRANTE EXECUTE ON FUNCTION public.get_shared_players(uuid) TO authenticated, service_role;

-- Garante permissões nas tabelas necessárias
GRANTE SELECT ON TABLE public.players TO authenticated;
GRANTE SELECT ON TABLE public.user_player_relations TO authenticated;
