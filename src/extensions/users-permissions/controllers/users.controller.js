// backend/src/extensions/users-permissions/strapi-server.js
'use strict';

module.exports = (plugin) => {
  // 1. Controlador custom: listar solo Cajeros y Bodegueros
  plugin.controllers.user.findCashiersAndStorekeepers = async (ctx) => {
    const currentUser = ctx.state.user;

    // (Opcional pero recomendado) Solo dejar que entre el rol "Administrador" de tu app
    // Ajusta según cómo guardes el rol: type, name, etc.
    const currentRoleType = currentUser?.role?.name?.toLowerCase();
    if (currentRoleType !== 'administrador') {
      return ctx.unauthorized('No tienes permiso para ver esta lista de usuarios.');
    }

    const allowedRoleTypes = ['cajero', 'bodeguero'];

    const users = await strapi
      .query('plugin::users-permissions.user')
      .findMany({
        where: {
          role: {
            name: {
              $in: allowedRoleTypes,
            },
          },
        },
        populate: ['role'], // para que role venga populado
      });

    ctx.body = users;
  };

  // 2. Ruta custom que usa ese controlador
  plugin.routes['content-api'].routes.push({
    method: 'GET',
    // Esto será accesible como:  GET /api/users/editable-users
    path: '/users/editable-users',
    handler: 'user.findCashiersAndStorekeepers',
    config: {
      // Dejas el control de auth/roles al plugin Users & Permissions
      policies: [],
    },
  });

  return plugin;
};
