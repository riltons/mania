import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Modal, ToastAndroid, Platform, TouchableOpacity, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { ThemeProps } from '@/styles/styled';
import { playerService } from '../services/playerService';
import { playerRpcService, normalizePhoneNumber } from '../services/playerRpcService';
import { communityMembersService } from '@/features/communities/services/communityMembersService';
import { communityService } from '@/features/communities/services/communityService';
import { Community } from '@/features/communities/services/communityService';
import { Header } from '@/components/layout/Header';
import { useRouter } from 'expo-router';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { ContactPicker } from '@/components/ContactPicker';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import { supabase } from '@/core/lib/supabase';

export default function NewPlayer() {
    const router = useRouter();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [hasContactPermission, setHasContactPermission] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        phone: ''
    });
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
    
    useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            setHasContactPermission(status === 'granted');
            
            if (status !== 'granted') {
                if (Platform.OS === 'android') {
                    ToastAndroid.show('Permissão para acessar contatos negada', ToastAndroid.SHORT);
                } else {
                    Alert.alert('Permissão negada', 'Não foi possível acessar seus contatos.');
                }
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { created, organized } = await communityService.list(false);
                setCommunities([...created, ...organized]);
            } catch (error) {
                console.error('Erro ao carregar comunidades:', error);
                Alert.alert('Erro', 'Não foi possível carregar as comunidades');
            }
        })();
    }, []);

    const handleSelectContact = (contact: { name: string; phoneNumber: string; imageUri?: string }) => {
        setFormData(prev => ({
            ...prev,
            name: contact.name,
            phone: contact.phoneNumber
        }));
        
        if (contact.imageUri) {
            setAvatarUri(contact.imageUri);
        }
        
        setShowContactPicker(false);
    };
    
    const handlePickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.granted === false) {
                Alert.alert('Permissão negada', 'É necessário permitir o acesso à galeria para selecionar uma foto.');
                return;
            }
            
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            
            if (!result.canceled) {
                setAvatarUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
        }
    };
    
    const handleSubmit = async () => {
        try {
            setLoading(true);

            if (!formData.name.trim()) {
                Alert.alert('Erro', 'O nome é obrigatório');
                setLoading(false);
                return;
            }

            if (!formData.phone.trim()) {
                Alert.alert('Erro', 'O celular é obrigatório');
                setLoading(false);
                return;
            }
            
            // Primeiro verificamos se já existe um jogador com este telefone
            // usando a busca robusta por RPC
            console.log('Verificando se jogador já existe antes de criar...');
            const existingPlayer = await playerRpcService.findPlayerByPhone(formData.phone);
            
            if (existingPlayer) {
                console.log('Jogador encontrado com telefone:', formData.phone, 'ID:', existingPlayer.id);
                
                // Obtém a sessão atual para vincular o jogador ao usuário
                const { data: { session } } = await supabase.auth.getSession();
                const currentUserId = session?.user?.id;
                
                if (!currentUserId) {
                    Alert.alert('Erro', 'Usuário não autenticado');
                    setLoading(false);
                    return;
                }
                
                // Vincula o jogador existente ao usuário atual
                const linked = await playerRpcService.linkPlayerToUser(
                    existingPlayer.id,
                    currentUserId
                );
                
                if (linked) {
                    Alert.alert('Sucesso', 'Jogador existente vinculado com sucesso!');
                    setLoading(false);
                    
                    // Volta para a tela anterior
                    router.back();
                    return;
                }
            }
            
            // Se não encontrou jogador existente, continua com a criação normal
            // Normaliza o telefone usando a função especializada com tratamento de erros
            let normalizedPhone: string;
            try {
                normalizedPhone = normalizePhoneNumber(formData.phone);
                console.log('Telefone normalizado com sucesso:', normalizedPhone);
            } catch (error) {
                const errorMessage = (error as Error).message;
                console.error('Erro ao normalizar telefone:', errorMessage);
                
                // Mensagens de erro personalizadas baseadas no tipo de erro
                if (errorMessage.includes('deve ter exatamente 11 dígitos')) {
                    Alert.alert('Telefone inválido', 'O número de telefone deve ter exatamente 11 dígitos no formato brasileiro (DDD + 9 + número)');
                } else if (errorMessage.includes('terceiro dígito deve ser 9')) {
                    Alert.alert('Telefone inválido', 'O terceiro dígito do telefone deve ser 9, conforme padrão brasileiro atual');
                } else if (errorMessage.includes('DDD')) {
                    Alert.alert('Telefone inválido', 'O DDD informado não é válido no Brasil. Deve estar entre 11 e 99.');
                } else {
                    Alert.alert('Telefone inválido', errorMessage || 'Formato de telefone brasileiro inválido');
                }
                
                setLoading(false);
                return;
            }
            
            const playerData: {
                name: string;
                nickname?: string;
                phone: string;
                avatar_url?: string;
            } = {
                name: formData.name.trim(),
                phone: normalizedPhone,
            };
            
            // Adicionar apelido se existir
            if (formData.nickname.trim()) {
                playerData.nickname = formData.nickname.trim();
            }
            
            // Adicionar avatar se existir
            if (avatarUri) {
                // Aqui você poderia fazer upload da imagem para o storage
                // e depois adicionar a URL ao playerData
                // Por enquanto, vamos apenas simular isso
                // playerData.avatar_url = avatarUri;
            }

            const newPlayer = await playerService.create(playerData);
            if (selectedCommunities.length > 0) {
                for (const communityId of selectedCommunities) {
                    await communityMembersService.addMember(communityId, newPlayer.id);
                }
            }

            Alert.alert('Sucesso', 'Jogador criado com sucesso');
            router.back();
        } catch (error: any) {
            console.error('Erro ao criar jogador:', error);
            Alert.alert('Erro', error.message || 'Erro ao criar jogador');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Header title="Novo Jogador" />

            <Content>
                <Form>
                    <AvatarContainer>
                        {avatarUri ? (
                            <Avatar source={{ uri: avatarUri }} />
                        ) : (
                            <AvatarPlaceholder onPress={handlePickImage}>
                                <Ionicons name="camera" size={40} color={colors.textSecondary} />
                            </AvatarPlaceholder>
                        )}
                        <AvatarLabel>Adicionar foto</AvatarLabel>
                    </AvatarContainer>

                    <TextInput
                        label="Nome"
                        placeholder="Nome do jogador"
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    />

                    <TextInput
                        label="Celular"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChangeText={(text) => {
                            // Remove tudo que não for número
                            const numbersOnly = text.replace(/\D/g, '');
                            
                            // Limita a 11 caracteres numéricos
                            const limited = numbersOnly.slice(0, 11);
                            
                            // Aplica máscara de formato brasileiro
                            let formatted = limited;
                            
                            // Formato: (XX) XXXXX-XXXX
                            if (limited.length > 0) {
                                // Adiciona parênteses para o DDD
                                if (limited.length <= 2) {
                                    formatted = `(${limited}`;
                                } 
                                // Adiciona fechamento do DDD e espaço
                                else if (limited.length <= 7) {
                                    formatted = `(${limited.substring(0, 2)}) ${limited.substring(2)}`;
                                } 
                                // Formato completo com hífen
                                else {
                                    formatted = `(${limited.substring(0, 2)}) ${limited.substring(2, 7)}-${limited.substring(7)}`;
                                }
                            }
                            
                            console.log(`Formatando telefone: ${numbersOnly} -> ${formatted}`);
                            setFormData(prev => ({ ...prev, phone: formatted }));
                        }}
                        keyboardType="phone-pad"
                        maxLength={15} // Mantém 15 para a máscara (11 números + 4 caracteres de formatação)
                    />
                    
                    <ContactButton 
                        onPress={() => {
                            if (hasContactPermission) {
                                setShowContactPicker(true);
                            } else {
                                Alert.alert(
                                    'Permissão necessária', 
                                    'Para selecionar contatos, você precisa permitir o acesso aos seus contatos.',
                                    [
                                        { text: 'Cancelar', style: 'cancel' },
                                        { 
                                            text: 'Permitir', 
                                            onPress: async () => {
                                                const { status } = await Contacts.requestPermissionsAsync();
                                                setHasContactPermission(status === 'granted');
                                                if (status === 'granted') {
                                                    setShowContactPicker(true);
                                                }
                                            } 
                                        }
                                    ]
                                );
                            }
                        }}
                    >
                        <ContactButtonIcon>
                            <Ionicons name="people" size={24} color={colors.white} />
                        </ContactButtonIcon>
                        <ContactButtonText>Adicionar da Agenda</ContactButtonText>
                    </ContactButton>

                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>
                        Comunidades
                    </Text>
                    {communities.map(c => (
                        <TouchableOpacity
                            key={c.id}
                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                            onPress={() => setSelectedCommunities(prev =>
                                prev.includes(c.id)
                                    ? prev.filter(id => id !== c.id)
                                    : [...prev, c.id]
                            )}
                        >
                            <Feather
                                name={selectedCommunities.includes(c.id) ? 'check-square' : 'square'}
                                size={20}
                                color={colors.text}
                            />
                            <Text style={{ marginLeft: 8, color: colors.text }}>{c.name}</Text>
                        </TouchableOpacity>
                    ))}
                    <Button
                        title="Criar Jogador"
                        onPress={handleSubmit}
                        loading={loading}
                        style={{ marginTop: 16 }}
                    />
                </Form>
                
                <Modal
                    visible={showContactPicker}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowContactPicker(false)}
                >
                    <ModalContainer>
                        <ModalContent>
                            <ContactPicker 
                                onSelectContact={handleSelectContact}
                                onClose={() => setShowContactPicker(false)}
                            />
                        </ModalContent>
                    </ModalContainer>
                </Modal>
            </Content>
            <NavigationContainer>
                <BottomNavigation />
            </NavigationContainer>
        </Container>
    );
}

