export const DOMINIO_WP = 'https://upturned-fanatic-penniless.ngrok-free.dev';
export const API_BASE = `${DOMINIO_WP}/wordpress/wp-json/imobiliaria/v1`;
export const MEDIA_BASE = `${DOMINIO_WP}/wordpress/wp-json/wp/v2/media`;
export const URL_POLITICA_PRIVACIDADE = `${DOMINIO_WP}/wordpress/politica-de-privacidade/`;
export const SLOGAN = 'Encontre o seu imóvel ideal';

export const CABECALHO_NGROK = { 'ngrok-skip-browser-warning': 'true' };

export function resolverUrlImagem(uri) {
  if (!uri) return null;
  if (/^https?:\/\/(127\.0\.0\.1|localhost)/i.test(uri)) {
    return uri.replace(/^https?:\/\/[^/]+/i, DOMINIO_WP);
  }
  if (/^https?:\/\//i.test(uri)) return uri;
  const caminho = uri.startsWith('/') ? uri : `/${uri}`;
  return `${DOMINIO_WP}${caminho}`;
}

export function abrirWhatsApp(numero, mensagem) {
  const limpo = (numero || '').replace(/\D/g, '');
  const base = limpo ? `https://wa.me/${limpo}` : 'https://wa.me/';
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

// Converte qualquer formato de preço vindo do banco (com ou sem pontos de
// milhar, com ou sem vírgula decimal) em um número puro.
export function parseValorBR(texto) {
  if (!texto) return 0;
  const limpo = String(texto).replace(/\./g, '').replace(',', '.');
  const numero = parseFloat(limpo);
  return isNaN(numero) ? 0 : numero;
}

// Formata qualquer preço (novo ou antigo) sempre do mesmo jeito: "500.000"
export function formatarPreco(valorBruto) {
  const numero = parseValorBR(valorBruto);
  return numero > 0 ? numero.toLocaleString('pt-BR') : '0';
}
