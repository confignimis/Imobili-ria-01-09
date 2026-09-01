import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, CABECALHO_NGROK } from './config';

const CHAVE_SESSAO = '@imobiliaria_sessao';

function codificarBase64(texto) {
  if (typeof btoa === 'function') return btoa(texto);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let resultado = '';
  let i = 0;
  while (i < texto.length) {
    const a = texto.charCodeAt(i++);
    const b = i < texto.length ? texto.charCodeAt(i++) : NaN;
    const c = i < texto.length ? texto.charCodeAt(i++) : NaN;
    const e1 = a >> 2;
    const e2 = ((a & 3) << 4) | (isNaN(b) ? 0 : b >> 4);
    const e3 = isNaN(b) ? 64 : ((b & 15) << 2) | (isNaN(c) ? 0 : c >> 6);
    const e4 = isNaN(c) ? 64 : c & 63;
    resultado += chars[e1] + chars[e2] + chars[e3] + chars[e4];
  }
  return resultado;
}

export async function login(usuario, senha) {
  const resposta = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...CABECALHO_NGROK },
    body: JSON.stringify({ usuario, senha }),
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || 'Falha no login');
  await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados));
  return dados;
}

export async function registrar(nome, email, senha) {
  const resposta = await fetch(`${API_BASE}/registrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...CABECALHO_NGROK },
    body: JSON.stringify({ nome, email, senha }),
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || 'Falha no cadastro');
  await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados));
  return dados;
}

export async function obterSessao() {
  const salvo = await AsyncStorage.getItem(CHAVE_SESSAO);
  return salvo ? JSON.parse(salvo) : null;
}

export async function sair() {
  await AsyncStorage.removeItem(CHAVE_SESSAO);
}

export async function atualizarSessao(novosDados) {
  const atual = await obterSessao();
  if (!atual) return null;
  const nova = { ...atual, ...novosDados };
  await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(nova));
  return nova;
}

export function cabecalhoAuth(sessao) {
  if (!sessao) return {};
  return { Authorization: `Basic ${codificarBase64(`${sessao.usuario}:${sessao.senha_app}`)}` };
}