const Container = styled.View<ThemeProps>`
    flex: 1;
    background-color: ${(props: ThemeProps) => props.theme.colors.backgroundDark};
`;

const Content = styled.ScrollView.attrs<ThemeProps>({
    contentContainerStyle: {
        padding: 20,
        paddingBottom: 80,
    },
})`
    flex: 1;
`;

const Form = styled.View`
    gap: 16px;
`;

const AvatarLabel = styled.Text<ThemeProps>`
    color: ${(props: ThemeProps) => props.theme.colors.textSecondary};
    font-size: 14px;
    margin-top: 8px;
`;

const ContactButton = styled.TouchableOpacity<ThemeProps>`
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: ${(props: ThemeProps) => props.theme.colors.accent};
    padding: 14px 16px;
    border-radius: 8px;
    margin-top: 16px;
    margin-bottom: 8px;
`;

const ContactButtonIcon = styled.View`
    margin-right: 10px;
`;

const ContactButtonText = styled.Text<ThemeProps>`
    color: ${(props: ThemeProps) => props.theme.colors.textPrimary};
    font-size: 16px;
    font-weight: 500;
`;

const ModalContainer = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 20px;
`;

const ModalContent = styled.View<ThemeProps>`
    width: 100%;
    height: 80%;
    background-color: ${(props: ThemeProps) => props.theme.colors.backgroundDark};
    border-radius: 10px;
    overflow: hidden;
`;

const AvatarContainer = styled.View`
    align-items: center;
    margin-bottom: 16px;
`;

const Avatar = styled.Image<ThemeProps>`
    width: 100px;
    height: 100px;
    border-radius: 50px;
    border-width: 2px;
    border-color: ${(props: ThemeProps) => props.theme.colors.primary};
`;

const AvatarPlaceholder = styled.TouchableOpacity<ThemeProps>`
    width: 100px;
    height: 100px;
    border-radius: 50px;
    border-width: 2px;
    border-color: ${(props: ThemeProps) => props.theme.colors.border};
    background-color: ${(props: ThemeProps) => props.theme.colors.backgroundLight};
    justify-content: center;
    align-items: center;
`;

const NavigationContainer = styled.View<ThemeProps>`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: ${(props: ThemeProps) => props.theme.colors.backgroundMedium};
    border-top-width: 1px;
    border-top-color: ${(props: ThemeProps) => props.theme.colors.border};
    height: 60px;
`;

