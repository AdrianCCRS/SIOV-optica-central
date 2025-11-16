/**
 * `is-bodeguero-or-admin` policy
 * Verifica que el usuario autenticado tenga el rol de Bodeguero o Administrador
 */

export default async (policyContext, config, { strapi }) => {
  const { state } = policyContext;

  console.log('=== POLICY: is-bodeguero-or-admin (categoria-producto) ===');
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

    const roleType = user.role.type?.toLowerCase();
    const roleName = user.role.name;
    console.log(`✅ Usuario: ${user.username}, Rol: ${roleName}, Type: ${roleType}`);

    // Permitir acceso a Bodeguero y Administrador
    const allowedRoleTypes = ['bodeguero', 'admin', 'administrator'];
    const allowedRoleNames = ['Bodeguero', 'Administrador', 'Administrator', 'Admin'];
    
    if (allowedRoleTypes.includes(roleType) || allowedRoleNames.includes(roleName)) {
      console.log(`✅ Acceso permitido para rol: ${roleName} (${roleType})`);
      return true;
    }

    console.log(`❌ Acceso denegado para rol: ${roleName} (${roleType})`);
    return false;
  } catch (error) {
    console.error('❌ Error en política is-bodeguero-or-admin:', error);
    return false;
  }
};
