/**
 * producto router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::producto.producto', {
  config: {
    // Aplicar policy de bodeguero para operaciones de escritura
    create: {
      policies: ['api::producto.is-bodeguero-or-admin']
    },
    update: {
      policies: ['api::producto.is-bodeguero-or-admin']
    },
    delete: {
      policies: ['api::producto.is-bodeguero-or-admin']
    },
    // find y findOne son públicos para que los vendedores puedan ver productos
  }
});
