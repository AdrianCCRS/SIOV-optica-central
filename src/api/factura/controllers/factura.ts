/**
 * factura controller
 * Controller con endpoints de negocio para ventas
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::factura.factura', ({ strapi }) => ({
  /**
   * GET /api/facturas/:id
   * Override del findOne para incluir populate automático
   */
  async findOne(ctx) {
    const { id } = ctx.params;

    const factura = await strapi.entityService.findOne(
      'api::factura.factura',
      id,
      {
        populate: {
          cliente: true,
          user: {
            fields: ['id', 'username', 'nombres', 'apellidos'],
          },
          detalles: {
            populate: {
              producto: true,
            },
          },
        },
      }
    );

    if (!factura) {
      return ctx.notFound('Factura no encontrada');
    }

    return ctx.send({ data: factura });
  },

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

  /**
   * GET /api/ventas/:id/detalle
   * Obtener detalle completo de una factura
   */
  async detalleFactura(ctx) {
    try {
      const { id } = ctx.params;

      const factura = await strapi.entityService.findOne(
        'api::factura.factura',
        id,
        {
          populate: {
            cliente: true,
            user: {
              fields: ['id', 'username', 'nombres', 'apellidos'],
            },
            detalles: {
              populate: {
                producto: true,
              },
            },
          },
        }
      );

      if (!factura) {
        return ctx.notFound('Factura no encontrada');
      }

      return ctx.send(factura);
    } catch (error) {
      strapi.log.error('Error al obtener detalle de factura:', error);
      return ctx.badRequest(error.message || 'Error al obtener factura');
    }
  },

  /**
   * GET /api/ventas/buscar
   * Buscar facturas con filtros de fecha
   * Query params: fechaInicio, fechaFin, numeroFactura, clienteId
   */
  async buscarFacturas(ctx) {
    try {
      const { fechaInicio, fechaFin, numeroFactura, clienteId } = ctx.query;

      const filters: any = {};

      // Filtro por rango de fechas
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio as string);
        inicio.setHours(0, 0, 0, 0);
        
        const fin = new Date(fechaFin as string);
        fin.setHours(23, 59, 59, 999);

        filters.fecha_emision = {
          $gte: inicio,
          $lte: fin,
        };
      } else if (fechaInicio) {
        const inicio = new Date(fechaInicio as string);
        inicio.setHours(0, 0, 0, 0);
        filters.fecha_emision = { $gte: inicio };
      } else if (fechaFin) {
        const fin = new Date(fechaFin as string);
        fin.setHours(23, 59, 59, 999);
        filters.fecha_emision = { $lte: fin };
      }

      // Filtro por número de factura
      if (numeroFactura) {
        filters.numero_factura = {
          $containsi: numeroFactura,
        };
      }

      // Filtro por cliente
      if (clienteId) {
        filters.cliente = clienteId;
      }

      const facturas = await strapi.entityService.findMany('api::factura.factura', {
        filters,
        populate: {
          cliente: true,
          user: {
            fields: ['id', 'username', 'nombres', 'apellidos'],
          },
        },
        sort: { fecha_emision: 'desc' },
        limit: 100, // Limitar a 100 resultados
      });

      const total = facturas.length;
      const totalVentas = facturas.reduce((sum: number, f: any) => sum + (f.total || 0), 0);

      return ctx.send({
        facturas,
        resumen: {
          cantidad: total,
          total_ventas: totalVentas,
        },
      });
    } catch (error) {
      strapi.log.error('Error al buscar facturas:', error);
      return ctx.badRequest(error.message || 'Error al buscar facturas');
    }
  },
}));
