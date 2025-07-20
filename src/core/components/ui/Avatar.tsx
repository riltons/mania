import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  size: number;
  source?: { uri?: string } | null;
  fallbackText?: string;
  borderColor?: string;
}

export const Avatar = ({ 
  size, 
  source, 
  fallbackText = '', 
  borderColor = '#8257E5' 
}: AvatarProps) => {
  const hasValidSource = source && source.uri;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: borderColor,
  };

  const textStyle = {
    fontSize: size * 0.4,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {hasValidSource ? (
        <Image 
          source={source!} 
          style={[styles.image, { borderRadius: size / 2 }]} 
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.fallbackText, textStyle]}>
          {fallbackText.toUpperCase()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6E6F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    fontWeight: 'bold',
    color: '#8257E5',
  },
});
