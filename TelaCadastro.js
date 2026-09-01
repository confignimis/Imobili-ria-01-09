import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { CORES, FONTES, ESPACAMENTO, RAIO } from './tema';
import { registrar } from './auth';

export default function TelaCadastro({ aoCadastrar, aoIrParaLogin, aoVoltar }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function criarConta() {
    if (!nome || !email || !senha) {
      setErro('Preencha todos os campos');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const sessao = await registrar(nome, email, senha);
      aoCadastrar(sessao);
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
        <Text style={estilos.titulo}>Criar sua conta</Text>

        <TextInput style={estilos.input} placeholder="Nome completo" placeholderTextColor={CORES.textoMuted} value={nome} onChangeText={setNome} />
        <TextInput style={estilos.input} placeholder="E-mail" placeholderTextColor={CORES.textoMuted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={estilos.input} placeholder="Senha (mín. 6 caracteres)" placeholderTextColor={CORES.textoMuted} secureTextEntry value={senha} onChangeText={setSenha} />

        {!!erro && <Text style={estilos.erro}>{erro}</Text>}

        <TouchableOpacity style={estilos.botaoEntrar} onPress={criarConta} disabled={carregando}>
          {carregando ? <ActivityIndicator color={CORES.branco} /> : <Text style={estilos.botaoEntrarTexto}>Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={aoIrParaLogin} style={{ marginTop: ESPACAMENTO.md }}>
          <Text style={estilos.linkCadastro}>Já tem conta? <Text style={{ fontFamily: FONTES.semiBold }}>Entrar</Text></Text>
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
  titulo: { fontFamily: FONTES.bold, fontSize: 20, color: CORES.primaria, textAlign: 'center', marginBottom: ESPACAMENTO.lg },
  input: { borderWidth: 1, borderColor: CORES.borda, borderRadius: RAIO.md, padding: 14, marginBottom: ESPACAMENTO.md, fontFamily: FONTES.regular, color: CORES.textoEscuro },
  erro: { color: '#e53e3e', fontFamily: FONTES.regular, fontSize: 13, marginBottom: ESPACAMENTO.md, textAlign: 'center' },
  botaoEntrar: { backgroundColor: CORES.destaque, borderRadius: RAIO.md, padding: 16, alignItems: 'center' },
  botaoEntrarTexto: { color: CORES.branco, fontFamily: FONTES.semiBold, fontSize: 15 },
  linkCadastro: { textAlign: 'center', color: CORES.textoMedio, fontFamily: FONTES.regular },
});