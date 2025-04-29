import React from 'react';
import { View, Image } from 'react-native';
import styled from 'styled-components/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeProvider';

interface PlayerAvatarProps {
  avatarUrl?: string | null;
  size?: number;
  name?: string;
}

/**
 * Componente que exibe a foto do jogador ou um avatar humanizado quando não há foto
 */
export function PlayerAvatar({ avatarUrl, size = 50, name }: PlayerAvatarProps) {
  const { colors } = useTheme();
  
  // Gera uma cor consistente baseada no nome do jogador
  const getColorFromName = (name?: string) => {
    if (!name) return colors.accent;
    
    // Gera um hash simples a partir do nome
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Converte o hash para uma cor HSL com saturação e luminosidade fixas
    // para garantir cores agradáveis
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 60%)`;
  };
  
  // Obtém as iniciais do nome do jogador
  const getInitials = (name?: string) => {
    if (!name) return "";
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const backgroundColor = getColorFromName(name);
  const initials = getInitials(name);

  return (
    <AvatarContainer size={size} backgroundColor={avatarUrl ? 'transparent' : backgroundColor}>
      {avatarUrl ? (
        <AvatarImage 
          source={{ uri: avatarUrl }} 
          size={size}
          resizeMode="cover"
        />
      ) : initials ? (
        <InitialsText size={size}>{initials}</InitialsText>
      ) : (
        <FontAwesome5 name="user-alt" size={size * 0.4} color="white" />
      )}
    </AvatarContainer>
  );
}

const AvatarContainer = styled.View<{ size: number, backgroundColor: string }>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: ${props => props.size / 2}px;
  background-color: ${props => props.backgroundColor};
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const AvatarImage = styled.Image<{ size: number }>`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: ${props => props.size / 2}px;
`;

const InitialsText = styled.Text<{ size: number }>`
  color: white;
  font-size: ${props => props.size * 0.4}px;
  font-weight: bold;
`;