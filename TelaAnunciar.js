// ============ TelaAnunciar.js ============
import { enviarAnuncio, editarAnuncio } from './anuncios';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CORES, FONTES, ESPACAMENTO, RAIO, SOMBRA } from './tema';
import { API_BASE, CABECALHO_NGROK } from './config';

const MAX_FOTOS = 10;

// Formata o texto digitado como número no padrão brasileiro, sem casas
// decimais (ex: "150000" -> "150.000"), enquanto o usuário ainda digita.
function formatarValorDigitado(texto) {
  const somenteNumeros = texto.replace(/\D/g, '');
  if (!somenteNumeros) return '';
  return Number(somenteNumeros).toLocaleString('pt-BR');
}

// O backend devolve a descrição com prefixo de URL e tags HTML. Aqui limpamos
// tudo para o campo ser editável normalmente. Preferimos o "resumo", pois é
// a única parte que o backend realmente atualiza ao salvar a edição.
function limparDescricaoParaEdicao(imovel) {
  const bruto = imovel.resumo || imovel.descricao || '';
  return String(bruto)
    .replace(/<[^>]+>/g, ' ')
    .replace(/^https?:\/\/\S+\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Converte os rótulos (ex.: "Área útil") que o backend devolve de volta para
// os slugs usados nos chips (ex.: "area_util").
function rotulosParaSlugs(rotulos, lista) {
  const mapa = new Map(lista.map((c) => [c.label, c.slug]));
  return (rotulos || []).map((r) => mapa.get(r) || r);
}

export default function TelaAnunciar({ sessao, aoVoltar, aoEnviado, imovelParaEditar }) {
  const [titulo, setTitulo] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('venda'); // 'venda' | 'aluguel'
  const [local, setLocal] = useState('');
  const [preco, setPreco] = useState('');
  const [condominio, setCondominio] = useState('');
  const [iptu, setIptu] = useState('');
  const [quartos, setQuartos] = useState('');
  const [suites, setSuites] = useState('');
  const [banheiros, setBanheiros] = useState('');
  const [vagas, setVagas] = useState('');
  const [area, setArea] = useState('');
  const [mobiliado, setMobiliado] = useState('Não'); // 'Sim' | 'Não'
  const [descricao, setDescricao] = useState('');

  const [listaCaracImovel, setListaCaracImovel] = useState([]);
  const [listaCaracCondominio, setListaCaracCondominio] = useState([]);
  const [carregandoCaracteristicas, setCarregandoCaracteristicas] = useState(true);

  const [caracteristicasImovel, setCaracteristicasImovel] = useState([]);
  const [caracteristicasCondominio, setCaracteristicasCondominio] = useState([]);

  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [etapaEnvio, setEtapaEnvio] = useState('');
  const [erro, setErro] = useState('');

useEffect(() => {
  if (!imovelParaEditar) return;
  setTitulo(imovelParaEditar.titulo || '');
  setTipoNegocio(imovelParaEditar.tipo_negocio || 'venda');
  setLocal(imovelParaEditar.local || '');
  setPreco(formatarValorDigitado(String(imovelParaEditar.preco || '').replace(/\D/g, '')));
  setCondominio(formatarValorDigitado(String(imovelParaEditar.condominio || '').replace(/\D/g, '')));
  setIptu(formatarValorDigitado(String(imovelParaEditar.iptu || '').replace(/\D/g, '')));
  setQuartos(String(imovelParaEditar.quartos || ''));
  setSuites(String(imovelParaEditar.suites || ''));
  setBanheiros(String(imovelParaEditar.banheiros || ''));
  setVagas(String(imovelParaEditar.vagas || ''));
  setArea(String(imovelParaEditar.area || ''));
  setMobiliado(String(imovelParaEditar.mobiliado || '').toLowerCase() === 'sim' ? 'Sim' : 'Não');
  setDescricao(limparDescricaoParaEdicao(imovelParaEditar));
}, [imovelParaEditar]);

// As características chegam como rótulos ("Área útil"); convertemos para os
// slugs dos chips assim que a lista de características estiver disponível.
useEffect(() => {
  if (!imovelParaEditar) return;
  if (listaCaracImovel.length > 0) {
    setCaracteristicasImovel(rotulosParaSlugs(imovelParaEditar.caracteristicas_imovel, listaCaracImovel));
  }
  if (listaCaracCondominio.length > 0) {
    setCaracteristicasCondominio(rotulosParaSlugs(imovelParaEditar.caracteristicas_condominio, listaCaracCondominio));
  }
}, [imovelParaEditar, listaCaracImovel, listaCaracCondominio]);

  useEffect(() => {
    let ativo = true;
    fetch(`${API_BASE}/caracteristicas`, { headers: { ...CABECALHO_NGROK } })
      .then((r) => r.json())
      .then((dados) => {
        if (!ativo) return;
        const paraLista = (obj) =>
          Object.entries(obj || {}).map(([slug, info]) => ({ slug, label: info.label }));
        setListaCaracImovel(paraLista(dados.imovel));
        setListaCaracCondominio(paraLista(dados.condominio));
      })
      .catch(() => {})
      .finally(() => ativo && setCarregandoCaracteristicas(false));
    return () => {
      ativo = false;
    };
  }, []);

  function alternarCaracteristica(slug, lista, setLista) {
    setLista(lista.includes(slug) ? lista.filter((s) => s !== slug) : [...lista, slug]);
  }

  async function escolherFotos() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos acessar suas fotos para anexar imagens do imóvel.'
      );
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.5, // qualidade reduzida = upload mais rápido
      selectionLimit: Math.max(1, MAX_FOTOS - fotos.length - fotosExistentes.length),
    });
    if (resultado.canceled) return;
    const novas = resultado.assets.map((a, i) => ({
      uri: a.uri,
      fileName: a.fileName || `foto_${Date.now()}_${i}.jpg`,
      mimeType: a.mimeType || 'image/jpeg',
    }));
    setFotos((atual) => [...atual, ...novas].slice(0, MAX_FOTOS));
  }

  function removerFoto(index) {
    setFotos((atual) => atual.filter((_, i) => i !== index));
  }

 async function enviar() {
  if (!titulo.trim() || !local.trim() || !preco.trim()) {
    setErro('Preencha pelo menos título, endereço e preço.');
    return;
  }
  setErro('');
  setEnviando(true);
  setEtapaEnvio('Enviando...');
  try {
    const dados = {
      titulo: titulo.trim(),
      tipo_negocio: tipoNegocio,
      local: local.trim(),
      preco: preco.replace(/\./g, '').trim(),
      condominio: condominio.replace(/\./g, '').trim(),
      iptu: iptu.replace(/\./g, '').trim(),
      quartos: quartos.trim(),
      suites: suites.trim(),
      banheiros: banheiros.trim(),
      vagas: vagas.trim(),
      area: area.trim(),
      mobiliado,
      descricao: descricao.trim(),
      caracteristicas_imovel: caracteristicasImovel,
      caracteristicas_condominio: caracteristicasCondominio,
    };

    if (imovelParaEditar) {
      await editarAnuncio(
        imovelParaEditar.id,
        { ...dados, imagem_destaque_existente: imovelParaEditar.imagem_destaque, galeria_existente: imovelParaEditar.galeria || [] },
        fotos,
        sessao
      );
      Alert.alert(
        'Alterações enviadas!',
        'Seu imóvel voltou para análise. Assim que for aprovado, as alterações aparecerão no aplicativo.',
        [{ text: 'OK', onPress: aoEnviado }]
      );
    } else {
      await enviarAnuncio(dados, fotos, sessao);
      Alert.alert(
        'Anúncio enviado!',
        'Seu imóvel foi enviado para análise. Assim que for aprovado pelo administrador, ele aparecerá no aplicativo.',
        [{ text: 'OK', onPress: aoEnviado }]
      );
    }
  } catch (e) {
    setErro(e.message || 'Não foi possível enviar. Tente novamente.');
  } finally {
    setEnviando(false);
    setEtapaEnvio('');
  }
}

  const fotosExistentes = imovelParaEditar
    ? [imovelParaEditar.imagem_destaque, ...(imovelParaEditar.galeria || [])].filter(Boolean)
    : [];

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.headerFixo}>
        <TouchableOpacity onPress={aoVoltar} style={estilos.botaoVoltarHeader}>
          <Ionicons name="arrow-back" size={22} color={CORES.primaria} />
          <Text style={estilos.botaoVoltarTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled">
        <Text style={estilos.titulo}>{imovelParaEditar ? 'Editar Imóvel' : 'Anunciar Imóvel'}</Text>
        <Text style={estilos.subtituloAviso}>
          Preencha os dados abaixo. Seu anúncio passa por uma análise da nossa
          equipe antes de ser publicado.
        </Text>

        <Text style={estilos.rotulo}>Tipo de negócio</Text>
        <View style={estilos.chipsToggle}>
          {[
            ['venda', 'Venda'],
            ['aluguel', 'Aluguel'],
          ].map(([valor, label]) => {
            const ativo = tipoNegocio === valor;
            return (
              <TouchableOpacity
                key={valor}
                style={[estilos.chipToggle, ativo && estilos.chipToggleAtivo]}
                onPress={() => setTipoNegocio(valor)}>
                <Text
                  style={[
                    estilos.chipToggleTexto,
                    ativo && estilos.chipToggleTextoAtivo,
                  ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={estilos.rotulo}>Título do anúncio</Text>
        <TextInput
          style={estilos.input}
          placeholder="Ex: Apartamento 3 quartos no Centro"
          placeholderTextColor={CORES.textoMuted}
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={estilos.rotulo}>Endereço / Local</Text>
        <TextInput
          style={estilos.input}
          placeholder="Bairro, cidade"
          placeholderTextColor={CORES.textoMuted}
          value={local}
          onChangeText={setLocal}
        />

        <Text style={estilos.subtitulo}>Valores</Text>
        <View style={estilos.grid}>
          <CampoGrid label="Preço (R$)" valor={preco} aoMudar={(t) => setPreco(formatarValorDigitado(t))} />
          <CampoGrid
            label="Condomínio (R$)"
            valor={condominio}
            aoMudar={(t) => setCondominio(formatarValorDigitado(t))}
          />
          <CampoGrid label="IPTU (R$)" valor={iptu} aoMudar={(t) => setIptu(formatarValorDigitado(t))} />
        </View>

        <Text style={estilos.subtitulo}>Características</Text>
        <View style={estilos.grid}>
          <CampoGrid label="Quartos" valor={quartos} aoMudar={setQuartos} />
          <CampoGrid label="Suítes" valor={suites} aoMudar={setSuites} />
          <CampoGrid
            label="Banheiros"
            valor={banheiros}
            aoMudar={setBanheiros}
          />
          <CampoGrid label="Vagas" valor={vagas} aoMudar={setVagas} />
          <CampoGrid label="Área (m²)" valor={area} aoMudar={setArea} />
        </View>

        <Text style={estilos.rotulo}>Mobiliado</Text>
        <View style={estilos.chipsToggle}>
          {['Não', 'Sim'].map((valor) => {
            const ativo = mobiliado === valor;
            return (
              <TouchableOpacity
                key={valor}
                style={[estilos.chipToggle, ativo && estilos.chipToggleAtivo]}
                onPress={() => setMobiliado(valor)}>
                <Text
                  style={[
                    estilos.chipToggleTexto,
                    ativo && estilos.chipToggleTextoAtivo,
                  ]}>
                  {valor}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={estilos.rotulo}>Descrição</Text>
        <TextInput
          style={[estilos.input, estilos.inputMultilinha]}
          placeholder="Conte os detalhes do imóvel..."
          placeholderTextColor={CORES.textoMuted}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={5}
        />

        <Text style={estilos.rotulo}>Características do imóvel</Text>
        {carregandoCaracteristicas ? (
          <ActivityIndicator color={CORES.destaque} style={{ marginVertical: 12 }} />
        ) : (
          <View style={estilos.chips}>
            {listaCaracImovel.map((c) => {
              const selecionado = caracteristicasImovel.includes(c.slug);
              return (
                <TouchableOpacity
                  key={c.slug}
                  style={[estilos.chip, selecionado && estilos.chipAtivo]}
                  onPress={() =>
                    alternarCaracteristica(
                      c.slug,
                      caracteristicasImovel,
                      setCaracteristicasImovel
                    )
                  }>
                  {selecionado && (
                    <Ionicons name="checkmark" size={13} color={CORES.branco} />
                  )}
                  <Text
                    style={[
                      estilos.chipTexto,
                      selecionado && estilos.chipTextoAtivo,
                    ]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={estilos.rotulo}>Características do condomínio</Text>
        {!carregandoCaracteristicas && (
          <View style={estilos.chips}>
            {listaCaracCondominio.map((c) => {
              const selecionado = caracteristicasCondominio.includes(c.slug);
              return (
                <TouchableOpacity
                  key={c.slug}
                  style={[estilos.chip, selecionado && estilos.chipAtivo]}
                  onPress={() =>
                    alternarCaracteristica(
                      c.slug,
                      caracteristicasCondominio,
                      setCaracteristicasCondominio
                    )
                  }>
                  {selecionado && (
                    <Ionicons name="checkmark" size={13} color={CORES.branco} />
                  )}
                  <Text
                    style={[
                      estilos.chipTexto,
                      selecionado && estilos.chipTextoAtivo,
                    ]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={estilos.subtitulo}>Fotos do imóvel</Text>
        <Text style={estilos.dicaFotos}>
          A primeira foto será usada como capa do anúncio.
        </Text>
        <View style={estilos.gridFotos}>
          {fotosExistentes.map((uri, i) => (
            <View key={`existente-${i}`} style={estilos.fotoWrapper}>
              <Image source={{ uri }} style={estilos.foto} />
              {i === 0 && (
                <View style={estilos.capaTag}>
                  <Text style={estilos.capaTagTexto}>Capa</Text>
                </View>
              )}
              <View style={estilos.fotoMantidaTag}>
                <Text style={estilos.capaTagTexto}>mantida</Text>
              </View>
            </View>
          ))}
          {fotos.map((foto, i) => (
            <View key={foto.uri} style={estilos.fotoWrapper}>
              <Image source={{ uri: foto.uri }} style={estilos.foto} />
              {i === 0 && fotosExistentes.length === 0 && (
                <View style={estilos.capaTag}>
                  <Text style={estilos.capaTagTexto}>Capa</Text>
                </View>
              )}
              <TouchableOpacity
                style={estilos.removerFotoBotao}
                onPress={() => removerFoto(i)}>
                <Ionicons name="close" size={13} color={CORES.branco} />
              </TouchableOpacity>
            </View>
          ))}
          {fotos.length + fotosExistentes.length < MAX_FOTOS && (
            <TouchableOpacity
              style={[estilos.foto, estilos.adicionarFotoBotao]}
              onPress={escolherFotos}>
              <Ionicons
                name="camera-outline"
                size={22}
                color={CORES.destaque}
              />
              <Text style={estilos.adicionarFotoTexto}>Adicionar</Text>
            </TouchableOpacity>
          )}
        </View>

        {!!erro && <Text style={estilos.erro}>{erro}</Text>}

        <TouchableOpacity
          style={[estilos.botaoEnviar, SOMBRA.media]}
          onPress={enviar}
          disabled={enviando}>
          {enviando ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={CORES.branco} />
              <Text style={estilos.botaoEnviarTexto}>{etapaEnvio || 'Enviando...'}</Text>
            </View>
          ) : (
            <Text style={estilos.botaoEnviarTexto}>{imovelParaEditar ? 'Salvar alterações' : 'Enviar para análise'}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CampoGrid({ label, valor, aoMudar }) {
  return (
    <View style={estilos.campoGrid}>
      <Text style={estilos.campoGridLabel}>{label}</Text>
      <TextInput
        style={estilos.input}
        value={valor}
        onChangeText={aoMudar}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={CORES.textoMuted}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.branco },
  headerFixo: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: ESPACAMENTO.md,
    backgroundColor: CORES.branco,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
    flexDirection: 'row',
  },
  botaoVoltarHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  botaoVoltarTexto: {
    fontFamily: FONTES.semiBold,
    fontSize: 15,
    color: CORES.primaria,
  },
  conteudo: { padding: ESPACAMENTO.lg },
  titulo: {
    fontFamily: FONTES.bold,
    fontSize: 21,
    color: CORES.primaria,
    marginTop: 4,
  },
  subtituloAviso: {
    fontFamily: FONTES.regular,
    fontSize: 12.5,
    color: CORES.textoMuted,
    marginTop: 6,
    marginBottom: ESPACAMENTO.lg,
    lineHeight: 18,
  },
  rotulo: {
    fontFamily: FONTES.medio,
    fontSize: 13,
    color: CORES.textoMedio,
    marginBottom: 6,
    marginTop: ESPACAMENTO.sm,
  },
  subtitulo: {
    fontFamily: FONTES.semiBold,
    fontSize: 15,
    color: CORES.primaria,
    marginTop: ESPACAMENTO.lg,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: RAIO.md,
    padding: 14,
    fontFamily: FONTES.regular,
    color: CORES.textoEscuro,
    backgroundColor: CORES.fundo,
  },
  inputMultilinha: { minHeight: 100, textAlignVertical: 'top' },
  chipsToggle: { flexDirection: 'row', gap: 10, marginBottom: ESPACAMENTO.sm },
  chipToggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RAIO.md,
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: 'center',
    backgroundColor: CORES.fundo,
  },
  chipToggleAtivo: {
    backgroundColor: CORES.destaque,
    borderColor: CORES.destaque,
  },
  chipToggleTexto: {
    fontFamily: FONTES.semiBold,
    fontSize: 13.5,
    color: CORES.textoMedio,
  },
  chipToggleTextoAtivo: { color: CORES.branco },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  campoGrid: { flexGrow: 1, minWidth: '30%' },
  campoGridLabel: {
    fontFamily: FONTES.regular,
    fontSize: 11,
    color: CORES.textoMuted,
    marginBottom: 4,
  },
  linhaAdicionar: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inputAdicionar: { flex: 1 },
  botaoAdicionar: {
    width: 48,
    height: 48,
    borderRadius: RAIO.md,
    backgroundColor: CORES.destaque,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CORES.destaqueSuave,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RAIO.pill,
  },
  chipAtivo: {
    backgroundColor: CORES.destaque,
  },
  chipTexto: {
    fontFamily: FONTES.medio,
    fontSize: 12,
    color: CORES.destaqueHover,
  },
  chipTextoAtivo: {
    color: CORES.branco,
  },
  dicaFotos: {
    fontFamily: FONTES.regular,
    fontSize: 11.5,
    color: CORES.textoMuted,
    marginBottom: 10,
  },
  gridFotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fotoWrapper: { position: 'relative' },
  foto: {
    width: 90,
    height: 90,
    borderRadius: RAIO.md,
    backgroundColor: CORES.fundo,
  },
  capaTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: CORES.primaria,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RAIO.sm,
  },
  capaTagTexto: {
    color: CORES.branco,
    fontSize: 9,
    fontFamily: FONTES.semiBold,
  },
  fotoMantidaTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RAIO.sm,
  },
  removerFotoBotao: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e53e3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adicionarFotoBotao: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CORES.destaque,
    borderStyle: 'dashed',
    gap: 4,
  },
  adicionarFotoTexto: {
    fontFamily: FONTES.medio,
    fontSize: 10,
    color: CORES.destaque,
  },
  erro: {
    color: '#e53e3e',
    fontFamily: FONTES.regular,
    fontSize: 13,
    marginTop: ESPACAMENTO.lg,
    textAlign: 'center',
  },
  botaoEnviar: {
    backgroundColor: CORES.destaque,
    borderRadius: RAIO.md,
    padding: 16,
    alignItems: 'center',
    marginTop: ESPACAMENTO.lg,
  },
  botaoEnviarTexto: {
    color: CORES.branco,
    fontFamily: FONTES.semiBold,
    fontSize: 15,
  },
});
