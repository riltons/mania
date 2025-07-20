import React, { useState, useEffect } from 'react';
import { TextInput, TextInputProps, Text, View, StyleSheet } from 'react-native';
import { useTheme } from 'styled-components/native';

interface PhoneInputProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    label?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChangeText,
    label = 'Celular',
    ...props
}) => {
    const theme = useTheme();
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Formata o valor para exibição
        const numericValue = value.replace(/\D/g, '');
        let formattedValue = '';
        
        if (numericValue.length > 0) {
            formattedValue = `(${numericValue.slice(0, 2)}`;
            
            if (numericValue.length > 2) {
                formattedValue += `) ${numericValue.slice(2, 7)}`;
                
                if (numericValue.length > 7) {
                    formattedValue += `-${numericValue.slice(7, 11)}`;
                } else if (numericValue.length > 6) {
                    formattedValue += `-${numericValue.slice(6)}`;
                }
            } else {
                formattedValue = numericValue;
            }
        }
        
        setDisplayValue(formattedValue);
    }, [value]);

    const handleChangeText = (text: string) => {
        // Remove qualquer caractere que não seja número
        const numericValue = text.replace(/\D/g, '');
        
        // Limita a 11 dígitos
        const limitedValue = numericValue.slice(0, 11);
        
        // Chama a função de mudança com o valor limpo
        onChangeText(limitedValue);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {label}
            </Text>
            <TextInput
                {...props}
                value={displayValue}
                onChangeText={handleChangeText}
                keyboardType="phone-pad"
                maxLength={15} // (00) 00000-0000 = 15 caracteres
                placeholder="(00) 00000-0000"
                placeholderTextColor={theme.colors.textSecondary}
                style={[
                    styles.input,
                    { 
                        color: theme.colors.textPrimary,
                        backgroundColor: theme.colors.backgroundDark,
                        borderColor: theme.colors.backgroundLight
                    }
                ]}
            />
            <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                Digite apenas números (DDD + número)
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
    },
});
