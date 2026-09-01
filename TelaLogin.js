import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { CORES, FONTES, ESPACAMENTO, RAIO } from './tema';
import { login } from './auth';

export default function TelaLogin({ aoLogar, aoIrParaCadastro, aoVoltar }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function entrar() {
    if (!usuario || !senha) {
      setErro('Preencha usuário e senha');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const sessao = await login(usuario, senha);
      aoLogar(sessao);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity onPress={aoVoltar} style={estilos.botaoVoltar}>
        <Text style={estilos.botaoVoltarTexto}>← Voltar</Text>
      </TouchableOpacity>

      <View style={estilos.conteudo}>
        <Image source={require('./assets/logo.png')} style={estilos.logo} resizeMode="contain" />
        <Text style={estilos.titulo}>Entrar na sua conta</Text>

        <TextInput
          style={estilos.input}
          placeholder="Usuário ou e-mail"
          placeholderTextColor={CORES.textoMuted}
          autoCapitalize="none"
          value={usuario}
          onChangeText={setUsuario}
        />
        <TextInput
          style={estilos.input}
          placeholder="Senha"
          placeholderTextColor={CORES.textoMuted}
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        {!!erro && <Text style={estilos.erro}>{erro}</Text>}

        <TouchableOpacity style={estilos.botaoEntrar} onPress={entrar} disabled={carregando}>
          {carregando ? <ActivityIndicator color={CORES.branco} /> : <Text style={estilos.botaoEntrarTexto}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={aoIrParaCadastro} style={{ marginTop: ESPACAMENTO.md }}>
          <Text style={estilos.linkCadastro}>Não tem conta? <Text style={{ fontFamily: FONTES.semiBold }}>Cadastre-se</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.branco, paddingTop: 50 },
  botaoVoltar: { paddingHorizontal: ESPACAMENTO.md },
  botaoVoltarTexto: { fontFamily: FONTES.semiBold, color: CORES.primaria, fontSize: 15 },
  conteudo: { flex: 1, justifyContent: 'center', paddingHorizontal: ESPACAMENTO.lg },
  logo: { width: 150, height: 46, alignSelf: 'center', marginBottom: ESPACAMENTO.lg },
  titulo: { fontFamily: FONTES.bold, fontSize: 20, color: CORES.primaria, textAlign: 'center', marginBottom: ESPACAMENTO.lg },
  input: { borderWidth: 1, borderColor: CORES.borda, borderRadius: RAIO.md, padding: 14, marginBottom: ESPACAMENTO.md, fontFamily: FONTES.regular, color: CORES.textoEscuro },
  erro: { color: '#e53e3e', fontFamily: FONTES.regular, fontSize: 13, marginBottom: ESPACAMENTO.md, textAlign: 'center' },
  botaoEntrar: { backgroundColor: CORES.destaque, borderRadius: RAIO.md, padding: 16, alignItems: 'center' },
  botaoEntrarTexto: { color: CORES.branco, fontFamily: FONTES.semiBold, fontSize: 15 },
  linkCadastro: { textAlign: 'center', color: CORES.textoMedio, fontFamily: FONTES.regular },
});