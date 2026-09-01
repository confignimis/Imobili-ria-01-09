import { API_BASE, MEDIA_BASE, DOMINIO_WP, CABECALHO_NGROK } from './config';
import { cabecalhoAuth } from './auth';

export async function enviarFoto(foto, sessao) {
  const dados = new FormData();
  const nomeArquivo = foto.fileName || `foto_${Date.now()}.jpg`;
  dados.append('file', {
    uri: foto.uri,
    name: nomeArquivo,
    type: foto.mimeType || 'image/jpeg',
  });

  const resposta = await fetch(MEDIA_BASE, {
    method: 'POST',
    headers: {
      ...cabecalhoAuth(sessao),
      ...CABECALHO_NGROK,
    },
    body: dados,
  });

  const resultado = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(resultado.message || `Falha ao enviar uma foto (status ${resposta.status})`);
  }
  const urlBruta = resultado.source_url || resultado.guid?.rendered;
  if (!urlBruta) {
    throw new Error('Não foi possível obter o endereço da imagem enviada.');
  }
  const caminho = urlBruta.replace(/^https?:\/\/[^/]+/i, '');
  return `${DOMINIO_WP}${caminho}`;
}

export async function enviarAnuncio(dadosImovel, fotos, sessao) {
  if (!sessao) {
    throw new Error('É necessário estar logado para anunciar um imóvel.');
  }

  const resultadosFotos = await Promise.all(fotos.map((foto) => enviarFoto(foto, sessao)));
  const urlsFotos = resultadosFotos.filter(Boolean);

  const corpo = {
    ...dadosImovel,
    imagem_destaque: urlsFotos[0] || null,
    galeria: urlsFotos.slice(1),
    status: 'pendente',
  };

  const resposta = await fetch(`${API_BASE}/imoveis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...CABECALHO_NGROK,
      ...cabecalhoAuth(sessao),
    },
    body: JSON.stringify(corpo),
  });

  const resultado = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(resultado.erro || resultado.message || `Falha ao enviar o anúncio (status ${resposta.status})`);
  }
  return resultado;
}

// Busca todos os imóveis (em qualquer status) do usuário logado.
export async function listarMeusImoveis(sessao) {
  if (!sessao) return [];
  const resposta = await fetch(`${API_BASE}/meus-imoveis`, {
    headers: { ...CABECALHO_NGROK, ...cabecalhoAuth(sessao) },
  });
  if (!resposta.ok) throw new Error('Não foi possível carregar seus imóveis');
  return resposta.json();
}

// Edita um imóvel já existente. Novas fotos (se houver) são enviadas antes;
// fotos que a pessoa não mexeu continuam como estavam no imóvel.
export async function editarAnuncio(id, dadosImovel, novasFotos, sessao) {
  if (!sessao) throw new Error('É necessário estar logado.');

  let imagemDestaque = dadosImovel.imagem_destaque_existente || null;
  const urlsGaleriaExistente = dadosImovel.galeria_existente || [];

  if (novasFotos.length > 0) {
    const resultados = await Promise.all(novasFotos.map((foto) => enviarFoto(foto, sessao)));
    const novasUrls = resultados.filter(Boolean);
    if (!imagemDestaque) imagemDestaque = novasUrls[0];
    urlsGaleriaExistente.push(...(imagemDestaque === novasUrls[0] ? novasUrls.slice(1) : novasUrls));
  }

  const corpo = {
    ...dadosImovel,
    imagem_destaque: imagemDestaque,
    galeria: urlsGaleriaExistente,
  };
  delete corpo.imagem_destaque_existente;
  delete corpo.galeria_existente;

  const resposta = await fetch(`${API_BASE}/imoveis/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...CABECALHO_NGROK,
      ...cabecalhoAuth(sessao),
    },
    body: JSON.stringify(corpo),
  });

  const resultado = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(resultado.erro || `Falha ao editar o anúncio (status ${resposta.status})`);
  }
  return resultado;
}

// "Exclui" do lado do usuário (vira rascunho no WordPress).
export async function excluirAnuncio(id, sessao) {
  const resposta = await fetch(`${API_BASE}/imoveis/${id}`, {
    method: 'DELETE',
    headers: { ...CABECALHO_NGROK, ...cabecalhoAuth(sessao) },
  });
  const resultado = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(resultado.erro || 'Falha ao excluir o imóvel');
  }
  return resultado;
}

// Exclui a conta do usuário logado (irreversível).
export async function excluirConta(sessao) {
  const resposta = await fetch(`${API_BASE}/conta`, {
    method: 'DELETE',
    headers: { ...CABECALHO_NGROK, ...cabecalhoAuth(sessao) },
  });
  const resultado = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(resultado.erro || 'Falha ao excluir a conta');
  }
  return resultado;
}
