import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CORES, FONTES, ESPACAMENTO } from './tema';

const SECOES = [
  {
    titulo: '1. Introdução',
    texto: 'O aplicativo Civitare Imóveis valoriza a sua privacidade. Esta Política de Privacidade explica como coletamos, usamos e protegemos as suas informações pessoais ao utilizar o nosso aplicativo.',
  },
  {
    titulo: '2. Dados que coletamos',
    texto: 'Coletamos os dados fornecidos por você no momento do cadastro, como nome, e-mail, telefone e foto de perfil. Também armazenamos as informações dos imóveis que você anuncia e dos imóveis que você favorita.',
  },
  {
    titulo: '3. Uso das informações',
    texto: 'As suas informações são utilizadas para criar e gerenciar a sua conta, publicar e atualizar anúncios de imóveis, permitir o contato com a nossa equipe de corretores e melhorar a experiência dentro do aplicativo.',
  },
  {
    titulo: '4. Compartilhamento de dados',
    texto: 'Não vendemos, alugamos nem transferimos os seus dados pessoais para terceiros. As informações podem ser compartilhadas apenas com corretores e com a administração da imobiliária, dentro do necessário para viabilizar negociações e o funcionamento do serviço.',
  },
  {
    titulo: '5. Segurança',
    texto: 'Adotamos medidas técnicas e organizacionais para proteger os seus dados contra acessos não autorizados, alterações, divulgação ou destruição indevida.',
  },
  {
    titulo: '6. Seus direitos',
    texto: 'Você pode acessar, corrigir ou excluir os seus dados pessoais a qualquer momento. A exclusão da conta remove as suas informações do aplicativo, conforme previsto em lei.',
  },
  {
    titulo: '7. Alterações nesta política',
    texto: 'Esta Política de Privacidade pode ser atualizada periodicamente. Recomendamos a leitura regular desta página para se manter informado sobre como protegemos as suas informações.',
  },
  {
    titulo: '8. Contato',
    texto: 'Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados, entre em contato conosco por meio dos nossos canais de atendimento.',
  },
];

export default function TelaPrivacidade({ aoVoltar }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={estilos.tela}>
      <View style={[estilos.headerFixo, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={aoVoltar} style={estilos.botaoVoltarHeader}>
          <Ionicons name="arrow-back" size={22} color={CORES.primaria} />
          <Text style={estilos.botaoVoltarTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={estilos.titulo}>Política de Privacidade</Text>
        <Text style={estilos.atualizacao}>Última atualização: agosto de 2026</Text>

        {SECOES.map((secao, i) => (
          <View key={i} style={estilos.bloco}>
            <Text style={estilos.tituloSecao}>{secao.titulo}</Text>
            <Text style={estilos.textoSecao}>{secao.texto}</Text>
          </View>
        ))}

        <View style={{ height: ESPACAMENTO.lg }} />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.branco },
  headerFixo: { paddingBottom: 10, paddingHorizontal: ESPACAMENTO.md, backgroundColor: CORES.branco, borderBottomWidth: 1, borderBottomColor: CORES.borda, flexDirection: 'row' },
  botaoVoltarHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  botaoVoltarTexto: { fontFamily: FONTES.semiBold, fontSize: 15, color: CORES.primaria },
  conteudo: { padding: ESPACAMENTO.lg },
  titulo: { fontFamily: FONTES.bold, fontSize: 20, color: CORES.primaria, marginTop: 4 },
  atualizacao: { fontFamily: FONTES.regular, fontSize: 12, color: CORES.textoMuted, marginTop: 4 },
  bloco: { marginTop: ESPACAMENTO.lg },
  tituloSecao: { fontFamily: FONTES.semiBold, fontSize: 15, color: CORES.primaria, marginBottom: 6 },
  textoSecao: { fontFamily: FONTES.regular, fontSize: 13, color: CORES.textoMedio, lineHeight: 20 },
});
