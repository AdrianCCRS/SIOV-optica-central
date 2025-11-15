/**
 * factura service
 * Servicio para manejar la lógica de negocio de ventas
 */

import { factories } from '@strapi/strapi';

interface ProductoVenta {
  productoId: number;
  cantidad: number;
}

interface RegistrarVentaInput {
  clienteId: number;
  productos: ProductoVenta[];
  medioPago: string;
}

export default factories.createCoreService('api::factura.factura', ({ strapi }) => ({
  /**
   * Registrar una venta completa
   * Maneja factura, detalles, stock y movimientos de inventario en una transacción
   */
  async registrarVenta(data: RegistrarVentaInput, usuarioId: number) {
    const { clienteId, productos, medioPago } = data;

    // Validar que hay productos
    if (!productos || productos.length === 0) {
      throw new Error('La venta debe incluir al menos un producto');
    }

    // Iniciar transacción (Strapi usa Knex internamente)
    return await strapi.db.transaction(async ({ trx }) => {
      try {
        // 1. Validar cliente
        const cliente = await strapi.entityService.findOne('api::cliente.cliente', clienteId);
        if (!cliente) {
          throw new Error(`Cliente con ID ${clienteId} no encontrado`);
        }

        // 2. Validar productos y verificar stock
        const productosData = [];
        for (const item of productos) {
          const producto = await strapi.entityService.findOne(
            'api::producto.producto',
            item.productoId
          );

          if (!producto) {
            throw new Error(`Producto con ID ${item.productoId} no encontrado`);
          }

          if (!producto.activo) {
            throw new Error(`Producto ${producto.nombre} no está activo`);
          }

          if (producto.stock_actual < item.cantidad) {
            throw new Error(
              `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock_actual}, Solicitado: ${item.cantidad}`
            );
          }

          productosData.push({
            producto,
            cantidad: item.cantidad,
          });
        }

        // 3. Calcular totales
        let subtotal = 0;
        let valorIvaTotal = 0;

        const detallesCalculados = productosData.map(({ producto, cantidad }) => {
          const precioUnitario = producto.precio_unitario;
          const subtotalLinea = precioUnitario * cantidad;
          const valorIvaLinea = (subtotalLinea * producto.porcentaje_iva) / 100;
          const totalLinea = subtotalLinea + valorIvaLinea;

          subtotal += subtotalLinea;
          valorIvaTotal += valorIvaLinea;

          return {
            producto,
            cantidad,
            precio_unitario: precioUnitario,
            porcentaje_iva: producto.porcentaje_iva,
            valor_iva: valorIvaLinea,
            valor_total_linea: totalLinea,
          };
        });

        const total = subtotal + valorIvaTotal;

        // 4. Generar número de factura
        const ultimaFactura = await strapi.db
          .query('api::factura.factura')
          .findMany({
            orderBy: { id: 'desc' },
            limit: 1,
          });

        const numeroFactura = ultimaFactura.length > 0 
          ? `F-${String(parseInt(ultimaFactura[0].numero_factura.split('-')[1]) + 1).padStart(8, '0')}`
          : 'F-00000001';

        // 5. Crear factura
        const factura = await strapi.entityService.create('api::factura.factura', {
          data: {
            numero_factura: numeroFactura,
            fecha_emision: new Date(),
            medio_pago: medioPago as "Efectivo" | "Tarjeta Débito" | "Tarjeta Crédito" | "Transferencia" | "Otro",
            subtotal,
            valor_iva: valorIvaTotal,
            total,
            cliente: clienteId,
            user: usuarioId,
          },
        });

        // 6. Crear detalles de factura y actualizar stock
        const detallesCreados = [];
        for (const detalle of detallesCalculados) {
          // Crear detalle de factura
          const detalleFactura = await strapi.entityService.create(
            'api::detalle-factura.detalle-factura',
            {
              data: {
                cantidad: detalle.cantidad,
                precio_unitario: detalle.precio_unitario,
                porcentaje_iva: detalle.porcentaje_iva,
                valor_iva: detalle.valor_iva,
                valor_total_linea: detalle.valor_total_linea,
                factura: factura.id,
                producto: detalle.producto.id,
              },
            }
          );

          detallesCreados.push(detalleFactura);

          // Actualizar stock del producto
          const nuevoStock = detalle.producto.stock_actual - detalle.cantidad;
          await strapi.entityService.update('api::producto.producto', detalle.producto.id, {
            data: {
              stock_actual: nuevoStock,
            },
          });

          // Crear movimiento de inventario
          await strapi.entityService.create('api::movimiento-inventario.movimiento-inventario', {
            data: {
              fecha: new Date(),
              tipo_movimiento: 'Salida',
              cantidad: -detalle.cantidad, // Negativo porque es salida
              motivo: `Venta - Factura ${numeroFactura}`,
              stock_resultante: nuevoStock,
              producto: detalle.producto.id,
              user: usuarioId,
            },
          });
        }

        // 7. Retornar factura completa con detalles
        const facturaCompleta = await strapi.entityService.findOne(
          'api::factura.factura',
          factura.id,
          {
            populate: {
              cliente: true,
              usuario: {
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

        return {
          success: true,
          factura: facturaCompleta,
          mensaje: `Venta registrada exitosamente. Factura: ${numeroFactura}`,
        };
      } catch (error) {
        // Si hay error, la transacción se revierte automáticamente
        throw error;
      }
    });
  },

  /**
   * Obtener resumen de ventas del día
   */
  async obtenerVentasDelDia(usuarioId?: number) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const where: any = {
      fecha_emision: {
        $gte: hoy,
        $lt: manana,
      },
    };

    if (usuarioId) {
      where.usuario = usuarioId;
    }

    const facturas = await strapi.entityService.findMany('api::factura.factura', {
      filters: where,
      populate: {
        cliente: true,
        usuario: {
          fields: ['id', 'username', 'nombres', 'apellidos'],
        },
      },
    });

    const totalVentas = facturas.reduce((sum, f) => sum + f.total, 0);
    const cantidadVentas = facturas.length;

    return {
      fecha: hoy.toISOString().split('T')[0],
      cantidad_ventas: cantidadVentas,
      total_ventas: totalVentas,
      facturas,
    };
  },
}));
