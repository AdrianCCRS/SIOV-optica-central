/**
 * factura controller
 * Controller con endpoints de negocio para ventas
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::factura.factura', ({ strapi }) => ({
  /**
   * POST /api/ventas/registrar
   * Endpoint para registrar una venta completa
   */
  async registrarVenta(ctx) {
    try {
      const { clienteId, productos, medioPago } = ctx.request.body;

      // Validar datos de entrada
      if (!clienteId) {
        return ctx.badRequest('El clienteId es requerido');
      }

      if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return ctx.badRequest('Debe incluir al menos un producto');
      }

      if (!medioPago) {
        return ctx.badRequest('El medio de pago es requerido');
      }

      // Validar formato de productos
      for (const prod of productos) {
        if (!prod.productoId || !prod.cantidad) {
          return ctx.badRequest('Cada producto debe tener productoId y cantidad');
        }
        if (prod.cantidad <= 0) {
          return ctx.badRequest('La cantidad debe ser mayor a 0');
        }
      }

      // Obtener el usuario autenticado
      const usuarioId = ctx.state.user?.id;
      if (!usuarioId) {
        return ctx.unauthorized('Debe estar autenticado para registrar ventas');
      }

      // Llamar al servicio
      const resultado = await strapi
        .service('api::factura.factura')
        .registrarVenta({ clienteId, productos, medioPago }, usuarioId);

      return ctx.send(resultado);
    } catch (error) {
      strapi.log.error('Error al registrar venta:', error);
      return ctx.badRequest(error.message || 'Error al procesar la venta');
    }
  },

  /**
   * GET /api/ventas/del-dia
   * Obtener resumen de ventas del día actual
   */
  async ventasDelDia(ctx) {
    try {
      const usuarioId = ctx.query.usuarioId ? parseInt(ctx.query.usuarioId as string) : undefined;

      const resultado = await strapi
        .service('api::factura.factura')
        .obtenerVentasDelDia(usuarioId);

      return ctx.send(resultado);
    } catch (error) {
      strapi.log.error('Error al obtener ventas del día:', error);
      return ctx.badRequest(error.message || 'Error al obtener ventas');
    }
  },
}));
