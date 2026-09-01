import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CORES, FONTES, ESPACAMENTO, RAIO, SOMBRA } from './tema';
import { enviarFoto } from './anuncios';
import ImagemRemota from './ImagemRemota';

export default function TelaConfiguracoes({ sessao, aoVoltar, aoSalvarPerfil, aoAtualizarAvatar, aoExcluirConta }) {
  const insets = useSafeAreaInsets();
  const [nome, setNome] = useState(sessao?.nome || '');
  const [telefone, setTelefone] = useState(sessao?.telefone || '');
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [recuperarAberto, setRecuperarAberto] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState(sessao?.email || '');
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);

  async function escolherFoto() {
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
    setEnviandoFoto(true);
    try {
      const url = await enviarFoto(
        { uri: foto.uri, fileName: foto.fileName || `perfil_${Date.now()}.jpg`, mimeType: foto.mimeType || 'image/jpeg' },
        sessao
      );
      await aoAtualizarAvatar(url);
      Alert.alert('Foto atualizada', 'Sua foto de perfil foi atualizada.');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Não foi possível atualizar a foto.');
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome não pode ficar vazio.');
      return;
    }
    setSalvando(true);
    try {
      await aoSalvarPerfil({ nome: nome.trim(), telefone: telefone.trim() });
      Alert.alert('Alterações salvas', 'Seus dados foram atualizados.');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function enviarRecuperacao() {
    if (!emailRecuperacao.trim()) {
      Alert.alert('Atenção', 'Informe o seu e-mail cadastrado.');
      return;
    }
    setEnviandoRecuperacao(true);
    setTimeout(() => {
      setEnviandoRecuperacao(false);
      setRecuperarAberto(false);
      Alert.alert(
        'Solicitação enviada',
        `Nossa equipe recebeu a sua solicitação e entrará em contato no e-mail ${emailRecuperacao.trim()} para redefinir a sua senha.`
      );
    }, 900);
  }

  function confirmarExclusao() {
    Alert.alert(
      'Excluir conta',
      'Esta ação é permanente e não pode ser desfeita. Deseja mesmo excluir sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir conta', style: 'destructive', onPress: aoExcluirConta },
      ]
    );
  }

  return (
    <View style={estilos.tela}>
      <View style={[estilos.headerFixo, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={aoVoltar} style={estilos.botaoVoltarHeader}>
          <Ionicons name="arrow-back" size={22} color={CORES.primaria} />
          <Text style={estilos.botaoVoltarTexto}>Voltar</Text>
        </TouchableOpacity>
        <Text style={estilos.tituloHeader}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={estilos.secaoTitulo}>Dados do Perfil</Text>

        <View style={estilos.avatarBloco}>
          <View style={estilos.avatarWrapper}>
            {sessao?.avatar ? (
              <ImagemRemota uri={sessao.avatar} style={estilos.avatar} />
            ) : (
              <View style={[estilos.avatar, { backgroundColor: CORES.destaqueSuave }]} />
            )}
            <TouchableOpacity style={estilos.botaoCamera} onPress={escolherFoto} disabled={enviandoFoto}>
              {enviandoFoto ? (
                <ActivityIndicator size="small" color={CORES.branco} />
              ) : (
                <Ionicons name="camera" size={16} color={CORES.branco} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={estilos.dicaAvatar}>Toque na câmera para escolher uma foto da sua galeria</Text>
        </View>

        <Text style={estilos.rotulo}>Nome</Text>
        <TextInput style={estilos.input} placeholder="Seu nome" placeholderTextColor={CORES.textoMuted} value={nome} onChangeText={setNome} />

        <Text style={estilos.rotulo}>E-mail</Text>
        <TextInput style={[estilos.input, estilos.inputSomenteLeitura]} value={sessao?.email || ''} editable={false} />

        <Text style={estilos.rotulo}>Telefone</Text>
        <TextInput style={estilos.input} placeholder="(00) 00000-0000" placeholderTextColor={CORES.textoMuted} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />

        <TouchableOpacity style={[estilos.botaoSalvar, SOMBRA.media]} onPress={salvar} disabled={salvando}>
          {salvando ? <ActivityIndicator color={CORES.branco} /> : <Text style={estilos.botaoSalvarTexto}>Salvar alterações</Text>}
        </TouchableOpacity>

        <Text style={estilos.secaoTitulo}>Conta</Text>

        <TouchableOpacity style={estilos.itemConfig} onPress={() => setRecuperarAberto((v) => !v)}>
          <Ionicons name="key-outline" size={20} color={CORES.primaria} />
          <Text style={estilos.itemConfigTexto}>Recuperar senha</Text>
          <Ionicons name={recuperarAberto ? 'chevron-up' : 'chevron-down'} size={18} color={CORES.textoMuted} />
        </TouchableOpacity>

        {recuperarAberto && (
          <View style={estilos.blocoRecuperar}>
            <Text style={estilos.dicaRecuperar}>Informe o e-mail cadastrado para receber as instruções de recuperação de senha.</Text>
            <TextInput
              style={estilos.input}
              placeholder="Seu e-mail"
              placeholderTextColor={CORES.textoMuted}
              value={emailRecuperacao}
              onChangeText={setEmailRecuperacao}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={estilos.botaoRecuperar} onPress={enviarRecuperacao} disabled={enviandoRecuperacao}>
              {enviandoRecuperacao ? (
                <ActivityIndicator color={CORES.branco} />
              ) : (
                <Text style={estilos.botaoRecuperarTexto}>Enviar solicitação</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={estilos.botaoExcluir} onPress={confirmarExclusao}>
          <Ionicons name="trash-outline" size={18} color="#e53e3e" />
          <Text style={estilos.botaoExcluirTexto}>Excluir minha conta</Text>
        </TouchableOpacity>

        <View style={{ height: ESPACAMENTO.lg }} />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.fundo },
  headerFixo: { paddingBottom: 10, paddingHorizontal: ESPACAMENTO.md, backgroundColor: CORES.branco, borderBottomWidth: 1, borderBottomColor: CORES.borda, flexDirection: 'row', alignItems: 'center' },
  botaoVoltarHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  botaoVoltarTexto: { fontFamily: FONTES.semiBold, fontSize: 15, color: CORES.primaria },
  tituloHeader: { fontFamily: FONTES.semiBold, fontSize: 17, color: CORES.primaria, marginLeft: 12 },
  conteudo: { padding: ESPACAMENTO.lg },
  secaoTitulo: { fontFamily: FONTES.semiBold, fontSize: 15, color: CORES.primaria, marginBottom: ESPACAMENTO.md, marginTop: ESPACAMENTO.lg },
  avatarBloco: { alignItems: 'center', marginBottom: ESPACAMENTO.md },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  botaoCamera: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: CORES.destaque,
    borderWidth: 2,
    borderColor: CORES.branco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dicaAvatar: { fontFamily: FONTES.regular, fontSize: 11.5, color: CORES.textoMuted, marginTop: 8, textAlign: 'center' },
  rotulo: { fontFamily: FONTES.medio, fontSize: 13, color: CORES.textoMedio, marginBottom: 6, marginTop: ESPACAMENTO.sm },
  input: { borderWidth: 1, borderColor: CORES.borda, borderRadius: RAIO.md, padding: 14, fontFamily: FONTES.regular, color: CORES.textoEscuro, backgroundColor: CORES.branco },
  inputSomenteLeitura: { color: CORES.textoMuted, backgroundColor: CORES.fundo },
  botaoSalvar: { backgroundColor: CORES.destaque, borderRadius: RAIO.md, padding: 15, alignItems: 'center', marginTop: ESPACAMENTO.lg },
  botaoSalvarTexto: { color: CORES.branco, fontFamily: FONTES.semiBold, fontSize: 15 },
  itemConfig: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CORES.branco, borderWidth: 1, borderColor: CORES.borda, borderRadius: RAIO.md, padding: 14, marginBottom: ESPACAMENTO.sm },
  itemConfigTexto: { flex: 1, fontFamily: FONTES.medio, fontSize: 14, color: CORES.textoEscuro },
  blocoRecuperar: { backgroundColor: CORES.branco, borderWidth: 1, borderColor: CORES.borda, borderRadius: RAIO.md, padding: ESPACAMENTO.md, marginBottom: ESPACAMENTO.md },
  dicaRecuperar: { fontFamily: FONTES.regular, fontSize: 12, color: CORES.textoMuted, marginBottom: 10, lineHeight: 18 },
  botaoRecuperar: { backgroundColor: CORES.primaria, borderRadius: RAIO.md, padding: 13, alignItems: 'center', marginTop: 10 },
  botaoRecuperarTexto: { color: CORES.branco, fontFamily: FONTES.semiBold, fontSize: 13.5 },
  botaoExcluir: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', padding: 14, marginTop: ESPACAMENTO.sm },
  botaoExcluirTexto: { color: '#e53e3e', fontFamily: FONTES.semiBold, fontSize: 14 },
});
