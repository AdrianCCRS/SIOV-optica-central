/**
 * categoria-producto router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::categoria-producto.categoria-producto', {
  config: {
    // Aplicar policy de bodeguero para operaciones de escritura
    create: {
      policies: ['api::categoria-producto.is-bodeguero-or-admin']
    },
    update: {
      policies: ['api::categoria-producto.is-bodeguero-or-admin']
    },
    delete: {
      policies: ['api::categoria-producto.is-bodeguero-or-admin']
    },
    // find y findOne son públicos para que todos puedan ver categorías
  }
});
