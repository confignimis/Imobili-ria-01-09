import { formatarPreco } from './config';
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Dimensions, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CORES, FONTES, ESPACAMENTO, RAIO, SOMBRA } from './tema';
import ImagemRemota from './ImagemRemota';
import { listarFavoritos, alternarFavorito } from './favoritos';

const LARGURA_TELA = Dimensions.get('window').width;
const LARGURA_CARD = LARGURA_TELA * 0.62;

export default function TelaHome({
  imoveis, atualizando, aoAtualizar, aoBuscar, aoComprar, aoAlugar,
  aoAbrirImovel, aoVerTodos, aoAnunciar, sessao, aoPrecisaLogin,
}) {
  const [local, setLocal] = useState('');
  const [paginaAtiva, setPaginaAtiva] = useState(0);
  const [favoritosIds, setFavoritosIds] = useState([]);
  const scrollRef = useRef(null);

  const destaques = imoveis.slice(0, 6);

  useEffect(() => { listarFavoritos().then(setFavoritosIds); }, [imoveis]);

  async function aoFavoritar(id) {
    if (!sessao) {
      aoPrecisaLogin();
      return;
    }
    await alternarFavorito(id);
    setFavoritosIds(await listarFavoritos());
  }

  function aoClicarAnunciar() {
    if (!sessao) {
      aoPrecisaLogin();
      return;
    }
    aoAnunciar();
  }

  function aoRolarCarrossel(e) {
    const pagina = Math.round(e.nativeEvent.contentOffset.x / (LARGURA_CARD + ESPACAMENTO.md));
    setPaginaAtiva(pagina);
  }

  return (
    <ScrollView
      style={estilos.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={CORES.destaque} />}
    >
      <LinearGradient colors={[CORES.primaria, CORES.primariaClara]} style={estilos.hero}>
        <Text style={estilos.heroSaudacao}>Bem-vindo{sessao ? `, ${sessao.nome?.split(' ')[0]}` : ''} 👋</Text>
        <Text style={estilos.heroTitulo}>Encontre o imóvel{'\n'}dos seus sonhos</Text>
      </LinearGradient>

      <View style={[estilos.cardBusca, SOMBRA.media]}>
        <View style={estilos.inputBusca}>
          <Ionicons name="search" size={18} color={CORES.textoMuted} />
          <TextInput
            style={estilos.inputBuscaTexto}
            placeholder="Cidade, bairro ou endereço..."
            placeholderTextColor={CORES.textoMuted}
            value={local}
            onChangeText={setLocal}
          />
        </View>
        <TouchableOpacity style={estilos.botaoBuscar} onPress={() => aoBuscar(local)} activeOpacity={0.85}>
          <Ionicons name="options-outline" size={16} color={CORES.branco} />
          <Text style={estilos.botaoBuscarTexto}>Buscar com filtros</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.atalhos}>
        <TouchableOpacity style={estilos.atalho} onPress={aoComprar}>
          <View style={estilos.atalhoIcone}><Ionicons name="home-outline" size={20} color={CORES.destaque} /></View>
          <Text style={estilos.atalhoLabel}>Comprar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.atalho} onPress={aoAlugar}>
          <View style={estilos.atalhoIcone}><Ionicons name="key-outline" size={20} color={CORES.destaque} /></View>
          <Text style={estilos.atalhoLabel}>Alugar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.atalho} onPress={aoClicarAnunciar}>
          <View style={estilos.atalhoIcone}><Ionicons name="business-outline" size={20} color={CORES.destaque} /></View>
          <Text style={estilos.atalhoLabel}>Anunciar</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.secaoHeader}>
        <View>
          <Text style={estilos.secaoTitulo}>Em destaque</Text>
          <Text style={estilos.secaoSubtitulo}>Selecionados para você</Text>
        </View>
        <TouchableOpacity onPress={aoVerTodos}>
          <Text style={estilos.verTudo}>Ver tudo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={LARGURA_CARD + ESPACAMENTO.md}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: ESPACAMENTO.md }}
        onScroll={aoRolarCarrossel}
        scrollEventThrottle={16}
      >
        {destaques.map((item) => {
          const favoritado = favoritosIds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[estilos.cardDestaque, SOMBRA.suave]}
              onPress={() => aoAbrirImovel(item)}
              activeOpacity={0.9}
            >
              <ImagemRemota uri={item.imagem_destaque} style={estilos.imagemDestaque} />
              <View style={estilos.tagDestaque}>
                <Text style={estilos.tagDestaqueTexto}>{item.tipo_negocio === 'aluguel' ? 'ALUGUEL' : 'VENDA'}</Text>
              </View>
              <TouchableOpacity style={estilos.botaoCoracao} onPress={() => aoFavoritar(item.id)}>
                <Ionicons name={favoritado ? 'heart' : 'heart-outline'} size={16} color={favoritado ? '#e53e3e' : CORES.primaria} />
              </TouchableOpacity>
              <View style={estilos.infoDestaque}>
                <Text style={estilos.tituloDestaque} numberOfLines={1}>{item.titulo}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }}>
                  <Ionicons name="location-outline" size={12} color={CORES.textoMuted} />
                  <Text style={estilos.localDestaque} numberOfLines={1}>{item.local}</Text>
                </View>
                <Text style={estilos.precoDestaque}>R$ {formatarPreco(item.preco)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={estilos.pontosPaginacao}>
        {destaques.map((_, i) => (
          <View key={i} style={[estilos.ponto, i === paginaAtiva && estilos.pontoAtivo]} />
        ))}
      </View>

      <View style={estilos.bannerWrapper}>
        <LinearGradient colors={[CORES.destaque, CORES.destaqueHover]} style={estilos.banner}>
          <Ionicons name="megaphone-outline" size={26} color={CORES.branco} />
          <Text style={estilos.bannerTitulo}>Quer vender ou alugar{'\n'}o seu imóvel?</Text>
          <TouchableOpacity style={estilos.bannerBotao} onPress={aoClicarAnunciar}>
            <Text style={estilos.bannerBotaoTexto}>Anuncie conosco</Text>
            <Ionicons name="arrow-forward" size={15} color={CORES.destaque} />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={{ paddingHorizontal: ESPACAMENTO.md, marginTop: ESPACAMENTO.lg }}>
        <Text style={estilos.secaoTitulo}>Por que a Civitare</Text>
        <Text style={[estilos.secaoSubtitulo, { marginBottom: ESPACAMENTO.md }]}>Confiança em cada etapa</Text>

        {[
          ['headset-outline', 'Atendimento Personalizado', 'Um corretor com você do primeiro contato até a assinatura.'],
          ['shield-checkmark-outline', 'Imóveis Verificados', 'Documentação conferida antes do anúncio ir ao ar.'],
          ['document-text-outline', 'Suporte Jurídico Completo', 'Contratos e burocracia resolvidos por quem entende.'],
          ['ribbon-outline', 'Anos de Experiência', 'Tradição no mercado local, com negócios fechados com sucesso.'],
        ].map(([icone, titulo, texto], i) => (
          <View key={i} style={[estilos.cardDiferencial, SOMBRA.suave]}>
            <View style={estilos.iconeDiferencialFundo}>
              <Ionicons name={icone} size={20} color={CORES.destaque} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloDiferencial}>{titulo}</Text>
              <Text style={estilos.textoDiferencial}>{texto}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: ESPACAMENTO.xxl }} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: ESPACAMENTO.md, paddingTop: ESPACAMENTO.lg, paddingBottom: ESPACAMENTO.xxl },
  heroSaudacao: { color: '#a9b6c4', fontFamily: FONTES.regular, fontSize: 13 },
  heroTitulo: { color: CORES.branco, fontFamily: FONTES.bold, fontSize: 26, marginTop: 6, lineHeight: 34 },
  cardBusca: { backgroundColor: CORES.branco, marginHorizontal: ESPACAMENTO.md, marginTop: -32, borderRadius: RAIO.lg, padding: ESPACAMENTO.md },
  inputBusca: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CORES.fundo, borderRadius: RAIO.md, paddingHorizontal: 14, height: 46 },
  inputBuscaTexto: { flex: 1, fontFamily: FONTES.regular, color: CORES.textoEscuro, fontSize: 14 },
  botaoBuscar: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: CORES.destaque, borderRadius: RAIO.md, height: 46, marginTop: 10 },
  botaoBuscarTexto: { color: CORES.branco, fontFamily: FONTES.semiBold, fontSize: 14 },
  atalhos: { flexDirection: 'row', justifyContent: 'space-around', marginTop: ESPACAMENTO.lg, paddingHorizontal: ESPACAMENTO.md },
  atalho: { alignItems: 'center', gap: 6 },
  atalhoIcone: { width: 52, height: 52, borderRadius: RAIO.md, backgroundColor: CORES.destaqueSuave, justifyContent: 'center', alignItems: 'center' },
  atalhoLabel: { fontFamily: FONTES.medio, fontSize: 12, color: CORES.textoMedio },
  secaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: ESPACAMENTO.md, marginTop: ESPACAMENTO.xl, marginBottom: ESPACAMENTO.md },
  secaoTitulo: { fontFamily: FONTES.bold, fontSize: 19, color: CORES.primaria },
  secaoSubtitulo: { fontFamily: FONTES.regular, fontSize: 12, color: CORES.textoMuted, marginTop: 2 },
  verTudo: { fontFamily: FONTES.semiBold, fontSize: 13, color: CORES.destaque },
  cardDestaque: { width: LARGURA_CARD, backgroundColor: CORES.branco, borderRadius: RAIO.md, marginRight: ESPACAMENTO.md, overflow: 'hidden' },
  imagemDestaque: { width: '100%', height: 140 },
  tagDestaque: { position: 'absolute', top: 10, left: 10, backgroundColor: CORES.primaria, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RAIO.sm },
  tagDestaqueTexto: { color: CORES.branco, fontSize: 9, fontFamily: FONTES.semiBold, letterSpacing: 0.5 },
  botaoCoracao: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  infoDestaque: { padding: ESPACAMENTO.sm + 4 },
  tituloDestaque: { fontFamily: FONTES.semiBold, fontSize: 13.5, color: CORES.primaria },
  localDestaque: { fontFamily: FONTES.regular, fontSize: 11, color: CORES.textoMuted, flexShrink: 1 },
  precoDestaque: { fontFamily: FONTES.bold, fontSize: 15, color: CORES.destaque, marginTop: 6 },
  pontosPaginacao: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: ESPACAMENTO.sm },
  ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: CORES.borda },
  pontoAtivo: { backgroundColor: CORES.destaque, width: 18 },
  bannerWrapper: { paddingHorizontal: ESPACAMENTO.md, marginTop: ESPACAMENTO.xl },
  banner: { borderRadius: RAIO.lg, padding: ESPACAMENTO.lg },
  bannerTitulo: { color: CORES.branco, fontFamily: FONTES.bold, fontSize: 18, marginTop: 10, lineHeight: 24 },
  bannerBotao: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: CORES.branco, alignSelf: 'flex-start', borderRadius: RAIO.pill, paddingHorizontal: 16, paddingVertical: 10, marginTop: ESPACAMENTO.md },
  bannerBotaoTexto: { color: CORES.destaque, fontFamily: FONTES.semiBold, fontSize: 13 },
  cardDiferencial: { flexDirection: 'row', gap: ESPACAMENTO.md, backgroundColor: CORES.branco, borderRadius: RAIO.md, padding: ESPACAMENTO.md, marginBottom: ESPACAMENTO.sm, alignItems: 'center' },
  iconeDiferencialFundo: { width: 44, height: 44, borderRadius: RAIO.sm, backgroundColor: CORES.destaqueSuave, justifyContent: 'center', alignItems: 'center' },
  tituloDiferencial: { fontFamily: FONTES.semiBold, fontSize: 14, color: CORES.primaria },
  textoDiferencial: { fontFamily: FONTES.regular, fontSize: 12, color: CORES.textoMuted, marginTop: 2, lineHeight: 17 },
});