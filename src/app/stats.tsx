import React from 'react';
import { View, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from 'styled-components/native';
import TopJogadores from '@/app/(pages)/top-jogadores/index';
import TopDuplas from '@/app/top-duplas/index';

const Container = styled.View`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.backgroundDark};
`;

const ScrollContent = styled.ScrollView`
    flex: 1;
`;

const Section = styled.View`
    margin-bottom: 30px;
`;

export default function StatsPage() {
    const { colors } = useTheme();

    return (
        <Container>
            <ScrollContent showsVerticalScrollIndicator={false}>
                <Section>
                    <TopJogadores />
                </Section>
                <Section>
                    <TopDuplas />
                </Section>
            </ScrollContent>
        </Container>
    );
}
