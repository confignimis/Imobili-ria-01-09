import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { resolverUrlImagem, CABECALHO_NGROK } from './config';

// Estratégia em duas etapas:
// 1) Tenta o <Image> nativo passando o header do ngrok direto na requisição
//    (é o jeito suportado oficialmente pelo React Native e evita ter que
//    baixar a imagem inteira via JS antes de mostrar).
// 2) Se isso falhar (onError), cai para o método antigo: busca a imagem via
//    fetch, confere se a resposta é realmente uma imagem (e não a página de
//    aviso do ngrok ou um erro do WordPress) e converte pra base64.
export default function ImagemRemota({ uri, style, resizeMode = 'cover' }) {
  const urlFinal = resolverUrlImagem(uri);
  const [modo, setModo] = useState('direto'); // 'direto' | 'blob' | 'erro'
  const [uriBlob, setUriBlob] = useState(null);

  useEffect(() => {
    setModo('direto');
    setUriBlob(null);
  }, [urlFinal]);

  useEffect(() => {
    if (modo !== 'blob' || !urlFinal) return;
    let ativo = true;

    fetch(urlFinal, { headers: CABECALHO_NGROK })
      .then((resposta) => {
        const tipo = resposta.headers.get('content-type') || '';
        if (!resposta.ok || !tipo.startsWith('image/')) {
          throw new Error(`resposta inválida (status ${resposta.status}, tipo "${tipo}")`);
        }
        return resposta.blob();
      })
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onloadend = () => resolve(leitor.result);
            leitor.onerror = () => reject(new Error('falha ao ler o arquivo'));
            leitor.readAsDataURL(blob);
          })
      )
      .then((dataUrl) => {
        if (ativo) setUriBlob(dataUrl);
      })
      .catch((e) => {
        console.warn('ImagemRemota: não foi possível carregar', urlFinal, '-', e.message);
        if (ativo) setModo('erro');
      });

    return () => {
      ativo = false;
    };
  }, [modo, urlFinal]);

  if (!urlFinal || modo === 'erro') {
    return <View style={[style, estilosBase.placeholder]} />;
  }

  if (modo === 'blob') {
    if (!uriBlob) return <View style={[style, estilosBase.placeholder]} />;
    return <Image source={{ uri: uriBlob }} style={style} resizeMode={resizeMode} />;
  }

  return (
    <Image
      source={{ uri: urlFinal, headers: CABECALHO_NGROK }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setModo('blob')}
    />
  );
}

const estilosBase = {
  placeholder: { backgroundColor: '#e2e2e2' },
};