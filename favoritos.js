import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_FAVORITOS = '@imobiliaria_favoritos';

export async function listarFavoritos() {
  const salvos = await AsyncStorage.getItem(CHAVE_FAVORITOS);
  return salvos ? JSON.parse(salvos) : [];
}

export async function ehFavorito(id) {
  const lista = await listarFavoritos();
  return lista.includes(id);
}

export async function alternarFavorito(id) {
  const lista = await listarFavoritos();
  const novaLista = lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
  await AsyncStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(novaLista));
  return novaLista.includes(id);
}