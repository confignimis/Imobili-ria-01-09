import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Linking,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import * as ImagePicker from 'expo-image-picker';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import ItemMeuImovel from './ItemMeuImovel';
import { listarMeusImoveis, excluirAnuncio, excluirConta, enviarFoto } from './anuncios';
import TelaPrivacidade from './TelaPrivacidade';
import TelaConfiguracoes from './TelaConfiguracoes';
import { CORES, FONTES, ESPACAMENTO, RAIO, SOMBRA } from './tema';
import { API_BASE, CABECALHO_NGROK, SLOGAN, URL_POLITICA_PRIVACIDADE } from './config';
import TelaHome from './TelaHome';
import TelaDetalhe from './TelaDetalhe';
import TelaLogin from './TelaLogin';
import TelaCadastro from './TelaCadastro';
import TelaAnunciar from './TelaAnunciar';
import CardImovel from './CardImovel';
import ImagemRemota from './ImagemRemota';
import { obterSessao, sair, atualizarSessao } from './auth';
import { listarFavoritos } from './favoritos';

SplashScreen.preventAutoHideAsync();

function AppInterno() {
  const [meusImoveis, setMeusImoveis] = useState([]);
  const [imovelParaEditar, setImovelParaEditar] = useState(null);
  const [telaPrivacidade, setTelaPrivacidade] = useState(false);
  const insets = useSafeAreaInsets();
  const [imoveis, setImoveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [atualizando, setAtualizando] = useState(false);
  const [imovelSelecionado, setImovelSelecionado] = useState(null);
  const [aba, setAba] = useState('home');
  const [telaDetalhe, setTelaDetalhe] = useState(false);
  const [telaAnunciar, setTelaAnunciar] = useState(false);
  const [sessao, setSessao] = useState(null);
  const [telaAuth, setTelaAuth] = useState(null);
  const [favoritosIds, setFavoritosIds] = useState([]);
  const [filtroTipoNegocio, setFiltroTipoNegocio] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [telaConfig, setTelaConfig] = useState(false);

  useEffect(() => {
    obterSessao().then(setSessao);
  }, []);

  useEffect(() => {
    buscarImoveis();
  }, []);

  useEffect(() => {
    if (aba === 'favoritos') listarFavoritos().then(setFavoritosIds);
  }, [aba]);

  useEffect(() => {
    if (aba === 'perfil' && sessao) {
      listarMeusImoveis(sessao).then(setMeusImoveis).catch(() => {});
    }
  }, [aba, sessao]);

  async function buscarImoveis() {
    try {
      setErro(null);
      const resposta = await fetch(`${API_BASE}/imoveis`, { headers: CABECALHO_NGROK });
      if (!resposta.ok) throw new Error('Erro ao buscar imóveis: ' + resposta.status);
      setImoveis(await resposta.json());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  function abrirImovel(item) {
    setImovelSelecionado(item);
    setTelaDetalhe(true);
  }

  function precisaLogin() {
    setTelaAuth('login');
  }

  function abrirCategoria(tipo) {
    setTermoBusca('');
    setFiltroTipoNegocio(tipo);
    setAba('buscar');
  }

  function editarImovel(item) {
    setImovelParaEditar(item);
    setTelaAnunciar(true);
  }

  async function excluirImovel(id) {
    try {
      await excluirAnuncio(id, sessao);
      setMeusImoveis((atual) => atual.map((i) => (i.id === id ? { ...i, status_post: 'draft' } : i)));
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  }

  async function excluirContaPeloPerfil() {
    try {
      await excluirConta(sessao);
      await sair();
      setSessao(null);
      setTelaConfig(false);
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  }

  async function editarFotoPerfil() {
    if (!sessao) return;
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Precisamos acessar suas fotos para escolher uma imagem de perfil.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.6,
    });
    if (resultado.canceled || resultado.assets.length === 0) return;
    const foto = resultado.assets[0];
    try {
      const url = await enviarFoto(
        { uri: foto.uri, fileName: foto.fileName || `perfil_${Date.now()}.jpg`, mimeType: foto.mimeType || 'image/jpeg' },
        sessao
      );
      const nova = await atualizarSessao({ avatar: url });
      if (nova) setSessao(nova);
      Alert.alert('Foto atualizada', 'Sua foto de perfil foi atualizada.');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Não foi possível atualizar a foto.');
    }
  }

  if (telaAuth === 'login') {
    return (
      <TelaLogin
        aoLogar={(s) => {
          setSessao(s);
          setTelaAuth(null);
        }}
        aoIrParaCadastro={() => setTelaAuth('cadastro')}
        aoVoltar={() => setTelaAuth(null)}
      />
    );
  }

  if (telaAuth === 'cadastro') {
    return (
      <TelaCadastro
        aoCadastrar={(s) => {
          setSessao(s);
          setTelaAuth(null);
        }}
        aoIrParaLogin={() => setTelaAuth('login')}
        aoVoltar={() => setTelaAuth(null)}
      />
    );
  }

  if (telaAnunciar) {
    return (
      <TelaAnunciar
        sessao={sessao}
        imovelParaEditar={imovelParaEditar}
        aoVoltar={() => {
          setTelaAnunciar(false);
          setImovelParaEditar(null);
        }}
        aoEnviado={() => {
          setTelaAnunciar(false);
          setImovelParaEditar(null);
          setAba(imovelParaEditar ? 'perfil' : 'home');
          buscarImoveis();
          if (sessao) listarMeusImoveis(sessao).then(setMeusImoveis).catch(() => {});
        }}
      />
    );
  }

  if (telaPrivacidade) {
    return <TelaPrivacidade aoVoltar={() => setTelaPrivacidade(false)} />;
  }

  if (telaConfig) {
    return (
      <TelaConfiguracoes
        sessao={sessao}
        aoVoltar={() => setTelaConfig(false)}
        aoSalvarPerfil={async (dados) => {
          const nova = await atualizarSessao(dados);
          if (nova) setSessao(nova);
        }}
        aoAtualizarAvatar={async (url) => {
          const nova = await atualizarSessao({ avatar: url });
          if (nova) setSessao(nova);
        }}
        aoExcluirConta={excluirContaPeloPerfil}
      />
    );
  }

  if (telaDetalhe && imovelSelecionado) {
    return (
      <TelaDetalhe
        key={imovelSelecionado.id}
        item={imovelSelecionado}
        todosImoveis={imoveis}
        aoVoltar={() => setTelaDetalhe(false)}
        aoAbrirImovel={(novoItem) => setImovelSelecionado(novoItem)}
        sessao={sessao}
        aoPrecisaLogin={precisaLogin}
      />
    );
  }

  if (carregando) {
    return (
      <View style={estilos.centralizado}>
        <Image source={require('./assets/logo.png')} style={{ width: 150, height: 48, marginBottom: 12 }} resizeMode="contain" />
        <Text style={estilos.slogan}>{SLOGAN}</Text>
        <Text style={{ color: CORES.textoMuted, fontFamily: FONTES.medio, marginTop: 16 }}>Carregando imóveis...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={estilos.centralizado}>
        <Ionicons name="cloud-offline-outline" size={40} color={CORES.textoMuted} />
        <Text style={estilos.erroTexto}>Não foi possível conectar</Text>
        <Text style={estilos.erroDica}>Confira se o túnel (ngrok) está ativo.</Text>
      </View>
    );
  }

  function CabecalhoPadrao({ titulo }) {
    return (
      <View style={[estilos.header, { paddingTop: insets.top + 10 }]}>
        {aba !== 'home' ? (
          <TouchableOpacity onPress={() => setAba('home')} style={[estilos.headerVoltarBotao, { top: insets.top + 14 }]}>
            <Ionicons name="chevron-back" size={22} color={CORES.primaria} />
          </TouchableOpacity>
        ) : null}
        {titulo ? (
          <Text style={estilos.headerTitulo}>{titulo}</Text>
        ) : (
          <Image source={require('./assets/logo.png')} style={estilos.logo} resizeMode="contain" />
        )}
      </View>
    );
  }

  function conteudoAba() {
    if (aba === 'home') {
      return (
        <TelaHome
          imoveis={imoveis}
          atualizando={atualizando}
          aoAtualizar={() => {
            setAtualizando(true);
            buscarImoveis();
          }}
          aoBuscar={(texto) => {
            setTermoBusca(texto || '');
            setFiltroTipoNegocio(null);
            setAba('buscar');
          }}
          aoComprar={() => abrirCategoria('venda')}
          aoAlugar={() => abrirCategoria('aluguel')}
          aoAbrirImovel={abrirImovel}
          aoVerTodos={() => {
            setTermoBusca('');
            setFiltroTipoNegocio(null);
            setAba('buscar');
          }}
          aoAnunciar={() => setTelaAnunciar(true)}
          sessao={sessao}
          aoPrecisaLogin={precisaLogin}
        />
      );
    }

    if (aba === 'buscar') {
      const termo = termoBusca.trim().toLowerCase();
      const lista = imoveis.filter((i) => {
        const passaTipo =
          filtroTipoNegocio === 'aluguel'
            ? i.tipo_negocio === 'aluguel'
            : filtroTipoNegocio === 'venda'
            ? i.tipo_negocio !== 'aluguel'
            : true;
        if (!passaTipo) return false;
        if (!termo) return true;
        const alvo = `${i.titulo || ''} ${i.local || ''}`.toLowerCase();
        return alvo.includes(termo);
      });

      return (
        <View style={{ flex: 1 }}>
          <View style={estilos.filtroBarra}>
            <View style={estilos.filtroBusca}>
              <Ionicons name="search" size={16} color={CORES.textoMuted} />
              <TextInput
                style={estilos.filtroBuscaInput}
                placeholder="Buscar por título ou local..."
                placeholderTextColor={CORES.textoMuted}
                value={termoBusca}
                onChangeText={setTermoBusca}
              />
              {!!termoBusca && (
                <TouchableOpacity onPress={() => setTermoBusca('')}>
                  <Ionicons name="close-circle" size={16} color={CORES.textoMuted} />
                </TouchableOpacity>
              )}
            </View>
            <View style={estilos.filtroChips}>
              {[[null, 'Todos'], ['venda', 'Comprar'], ['aluguel', 'Alugar']].map(([valor, rotulo]) => {
                const ativo = filtroTipoNegocio === valor;
                return (
                  <TouchableOpacity
                    key={rotulo}
                    style={[estilos.filtroChip, ativo && estilos.filtroChipAtivo]}
                    onPress={() => setFiltroTipoNegocio(valor)}
                  >
                    <Text style={[estilos.filtroChipTexto, ativo && estilos.filtroChipTextoAtivo]}>{rotulo}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <FlatList
            data={lista}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: ESPACAMENTO.md, flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={() => {
                  setAtualizando(true);
                  buscarImoveis();
                }}
                tintColor={CORES.destaque}
              />
            }
            renderItem={({ item }) => <CardImovel item={item} aoAbrir={abrirImovel} sessao={sessao} aoPrecisaLogin={precisaLogin} />}
            ListEmptyComponent={
              <View style={estilos.centralizado}>
                <Ionicons name="search-outline" size={40} color={CORES.textoMuted} />
                <Text style={{ color: CORES.textoMuted, marginTop: 10, fontFamily: FONTES.medio, textAlign: 'center' }}>
                  Nenhum imóvel encontrado
                </Text>
              </View>
            }
          />
        </View>
      );
    }

    if (aba === 'favoritos') {
      const favoritados = imoveis.filter((i) => favoritosIds.includes(i.id));
      if (favoritados.length === 0) {
        return (
          <View style={estilos.centralizado}>
            <Ionicons name="heart-outline" size={40} color={CORES.textoMuted} />
            <Text style={{ color: CORES.textoMuted, marginTop: 10, fontFamily: FONTES.medio }}>
              Você ainda não favoritou nenhum imóvel
            </Text>
          </View>
        );
      }
      return (
        <FlatList
          data={favoritados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: ESPACAMENTO.md }}
          renderItem={({ item }) => <CardImovel item={item} aoAbrir={abrirImovel} sessao={sessao} aoPrecisaLogin={precisaLogin} />}
        />
      );
    }

    // Perfil
    if (!sessao) {
      return (
        <View style={estilos.centralizado}>
          <Ionicons name="person-circle-outline" size={56} color={CORES.textoMuted} />
          <Text style={{ fontFamily: FONTES.semiBold, fontSize: 16, color: CORES.primaria, marginTop: 12 }}>
            Você ainda não entrou
          </Text>
          <TouchableOpacity style={estilos.botaoEntrarPerfil} onPress={() => setTelaAuth('login')}>
            <Text style={estilos.botaoEntrarPerfilTexto}>Entrar ou criar conta</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={{ padding: ESPACAMENTO.lg }}>
        <View style={estilos.perfilCabecalho}>
          <View style={estilos.perfilAvatarBloco}>
            {sessao.avatar ? (
              <ImagemRemota uri={sessao.avatar} style={estilos.perfilAvatar} />
            ) : (
              <View style={[estilos.perfilAvatar, { backgroundColor: CORES.destaqueSuave }]} />
            )}
            <TouchableOpacity style={estilos.botaoEditarAvatar} onPress={editarFotoPerfil}>
              <Ionicons name="camera" size={13} color={CORES.branco} />
            </TouchableOpacity>
          </View>
          <Text style={estilos.perfilNome}>{sessao.nome}</Text>
          <Text style={estilos.perfilEmail}>{sessao.email}</Text>
          {!!sessao.telefone && <Text style={estilos.perfilTelefone}>{sessao.telefone}</Text>}
        </View>

        <Text style={estilos.secaoPerfilTitulo}>Meus Imóveis</Text>
        {meusImoveis.filter((i) => i.status_post !== 'draft').length === 0 ? (
          <Text style={{ fontFamily: FONTES.regular, color: CORES.textoMuted, fontSize: 13, marginBottom: ESPACAMENTO.lg }}>
            Você ainda não anunciou nenhum imóvel.
          </Text>
        ) : (
          <View style={{ marginBottom: ESPACAMENTO.lg }}>
            {meusImoveis
              .filter((i) => i.status_post !== 'draft')
              .map((item) => (
                <ItemMeuImovel key={item.id} item={item} aoEditar={editarImovel} aoExcluir={excluirImovel} />
              ))}
          </View>
        )}

        <Text style={estilos.secaoPerfilTitulo}>Configurações</Text>
        <View style={estilos.configItens}>
          <TouchableOpacity style={estilos.itemPerfil} onPress={() => setTelaConfig(true)}>
            <Ionicons name="person-circle-outline" size={20} color={CORES.primaria} />
            <Text style={estilos.itemPerfilTexto}>Dados do perfil e conta</Text>
            <Ionicons name="chevron-forward" size={18} color={CORES.textoMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={estilos.itemPerfil} onPress={() => setTelaPrivacidade(true)}>
            <Ionicons name="shield-checkmark-outline" size={20} color={CORES.primaria} />
            <Text style={estilos.itemPerfilTexto}>Política de Privacidade</Text>
            <Ionicons name="chevron-forward" size={18} color={CORES.textoMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={estilos.botaoSair}
          onPress={async () => {
            await sair();
            setSessao(null);
          }}
        >
          <Text style={estilos.botaoSairTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={estilos.tela}>
      <StatusBar barStyle="dark-content" />
      <CabecalhoPadrao
        titulo={
          aba === 'buscar'
            ? filtroTipoNegocio === 'venda'
              ? 'Imóveis à Venda'
              : filtroTipoNegocio === 'aluguel'
              ? 'Imóveis para Alugar'
              : 'Todos os Imóveis'
            : aba === 'favoritos'
            ? 'Favoritos'
            : aba === 'perfil'
            ? 'Perfil'
            : null
        }
      />
      <View style={{ flex: 1 }}>{conteudoAba()}</View>

      <View style={[estilos.tabBar, { paddingBottom: insets.bottom || 10 }]}>
        {[
          ['home', 'home', 'Início'],
          ['buscar', 'search', 'Buscar'],
          ['favoritos', 'heart', 'Favoritos'],
          ['perfil', 'person', 'Perfil'],
        ].map(([chave, icone, label]) => {
          const ativo = aba === chave;
          return (
            <TouchableOpacity
              key={chave}
              style={estilos.tabItem}
              onPress={() => {
                if (chave === 'buscar') {
                  setFiltroTipoNegocio(null);
                  setTermoBusca('');
                }
                setAba(chave);
              }}
            >
              <Ionicons name={ativo ? icone : `${icone}-outline`} size={22} color={ativo ? CORES.destaque : CORES.textoMuted} />
              <Text style={[estilos.tabLabel, ativo && { color: CORES.destaque, fontFamily: FONTES.semiBold }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  const aoLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider onLayout={aoLayout}>
      <AppInterno />
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.fundo },
  centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: ESPACAMENTO.lg, backgroundColor: CORES.fundo },
  slogan: { fontFamily: FONTES.medio, fontSize: 14, color: CORES.textoMuted },
  header: { backgroundColor: CORES.branco, paddingBottom: ESPACAMENTO.sm, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: CORES.borda },
  headerSlogan: { fontFamily: FONTES.regular, fontSize: 11, color: CORES.textoMuted, marginTop: 2 },
  headerVoltarBotao: { position: 'absolute', left: 16, zIndex: 10, padding: 4 },
  headerTitulo: { fontFamily: FONTES.semiBold, fontSize: 17, color: CORES.primaria },
  logo: { width: 180, height: 56 },
  tabBar: { flexDirection: 'row', backgroundColor: CORES.branco, borderTopWidth: 1, borderTopColor: CORES.borda, paddingTop: 10 },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 11, color: CORES.textoMuted, fontFamily: FONTES.regular },
  filtroBarra: { backgroundColor: CORES.branco, padding: ESPACAMENTO.md, borderBottomWidth: 1, borderBottomColor: CORES.borda, gap: 10 },
  filtroBusca: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CORES.fundo, borderRadius: RAIO.md, paddingHorizontal: 14, height: 42 },
  filtroBuscaInput: { flex: 1, fontFamily: FONTES.regular, color: CORES.textoEscuro, fontSize: 14 },
  filtroChips: { flexDirection: 'row', gap: 8 },
  filtroChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RAIO.pill, borderWidth: 1, borderColor: CORES.borda, backgroundColor: CORES.branco },
  filtroChipAtivo: { backgroundColor: CORES.destaque, borderColor: CORES.destaque },
  filtroChipTexto: { fontFamily: FONTES.medio, fontSize: 12.5, color: CORES.textoMedio },
  filtroChipTextoAtivo: { color: CORES.branco },
  erroTexto: { fontFamily: FONTES.semiBold, color: CORES.primaria, marginTop: 12, fontSize: 15 },
  erroDica: { fontFamily: FONTES.regular, color: CORES.textoMuted, marginTop: 4, textAlign: 'center' },
  botaoEntrarPerfil: { backgroundColor: CORES.destaque, borderRadius: RAIO.md, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 },
  botaoEntrarPerfilTexto: { color: CORES.branco, fontFamily: FONTES.semiBold },
  perfilCabecalho: { alignItems: 'center', marginBottom: ESPACAMENTO.lg },
  perfilAvatarBloco: { position: 'relative', marginBottom: 12 },
  perfilAvatar: { width: 80, height: 80, borderRadius: 40 },
  botaoEditarAvatar: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CORES.destaque,
    borderWidth: 2,
    borderColor: CORES.branco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perfilNome: { fontFamily: FONTES.bold, fontSize: 18, color: CORES.primaria },
  perfilEmail: { fontFamily: FONTES.regular, fontSize: 13, color: CORES.textoMuted },
  perfilTelefone: { fontFamily: FONTES.regular, fontSize: 13, color: CORES.textoMedio, marginTop: 4 },
  configItens: { gap: 10, marginBottom: ESPACAMENTO.lg },
  itemPerfil: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CORES.branco, borderWidth: 1, borderColor: CORES.borda, borderRadius: RAIO.md, padding: 14 },
  itemPerfilTexto: { flex: 1, fontFamily: FONTES.medio, fontSize: 14, color: CORES.textoEscuro },
  botaoSair: { borderWidth: 1, borderColor: '#e53e3e', borderRadius: RAIO.md, padding: 14, alignItems: 'center' },
  botaoSairTexto: { color: '#e53e3e', fontFamily: FONTES.semiBold },
  secaoPerfilTitulo: { fontFamily: FONTES.semiBold, fontSize: 15, color: CORES.primaria, marginBottom: 10 },
});
