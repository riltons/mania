import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Contacts from 'expo-contacts';
import styled from 'styled-components/native';
import { useTheme } from '@/contexts/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { TextInput } from './TextInput';

interface ContactPickerProps {
  onSelectContact: (contact: {
    name: string;
    phoneNumber: string;
    imageUri?: string;
  }) => void;
  onClose: () => void;
}

// Definindo nossa própria interface para contatos para evitar conflitos com a tipagem do Expo
interface ContactData {
  id: string;
  name: string;
  phoneNumbers?: { number: string | undefined }[];
  imageAvailable?: boolean;
  image?: { uri: string | undefined };
}

export function ContactPicker({ onSelectContact, onClose }: ContactPickerProps) {
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Image,
            Contacts.Fields.ID,
          ],
          sort: Contacts.SortTypes.FirstName,
        });

        if (data.length > 0) {
          console.log(`Carregados ${data.length} contatos`);
          // Filtrar contatos que têm número de telefone e converter para nosso tipo
          const contactsWithPhone = data
            .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
            .map(contact => ({
              id: contact.id || String(Math.random()),
              name: contact.name || 'Sem nome',
              phoneNumbers: contact.phoneNumbers?.map(phone => ({
                number: phone.number || ''
              })),
              imageAvailable: contact.imageAvailable,
              image: contact.image ? { uri: contact.image.uri || '' } : undefined
            }));
          
          console.log(`${contactsWithPhone.length} contatos com telefone encontrados`);
          setContacts(contactsWithPhone);
          setFilteredContacts(contactsWithPhone);
        } else {
          console.log('Nenhum contato encontrado');
        }
      } else {
        Alert.alert(
          'Permissão negada',
          'Não foi possível acessar seus contatos. Por favor, conceda permissão nas configurações do seu dispositivo.'
        );
        onClose();
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus contatos.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // busca por nome sem considerar acentos e/ou por telefone
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
      return;
    }
    const query = searchQuery.trim().toLowerCase();
    const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const numericQuery = query.replace(/\D/g, '');
    const filtered = contacts.filter(contact => {
      const name = contact.name.trim().toLowerCase();
      const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchesName = normalizedName.includes(normalizedQuery);
      const matchesPhone =
        numericQuery &&
        contact.phoneNumbers?.some(phoneObj =>
          (phoneObj.number ?? '').replace(/\D/g, '').includes(numericQuery)
        );
      return matchesName || matchesPhone;
    });
    console.log('[ContactPicker] search:', normalizedQuery, 'found:', filtered.length);
    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);

  const handleSelectContact = (contact: ContactData) => {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      Alert.alert('Erro', 'Este contato não possui número de telefone.');
      return;
    }

    // Se houver múltiplos números, usar o primeiro
    const phoneNumber = contact.phoneNumbers && contact.phoneNumbers.length > 0 && contact.phoneNumbers[0].number
      ? contact.phoneNumbers[0].number.replace(/\D/g, '')
      : '';
    
    onSelectContact({
      name: contact.name,
      phoneNumber,
      imageUri: contact.imageAvailable && contact.image ? contact.image.uri : undefined,
    });
    
    onClose();
  };

  const renderContactItem = ({ item }: { item: ContactData }) => (
    <ContactItem onPress={() => handleSelectContact(item)}>
      {item.imageAvailable && item.image ? (
        <ContactImage source={{ uri: item.image.uri }} />
      ) : (
        <ContactImagePlaceholder>
          <Ionicons name="person" size={24} color={colors.textPrimary} />
        </ContactImagePlaceholder>
      )}
      <ContactInfo>
        <ContactName>{item.name}</ContactName>
        {item.phoneNumbers && item.phoneNumbers.length > 0 && (
          <ContactPhone>{item.phoneNumbers[0].number}</ContactPhone>
        )}
      </ContactInfo>
    </ContactItem>
  );

  return (
    <Container>
      <Header>
        <Title>Selecionar Contato</Title>
        <CloseButton onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </CloseButton>
      </Header>

      <SearchContainer>
        <TextInput
          placeholder="Buscar contato..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </SearchContainer>

      {loading ? (
        <LoadingContainer>
          <Ionicons name="sync" size={40} color={colors.primary} />
          <LoadingText>Carregando contatos...</LoadingText>
        </LoadingContainer>
      ) : filteredContacts.length === 0 ? (
        <EmptyContainer>
          <Ionicons name="person-outline" size={50} color={colors.textSecondary} />
          <EmptyText>Nenhum contato encontrado</EmptyText>
          {contacts.length === 0 && (
            <Button 
              title="Tentar novamente" 
              onPress={loadContacts}
              variant="outline"
              style={{ marginTop: 16, width: '60%' }}
            />
          )}
        </EmptyContainer>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContactItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: ${({theme}) => theme.colors.backgroundDark};
  border-radius: 10px;
  overflow: hidden;
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: ${({theme}) => theme.colors.primary};
`;

const Title = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${({theme}) => theme.colors.textPrimary};
`;

const CloseButton = styled.TouchableOpacity`
  padding: 4px;
`;

const SearchContainer = styled.View`
  padding: 10px 16px;
`;

const ContactItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${({theme}) => theme.colors.border};
`;

const ContactImage = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 12px;
`;

const ContactImagePlaceholder = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-right: 12px;
  background-color: ${({theme}) => theme.colors.tertiary};
  justify-content: center;
  align-items: center;
`;

const ContactInfo = styled.View`
  flex: 1;
`;

const ContactName = styled.Text`
  font-size: 16px;
  font-weight: 500;
  color: ${({theme}) => theme.colors.textPrimary};
`;

const ContactPhone = styled.Text`
  font-size: 14px;
  color: ${({theme}) => theme.colors.textSecondary};
  margin-top: 4px;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const LoadingText = styled.Text`
  font-size: 16px;
  color: ${({theme}) => theme.colors.textPrimary};
  text-align: center;
  margin-top: 12px;
`;

const EmptyContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const EmptyText = styled.Text`
  font-size: 16px;
  color: ${({theme}) => theme.colors.textSecondary};
  text-align: center;
  margin-top: 12px;
  margin-bottom: 8px;
`;
