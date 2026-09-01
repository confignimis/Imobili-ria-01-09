// ============================================================
// ARQUIVO: TelaDetalhe.js  (substitua o arquivo inteiro)
// ============================================================
import { Modal, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, TextInput, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { CORES, FONTES, ESPACAMENTO, RAIO, SOMBRA } from './tema';
import ImagemRemota from './ImagemRemota';
import { ehFavorito, alternarFavorito } from './favoritos';
import { abrirWhatsApp } from './config';
const LARGURA_TELA = Dimensions.get('window').width;

function parseValorBR(texto) {
  if (!texto) return 0;
  const limpo = String(texto).replace(/\./g, '').replace(',', '.');
  const numero = parseFloat(limpo);
  return isNaN(numero) ? 0 : numero;
}

function formatarMoeda(valor) {
  return 'R$ ' + Math.round(valor).toLocaleString('pt-BR');
}

function limparDescricao(html) {
  if (!html) return '';
  return html
    .replace(/<\/?[a-zA-Z][^<>]*>/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&hellip;/gi, '…')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&lsquo;|&rsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function TelaDetalhe({ item, todosImoveis, aoVoltar, aoAbrirImovel, sessao, aoPrecisaLogin }) {
  const insets = useSafeAreaInsets();
  const [telaCheiaAberta, setTelaCheiaAberta] = useState(false);
  const [favorito, setFavorito] = useState(false);
  const [fotoAtual, setFotoAtual] = useState(0);
  const [simValor, setSimValor] = useState(String(Math.round(parseValorBR(item.preco))));
  const [simEntrada, setSimEntrada] = useState('20');
  const [simJuros, setSimJuros] = useState('10.5');
  const [simPrazo, setSimPrazo] = useState('30');
  const [coordenadas, setCoordenadas] = useState(null);

  useEffect(() => { ehFavorito(item.id).then(setFavorito); }, [item.id]);

  useEffect(() => {
    let ativo = true;
    setCoordenadas(null);
    if (Platform.OS === 'web' || !item.local) return undefined;

    (async () => {
      try {
        const resultados = await Location.geocodeAsync(item.local);
        if (ativo && resultados && resultados.length > 0) {
          setCoordenadas({ latitude: resultados[0].latitude, longitude: resultados[0].longitude });
        }
      } catch (e) {
        // Geocodificação indisponível/sem permissão
      }
    })();

    return () => { ativo = false; };
  }, [item.local]);

  async function aoFavoritar() {
    if (!sessao) { aoPrecisaLogin(); return; }
    setFavorito(await alternarFavorito(item.id));
  }

  function abrirMapaExterno() {
    const endereco = encodeURIComponent(item.local || item.titulo);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${endereco}`);
  }

  function fotoAnterior() {
    setFotoAtual((atual) => (atual === 0 ? fotos.length - 1 : atual - 1));
  }
  function proximaFoto() {
    setFotoAtual((atual) => (atual === fotos.length - 1 ? 0 : atual + 1));
  }

  function abrirWhatsAppInteresse() {
    const msg = `Olá! Tenho interesse no imóvel "${item.titulo}"`;
    Linking.openURL(abrirWhatsApp(item.corretor?.whatsapp, msg));
  }

  const valor = parseFloat(simValor) || 0;
  const entradaPct = parseFloat(simEntrada) || 0;
  const jurosAno = parseFloat(simJuros) || 0;
  const prazoAnos = parseFloat(simPrazo) || 0;
  const valorFinanciado = valor - valor * (entradaPct / 100);
  const meses = prazoAnos * 12;
  const taxaMensal = Math.pow(1 + jurosAno / 100, 1 / 12) - 1;
  const parcela = taxaMensal > 0 && meses > 0
    ? valorFinanciado * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -meses)))
    : meses > 0 ? valorFinanciado / meses : 0;

  const fotos = item.imagem_destaque ? [item.imagem_destaque, ...(item.galeria || [])] : (item.galeria || []);
  const descricaoLimpa = item.resumo && item.resumo.trim() ? item.resumo : limparDescricao(item.descricao);
  const relacionados = (todosImoveis || []).filter((i) => i.id !== item.id && i.tipo_negocio === item.tipo_negocio).slice(0, 4);
  const preco = parseValorBR(item.preco);
  const condominio = parseValorBR(item.condominio);
  const iptu = parseValorBR(item.iptu);
  const totalPrevisto = parseValorBR(item.valor_total) || preco + condominio + iptu;

  return (
    <View style={estilos.tela}>
      <View style={[estilos.headerFixo, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={aoVoltar} style={estilos.botaoVoltarHeader}>
          <Ionicons name="arrow-back" size={22} color={CORES.primaria} />
          <Text style={estilos.botaoVoltarTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
        {fotos.length > 0 ? (
          <View>
            <TouchableOpacity activeOpacity={0.95} onPress={() => setTelaCheiaAberta(true)}>
              <ImagemRemota uri={fotos[fotoAtual]} style={estilos.imagemHero} />
            </TouchableOpacity>

            {/* Rótulo reposicionado em cima da foto */}
            <View style={estilos.tagFlutuante}>
              <Text style={estilos.tagFlutuanteTexto}>{item.tipo_negocio === 'aluguel' ? 'ALUGUEL' : 'VENDA'}</Text>
            </View>

            {fotos.length > 1 && (
              <>
                <TouchableOpacity style={[estilos.setaNav, estilos.setaEsquerda]} onPress={fotoAnterior} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={22} color={CORES.branco} />
                </TouchableOpacity>
                <TouchableOpacity style={[estilos.setaNav, estilos.setaDireita]} onPress={proximaFoto} activeOpacity={0.7}>
                  <Ionicons name="chevron-forward" size={22} color={CORES.branco} />
                </TouchableOpacity>
                <View style={estilos.contadorFotos}>
                  <Text style={estilos.contadorFotosTexto}>{fotoAtual + 1} / {fotos.length}</Text>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={[estilos.imagemHero, { backgroundColor: '#ddd' }]}>
            <View style={estilos.tagFlutuante}>
              <Text style={estilos.tagFlutuanteTexto}>{item.tipo_negocio === 'aluguel' ? 'ALUGUEL' : 'VENDA'}</Text>
            </View>
          </View>
        )}

        {fotos.length > 1 && (
          <View style={estilos.filminho}>
            <Text style={estilos.filminhoTitulo}>Fotos do Imóvel</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: ESPACAMENTO.md }}>
              {fotos.map((foto, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { setFotoAtual(i); setTelaCheiaAberta(true); }}
                  activeOpacity={0.85}
                >
                  <ImagemRemota uri={foto} style={[estilos.miniatura, i === fotoAtual && estilos.miniaturaAtiva]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Modal visible={telaCheiaAberta} transparent animationType="fade" onRequestClose={() => setTelaCheiaAberta(false)}>
          <View style={estilos.telaCheiaFundo}>
            <TouchableOpacity style={estilos.telaCheiaFechar} onPress={() => setTelaCheiaAberta(false)}>
              <Ionicons name="close" size={28} color={CORES.branco} />
            </TouchableOpacity>
            <ImagemRemota uri={fotos[fotoAtual]} style={estilos.imagemTelaCheia} resizeMode="contain" />
            {fotos.length > 1 && (
              <>
                <TouchableOpacity style={[estilos.setaNavCheia, estilos.setaEsquerdaCheia]} onPress={fotoAnterior}>
                  <Ionicons name="chevron-back" size={28} color={CORES.branco} />
                </TouchableOpacity>
                <TouchableOpacity style={[estilos.setaNavCheia, estilos.setaDireitaCheia]} onPress={proximaFoto}>
                  <Ionicons name="chevron-forward" size={28} color={CORES.branco} />
                </TouchableOpacity>
                <View style={estilos.contadorFotosCheia}>
                  <Text style={estilos.contadorFotosTexto}>{fotoAtual + 1} / {fotos.length}</Text>
                </View>
              </>
            )}
          </View>
        </Modal>

        <View style={estilos.conteudo}>
          <Text style={estilos.titulo}>{item.titulo}</Text>
          <View style={estilos.linhaComIcone}>
            <Ionicons name="location-outline" size={15} color={CORES.textoMuted} />
            <Text style={estilos.local}>{item.local}</Text>
          </View>

          <View style={estilos.blocoPrecos}>
            {!!item.preco && <View style={estilos.linhaPreco}><Text style={estilos.precoLabel}>Preço</Text><Text style={estilos.precoValor}>{formatarMoeda(parseValorBR(item.preco))}</Text></View>}
            {!!item.condominio && <View style={estilos.linhaPreco}><Text style={estilos.precoLabel}>Condomínio</Text><Text style={estilos.precoValor}>{formatarMoeda(parseValorBR(item.condominio))}</Text></View>}
            {!!item.iptu && <View style={estilos.linhaPreco}><Text style={estilos.precoLabel}>IPTU</Text><Text style={estilos.precoValor}>{formatarMoeda(parseValorBR(item.iptu))}</Text></View>}
            {totalPrevisto > 0 && (
              <View style={[estilos.linhaPreco, estilos.linhaTotal]}>
                <Text style={estilos.totalLabel}>Total Previsto</Text>
                <Text style={estilos.totalValor}>{formatarMoeda(totalPrevisto)}</Text>
              </View>
            )}
          </View>

          <View style={estilos.gridAtributos}>
            {[['bed-outline', item.quartos, 'Quartos'], ['water-outline', item.banheiros, 'Banheiros'], ['car-outline', item.vagas, 'Vagas'], ['expand-outline', item.area ? `${item.area}m²` : '-', 'Área']].map(([icone, val, label], i) => (
              <View key={i} style={estilos.atributo}>
                <Ionicons name={icone} size={20} color={CORES.destaque} />
                <Text style={estilos.atributoValor}>{val || '0'}</Text>
                <Text style={estilos.atributoLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {!!descricaoLimpa && (
            <View style={estilos.bloco}>
              <Text style={estilos.subtitulo}>Descrição do Imóvel</Text>
              <Text style={estilos.descricaoTexto}>{descricaoLimpa}</Text>
            </View>
          )}

          {item.caracteristicas_imovel?.length > 0 && (
            <View style={estilos.bloco}>
              <Text style={estilos.subtitulo}>Características do Imóvel</Text>
              <View style={estilos.chips}>{item.caracteristicas_imovel.map((c, i) => <View key={i} style={estilos.chip}><Text style={estilos.chipTexto}>{c}</Text></View>)}</View>
            </View>
          )}
          {item.caracteristicas_condominio?.length > 0 && (
            <View style={estilos.bloco}>
              <Text style={estilos.subtitulo}>Características do Condomínio</Text>
              <View style={estilos.chips}>{item.caracteristicas_condominio.map((c, i) => <View key={i} style={estilos.chip}><Text style={estilos.chipTexto}>{c}</Text></View>)}</View>
            </View>
          )}

          {!!item.local && (
            <View style={estilos.bloco}>
              <Text style={estilos.subtitulo}>Localização</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={abrirMapaExterno} style={estilos.mapaContainer}>
                {coordenadas ? (
                  <Image
                    source={{
                      uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${coordenadas.latitude},${coordenadas.longitude}&zoom=15&size=600x300&maptype=mapnik&markers=${coordenadas.latitude},${coordenadas.longitude},red-pushpin`,
                    }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={estilos.mapaCarregando}>
                    <Ionicons name="location-outline" size={26} color={CORES.textoMuted} />
                    <Text style={estilos.mapaPlaceholderTexto} numberOfLines={2}>{item.local}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={abrirMapaExterno} style={estilos.botaoAbrirMapa}>
                <Ionicons name="navigate-outline" size={15} color={CORES.branco} />
                <Text style={estilos.botaoAbrirMapaTexto}>Abrir no Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          {preco > 0 && (
            <View style={estilos.bloco}>
              <Text style={estilos.subtitulo}>Simulador de Financiamento</Text>
              <Text style={estilos.simuladorAviso}>Estimativa aproximada — não substitui a simulação oficial do banco.</Text>
              <View style={estilos.simuladorGrid}>
                <CampoSimulador label="Valor do Imóvel (R$)" valor={simValor} aoMudar={setSimValor} />
                <CampoSimulador label="Entrada (%)" valor={simEntrada} aoMudar={setSimEntrada} />
                <CampoSimulador label="Juros ao ano (%)" valor={simJuros} aoMudar={setSimJuros} />
                <CampoSimulador label="Prazo (anos)" valor={simPrazo} aoMudar={setSimPrazo} />
              </View>
              <View style={estilos.simuladorResultado}>
                <View style={estilos.simuladorResultadoItem}><Text style={estilos.simuladorResultadoLabel}>Valor Financiado</Text><Text style={estilos.simuladorResultadoValor}>{formatarMoeda(valorFinanciado)}</Text></View>
                <View style={estilos.simuladorResultadoItem}><Text style={estilos.simuladorResultadoLabel}>Parcela Estimada</Text><Text style={estilos.simuladorResultadoValor}>{formatarMoeda(parcela)}</Text></View>
              </View>
            </View>
          )}

          {relacionados.length > 0 && (
            <View style={estilos.bloco}>
              <Text style={estilos.subtitulo}>Outros Imóveis Disponíveis</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {relacionados.map((rel) => (
                  <TouchableOpacity key={rel.id} style={[estilos.cardRelacionado, SOMBRA.suave]} onPress={() => aoAbrirImovel(rel)} activeOpacity={0.85}>
                    <ImagemRemota uri={rel.imagem_destaque} style={estilos.imagemRelacionado} />
                    <View style={{ padding: 10 }}>
                      <Text numberOfLines={1} style={estilos.tituloRelacionado}>{rel.titulo}</Text>
                      <Text style={estilos.precoRelacionado}>{formatarMoeda(parseValorBR(rel.preco))}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[estilos.barraAcaoFixa, { paddingBottom: (insets.bottom || 12) + 8 }]}>
        <TouchableOpacity style={estilos.botaoFavoritarGrande} onPress={aoFavoritar}>
          <Ionicons name={favorito ? 'heart' : 'heart-outline'} size={22} color={favorito ? '#e53e3e' : CORES.primaria} />
        </TouchableOpacity>
        <TouchableOpacity style={estilos.botaoContato} onPress={abrirWhatsAppInteresse}>
          <Ionicons name="logo-whatsapp" size={18} color={CORES.branco} />
          <Text style={estilos.botaoContatoTexto}>Tenho interesse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CampoSimulador({ label, valor, aoMudar }) {
  return (
    <View style={estilos.simuladorCampo}>
      <Text style={estilos.simuladorLabel}>{label}</Text>
      <TextInput style={estilos.simuladorInput} value={String(valor)} onChangeText={aoMudar} keyboardType="numeric" />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.branco },
  headerFixo: { paddingBottom: 10, paddingHorizontal: ESPACAMENTO.md, backgroundColor: CORES.branco, borderBottomWidth: 1, borderBottomColor: CORES.borda, flexDirection: 'row' },
  botaoVoltarHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  botaoVoltarTexto: { fontFamily: FONTES.semiBold, fontSize: 15, color: CORES.primaria },
  imagemHero: { width: '100%', height: 260 },

  setaNav: {
    position: 'absolute',
    top: 110,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  setaEsquerda: { left: 12 },
  setaDireita: { right: 12 },
  contadorFotos: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RAIO.pill,
    zIndex: 3,
  },
  contadorFotosTexto: { color: CORES.branco, fontFamily: FONTES.semiBold, fontSize: 11 },

  filminho: { paddingTop: ESPACAMENTO.md },
  filminhoTitulo: { fontFamily: FONTES.semiBold, fontSize: 14, color: CORES.primaria, paddingHorizontal: ESPACAMENTO.lg, marginBottom: 10 },
  miniatura: { width: 110, height: 78, borderRadius: RAIO.sm, marginRight: 8, borderWidth: 2, borderColor: 'transparent' },
  miniaturaAtiva: { borderColor: CORES.destaque },

  telaCheiaFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  telaCheiaFechar: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  imagemTelaCheia: { width: LARGURA_TELA, height: '80%' },
  setaNavCheia: { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  setaEsquerdaCheia: { left: 16 },
  setaDireitaCheia: { right: 16 },
  contadorFotosCheia: { position: 'absolute', bottom: 60, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: RAIO.pill },

  // Estilo ajustado para fixar a tag no canto superior esquerdo da foto
  tagFlutuante: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: CORES.primaria,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RAIO.sm,
    zIndex: 3,
  },
  tagFlutuanteTexto: { color: CORES.branco, fontFamily: FONTES.semiBold, fontSize: 11, letterSpacing: 0.5 },
  conteudo: { padding: ESPACAMENTO.lg, paddingTop: ESPACAMENTO.md },
  titulo: { fontFamily: FONTES.bold, fontSize: 21, color: CORES.primaria, marginTop: 10 },
  local: { fontFamily: FONTES.regular, fontSize: 13, color: CORES.textoMuted },
  linhaComIcone: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  blocoPrecos: { backgroundColor: CORES.fundo, borderRadius: RAIO.md, padding: ESPACAMENTO.md, marginTop: ESPACAMENTO.md },
  linhaPreco: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  precoLabel: { fontFamily: FONTES.regular, fontSize: 13, color: CORES.textoMuted },
  precoValor: { fontFamily: FONTES.medio, fontSize: 13, color: CORES.textoEscuro },
  linhaTotal: { borderTopWidth: 1, borderTopColor: CORES.borda, marginTop: 6, paddingTop: 10 },
  totalLabel: { fontFamily: FONTES.semiBold, fontSize: 14, color: CORES.primaria },
  totalValor: { fontFamily: FONTES.bold, fontSize: 16, color: CORES.destaque },
  gridAtributos: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: CORES.fundo, borderRadius: RAIO.md, padding: ESPACAMENTO.md, marginTop: ESPACAMENTO.md },
  atributo: { alignItems: 'center', gap: 4 },
  atributoValor: { fontFamily: FONTES.semiBold, fontSize: 15, color: CORES.primaria },
  atributoLabel: { fontFamily: FONTES.regular, fontSize: 11, color: CORES.textoMuted },
  bloco: { marginTop: ESPACAMENTO.lg },
  subtitulo: { fontFamily: FONTES.semiBold, fontSize: 15, color: CORES.primaria, marginBottom: 8 },
  descricaoTexto: { fontFamily: FONTES.regular, fontSize: 13, color: CORES.textoMedio, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: CORES.destaqueSuave, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RAIO.pill },
  chipTexto: { fontFamily: FONTES.medio, fontSize: 12, color: CORES.destaqueHover },
  mapaContainer: { width: '100%', height: 200, borderRadius: RAIO.md, overflow: 'hidden' },
  mapaCarregando: { flex: 1, backgroundColor: CORES.fundo, justifyContent: 'center', alignItems: 'center', padding: ESPACAMENTO.md, gap: 6 },
  mapaPlaceholderTexto: { color: CORES.textoMuted, fontFamily: FONTES.medio, fontSize: 12.5, textAlign: 'center' },
  botaoAbrirMapa: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: CORES.destaque, borderRadius: RAIO.sm, paddingVertical: 10, marginTop: 8 },
  botaoAbrirMapaTexto: { color: CORES.branco, fontFamily: FONTES.semiBold, fontSize: 12.5 },
  simuladorAviso: { fontFamily: FONTES.regular, fontSize: 11, color: CORES.textoMuted, marginBottom: 10 },
  simuladorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  simuladorCampo: { width: '47%' },
  simuladorLabel: { fontFamily: FONTES.regular, fontSize: 11, color: CORES.textoMuted, marginBottom: 4 },
  simuladorInput: { borderWidth: 1, borderColor: CORES.borda, borderRadius: 8, padding: 10, fontFamily: FONTES.regular, color: CORES.textoEscuro },
  simuladorResultado: { flexDirection: 'row', gap: 10, marginTop: ESPACAMENTO.md, backgroundColor: CORES.destaqueSuave, borderRadius: RAIO.md, padding: ESPACAMENTO.md },
  simuladorResultadoItem: { flex: 1, alignItems: 'center' },
  simuladorResultadoLabel: { fontFamily: FONTES.regular, fontSize: 11, color: CORES.destaqueHover },
  simuladorResultadoValor: { fontFamily: FONTES.bold, fontSize: 16, color: CORES.destaqueHover, marginTop: 2 },
  cardRelacionado: { width: 160, backgroundColor: CORES.branco, borderRadius: RAIO.md, marginRight: ESPACAMENTO.sm, overflow: 'hidden' },
  imagemRelacionado: { width: '100%', height: 100 },
  tituloRelacionado: { fontFamily: FONTES.semiBold, fontSize: 12, color: CORES.primaria },
  precoRelacionado: { fontFamily: FONTES.bold, fontSize: 13, color: CORES.destaque, marginTop: 4 },
  barraAcaoFixa: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: ESPACAMENTO.md, paddingTop: ESPACAMENTO.md, backgroundColor: CORES.branco, borderTopWidth: 1, borderTopColor: CORES.borda },
  botaoFavoritarGrande: { width: 52, height: 52, borderRadius: RAIO.md, borderWidth: 1, borderColor: CORES.borda, justifyContent: 'center', alignItems: 'center' },
  botaoContato: { flex: 1, backgroundColor: CORES.primaria, borderRadius: RAIO.md, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  botaoContatoTexto: { color: CORES.branco, fontFamily: FONTES.semiBold },
});
