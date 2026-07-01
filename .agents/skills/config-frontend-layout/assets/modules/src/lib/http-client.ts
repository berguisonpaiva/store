/**
 * Cliente HTTP para uso em componentes cliente (browser).
 * Re-exporta de http/base para evitar problemas de resolução do Turbopack
 * com o path @/http/* em client components.
 */

export { httpClient } from '../http/base';
