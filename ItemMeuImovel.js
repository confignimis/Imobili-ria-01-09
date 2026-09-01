import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CORES, FONTES, ESPACAMENTO, RAIO } from './tema';
import { formatarPreco } from './config';
import ImagemRemota from './ImagemRemota';

const STATUS_INFO = {
  publish: { label: 'Publicado', cor: '#1ebd5a' },
  pending: { label: 'Pendente', cor: '#e0a020' },
  draft:   { label: 'Excluído', cor: '#8a8f98' },
};

export default function ItemMeuImovel({ item, aoEditar, aoExcluir }) {
  const status = STATUS_INFO[item.status_post] || STATUS_INFO.pending;
  const excluido = item.status_post === 'draft';

  function confirmarExclusao() {
    Alert.alert(
      'Excluir imóvel',
      `Tem certeza que deseja excluir "${item.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => aoExcluir(item.id) },
      ]
    );
  }

  return (
    <View style={[estilos.card, excluido && estilos.cardExcluido]}>
      <ImagemRemota uri={item.imagem_destaque} style={estilos.imagem} />
      <View style={estilos.info}>
        <View style={estilos.linhaTopo}>
          <Text style={estilos.titulo} numberOfLines={1}>{item.titulo}</Text>
          <View style={[estilos.badge, { backgroundColor: status.cor }]}>
            <Text style={estilos.badgeTexto}>{status.label}</Text>
          </View>
        </View>
        <Text style={estilos.preco}>R$ {formatarPreco(item.preco)}</Text>

        {!excluido && (
          <View style={estilos.acoes}>
            <TouchableOpacity style={estilos.botaoAcao} onPress={() => aoEditar(item)}>
              <Ionicons name="create-outline" size={16} color={CORES.destaque} />
              <Text style={estilos.botaoAcaoTexto}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.botaoAcao} onPress={confirmarExclusao}>
              <Ionicons name="trash-outline" size={16} color="#e53e3e" />
              <Text style={[estilos.botaoAcaoTexto, { color: '#e53e3e' }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: CORES.branco, borderRadius: RAIO.md, borderWidth: 1, borderColor: CORES.borda, overflow: 'hidden', marginBottom: ESPACAMENTO.sm },
  cardExcluido: { opacity: 0.55 },
  imagem: { width: 90, height: 90 },
  info: { flex: 1, padding: ESPACAMENTO.sm + 2 },
  linhaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  titulo: { flex: 1, fontFamily: FONTES.semiBold, fontSize: 13.5, color: CORES.primaria },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RAIO.pill },
  badgeTexto: { color: CORES.branco, fontSize: 9.5, fontFamily: FONTES.semiBold },
  preco: { fontFamily: FONTES.bold, fontSize: 14, color: CORES.destaque, marginTop: 4 },
  acoes: { flexDirection: 'row', gap: 14, marginTop: 8 },
  botaoAcao: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  botaoAcaoTexto: { fontFamily: FONTES.medio, fontSize: 12, color: CORES.destaque },
});