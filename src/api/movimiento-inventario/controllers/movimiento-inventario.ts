/**
 * movimiento-inventario controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::movimiento-inventario.movimiento-inventario', ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body;

    // Validar que el producto existe
    if (!data.producto) {
      return ctx.badRequest('El producto es requerido');
    }

    // Obtener el producto actual
    const producto = await strapi.entityService.findOne(
      'api::producto.producto',
      data.producto
    );

    if (!producto) {
      return ctx.badRequest('Producto no encontrado');
    }

    // Validar el stock_resultante calculado
    const stockActual = producto.stock_actual || 0;
    const cantidad = data.cantidad || 0;
    let nuevoStock = stockActual;

    switch (data.tipo_movimiento) {
      case 'Entrada':
      case 'Devolución':
        nuevoStock = stockActual + cantidad;
        break;
      case 'Salida':
        nuevoStock = stockActual - cantidad;
        if (nuevoStock < 0) {
          return ctx.badRequest('Stock insuficiente para realizar esta operación');
        }
        break;
      case 'Ajuste Inventario':
        nuevoStock = cantidad; // En ajuste, la cantidad es el nuevo stock total
        break;
      default:
        return ctx.badRequest('Tipo de movimiento no válido');
    }

    // Actualizar el stock_resultante con el valor calculado
    data.stock_resultante = nuevoStock;

    // Agregar el usuario actual si está autenticado
    if (ctx.state.user) {
      data.user = ctx.state.user.id;
    }

    try {
      // Crear el movimiento de inventario
      const movimiento = await strapi.entityService.create(
        'api::movimiento-inventario.movimiento-inventario',
        {
          data: data,
          populate: ['producto', 'user']
        }
      );

      // Actualizar el stock del producto
      await strapi.entityService.update(
        'api::producto.producto',
        data.producto,
        {
          data: {
            stock_actual: nuevoStock
          }
        }
      );

      // Retornar el movimiento creado en el formato esperado
      return ctx.send({
        data: movimiento,
        meta: {}
      });
    } catch (error) {
      strapi.log.error('Error al crear movimiento de inventario:', error);
      return ctx.internalServerError('Error al crear el movimiento de inventario');
    }
  },

  async update(ctx) {
    return ctx.badRequest('No se permite actualizar movimientos de inventario');
  },

  async delete(ctx) {
    return ctx.badRequest('No se permite eliminar movimientos de inventario');
  }
}));


