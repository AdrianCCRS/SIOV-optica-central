/**
 * factura router
 */

export default {
  routes: [
    // Rutas personalizadas de negocio
    {
      method: 'POST',
      path: '/ventas/registrar',
      handler: 'factura.registrarVenta',
      config: {
        auth: false, // Cambiar a true cuando tengas autenticación configurada
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/ventas/del-dia',
      handler: 'factura.ventasDelDia',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Rutas CRUD estándar
    {
      method: 'GET',
      path: '/facturas',
      handler: 'factura.find',
    },
    {
      method: 'GET',
      path: '/facturas/:id',
      handler: 'factura.findOne',
    },
    {
      method: 'POST',
      path: '/facturas',
      handler: 'factura.create',
    },
    {
      method: 'PUT',
      path: '/facturas/:id',
      handler: 'factura.update',
    },
    {
      method: 'DELETE',
      path: '/facturas/:id',
      handler: 'factura.delete',
    },
  ],
};
