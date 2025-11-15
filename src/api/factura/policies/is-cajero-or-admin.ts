/**
 * `is-cajero-or-admin` policy
 * Verifica que el usuario autenticado tenga el rol de Cajero o Administrador
 */

export default async (policyContext, config, { strapi }) => {
  const { state } = policyContext;

  console.log('=== POLICY: is-cajero-or-admin ===');
  console.log('state.user:', state.user);

  // Verificar si el usuario está autenticado
  if (!state.user) {
    console.log('❌ No hay usuario autenticado');
    return false;
  }

  try {
    // Obtener el usuario completo con su rol
    const user = await strapi.entityService.findOne(
      'plugin::users-permissions.user',
      state.user.id,
      { populate: ['role'] }
    );

    console.log('Usuario completo:', user);
    console.log('Rol del usuario:', user?.role);

    if (!user || !user.role) {
      console.log('❌ Usuario o rol no encontrado');
      return false;
    }

    const userRoleName = user.role.name;
    console.log(`✅ Usuario: ${user.username}, Rol: ${userRoleName}`);

    // Permitir acceso a cualquier usuario autenticado (temporal para debugging)
    return true;

    /* Descomentar cuando funcione para restringir por roles
    const allowedRoles = ['Cajero', 'Administrador', 'Admin', 'Authenticated'];
    if (allowedRoles.includes(userRoleName)) {
      console.log(`✅ Acceso permitido para rol: ${userRoleName}`);
      return true;
    }

    console.log(`❌ Acceso denegado para rol: ${userRoleName}`);
    return false;
    */
  } catch (error) {
    console.error('❌ Error en política:', error);
    return false;
  }
};
