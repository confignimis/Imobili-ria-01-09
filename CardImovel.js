import { abrirWhatsApp, formatarPreco } from './config';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CORES, FONTES, ESPACAMENTO, RAIO, SOMBRA } from './tema';
import ImagemRemota from './ImagemRemota';
import { ehFavorito, alternarFavorito } from './favoritos';

export default function CardImovel({ item, aoAbrir, sessao, aoPrecisaLogin }) {
  const [favorito, setFavorito] = useState(false);

  useEffect(() => { ehFavorito(item.id).then(setFavorito); }, [item.id]);

  async function favoritar() {
    if (!sessao) { aoPrecisaLogin(); return; }
    setFavorito(await alternarFavorito(item.id));
  }

  function chamarWhatsApp() {
    const numero = item.corretor?.whatsapp;
    const msg = `Olá! Tenho interesse no imóvel "${item.titulo}"`;
    Linking.openURL(abrirWhatsApp(numero, msg));
  }

  function contatar() {
    const numero = item.corretor?.whatsapp;
    const msg = `Olá! Gostaria de mais informações e agendar uma visita ao imóvel "${item.titulo}"`;
    Linking.openURL(abrirWhatsApp(numero, msg));
  }

  return (
    <TouchableOpacity style={[estilos.card, SOMBRA.suave]} onPress={() => aoAbrir(item)} activeOpacity={0.9}>
      <View>
        <ImagemRemota uri={item.imagem_destaque} style={estilos.imagem} />
        <View style={estilos.tag}>
          <Text style={estilos.tagTexto}>{item.tipo_negocio === 'aluguel' ? 'ALUGUEL' : 'VENDA'}</Text>
        </View>
        <TouchableOpacity style={estilos.botaoCoracao} onPress={favoritar}>
          <Ionicons name={favorito ? 'heart' : 'heart-outline'} size={18} color={favorito ? '#e53e3e' : CORES.primaria} />
        </TouchableOpacity>
      </View>

      <View style={estilos.info}>
        <Text style={estilos.titulo} numberOfLines={1}>{item.titulo}</Text>
        <View style={estilos.linhaComIcone}>
          <Ionicons name="location-outline" size={13} color={CORES.textoMuted} />
          <Text style={estilos.local} numberOfLines={1}>{item.local}</Text>
        </View>

        <View style={estilos.atributos}>
          <View style={estilos.atributo}><Ionicons name="bed-outline" size={14} color={CORES.textoMuted} /><Text style={estilos.atributoTexto}>{item.quartos || 0}</Text></View>
          <View style={estilos.atributo}><Ionicons name="water-outline" size={14} color={CORES.textoMuted} /><Text style={estilos.atributoTexto}>{item.banheiros || 0}</Text></View>
          <View style={estilos.atributo}><Ionicons name="car-outline" size={14} color={CORES.textoMuted} /><Text style={estilos.atributoTexto}>{item.vagas || 0}</Text></View>
          <View style={estilos.atributo}><Ionicons name="expand-outline" size={14} color={CORES.textoMuted} /><Text style={estilos.atributoTexto}>{item.area || 0}m²</Text></View>
        </View>

        <Text style={estilos.preco}>R$ {formatarPreco(item.preco)}{item.tipo_negocio === 'aluguel' ? '/mês' : ''}</Text>

        <View style={estilos.rodapeBotoes}>
          <TouchableOpacity style={estilos.botaoWhats} onPress={chamarWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color={CORES.branco} />
            <Text style={estilos.botaoWhatsTexto}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.botaoContatar} onPress={contatar}>
            <Ionicons name="chatbubble-outline" size={15} color={CORES.destaque} />
            <Text style={estilos.botaoContatarTexto}>Contatar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  card: { backgroundColor: CORES.branco, borderRadius: RAIO.md, marginBottom: ESPACAMENTO.md, overflow: 'hidden' },
  imagem: { width: '100%', height: 170 },
  tag: { position: 'absolute', top: 12, left: 12, backgroundColor: CORES.primaria, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RAIO.sm },
  tagTexto: { color: CORES.branco, fontSize: 10, fontFamily: FONTES.semiBold, letterSpacing: 0.5 },
  botaoCoracao: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center' },
  info: { padding: ESPACAMENTO.md },
  titulo: { fontFamily: FONTES.semiBold, fontSize: 15, color: CORES.primaria },
  linhaComIcone: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  local: { fontSize: 12, color: CORES.textoMuted, fontFamily: FONTES.regular, flexShrink: 1 },
  atributos: { flexDirection: 'row', gap: 14, marginTop: 10 },
  atributo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  atributoTexto: { fontSize: 12, color: CORES.textoMuted, fontFamily: FONTES.regular },
  preco: { fontFamily: FONTES.bold, fontSize: 17, color: CORES.destaque, marginTop: 10 },
  rodapeBotoes: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botaoWhats: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: CORES.whatsapp, borderRadius: RAIO.sm, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  botaoWhatsTexto: { color: CORES.branco, fontFamily: FONTES.semiBold, fontSize: 12.5 },
  botaoContatar: { flex: 1, flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: CORES.destaque, borderRadius: RAIO.sm, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  botaoContatarTexto: { color: CORES.destaque, fontFamily: FONTES.semiBold, fontSize: 12.5 },
});