/**
 * movimiento-inventario router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::movimiento-inventario.movimiento-inventario', {
  config: {
    // Aplicar policy de bodeguero para TODAS las operaciones
    // Los movimientos de inventario son exclusivos del bodeguero
    find: {
      policies: ['api::movimiento-inventario.is-bodeguero-or-admin']
    },
    findOne: {
      policies: ['api::movimiento-inventario.is-bodeguero-or-admin']
    },
    create: {
      policies: ['api::movimiento-inventario.is-bodeguero-or-admin']
    },
    update: {
      policies: ['api::movimiento-inventario.is-bodeguero-or-admin']
    },
    delete: {
      policies: ['api::movimiento-inventario.is-bodeguero-or-admin']
    }
  }
});
