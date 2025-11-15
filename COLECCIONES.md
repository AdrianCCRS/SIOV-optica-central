# 📋 Colecciones Creadas - Sistema Óptica Central

## ✅ Content Types Implementados

Todas las colecciones han sido creadas basadas en el diagrama ER:

### 1. **Cliente** (`api::cliente.cliente`)
```json
{
  "tipo_identificacion": "enum[CC, CE, NIT, Pasaporte]",
  "numero_identificacion": "string (unique)",
  "nombres": "string",
  "apellidos": "string",
  "telefono": "string",
  "email": "email",
  "direccion": "text",
  "facturas": "relation → oneToMany"
}
```

### 2. **Categoría Producto** (`api::categoria-producto.categoria-producto`)
```json
{
  "nombre": "string (unique)",
  "descripcion": "text",
  "productos": "relation → oneToMany"
}
```

### 3. **Producto** (`api::producto.producto`)
```json
{
  "referencia": "string (unique)",
  "nombre": "string",
  "descripcion": "text",
  "precio_unitario": "decimal",
  "porcentaje_iva": "decimal (default: 19)",
  "stock_actual": "integer (default: 0)",
  "stock_minimo": "integer (default: 0)",
  "activo": "boolean (default: true)",
  "categoria": "relation → manyToOne",
  "detalles_factura": "relation → oneToMany",
  "movimientos_inventario": "relation → oneToMany"
}
```

### 4. **Usuario** (`api::usuario.usuario`)
```json
{
  "username": "string (unique)",
  "password_hash": "password (private)",
  "nombres": "string",
  "apellidos": "string",
  "email": "email (unique)",
  "activo": "boolean (default: true)",
  "roles": "relation → manyToMany",
  "facturas": "relation → oneToMany",
  "movimientos_inventario": "relation → oneToMany"
}
```

### 5. **Rol** (`api::rol.rol`)
```json
{
  "nombre": "string (unique)",
  "descripcion": "text",
  "usuarios": "relation → manyToMany"
}
```

### 6. **Factura** (`api::factura.factura`)
```json
{
  "numero_factura": "string (unique)",
  "fecha_emision": "datetime",
  "medio_pago": "enum[Efectivo, Tarjeta Débito, Tarjeta Crédito, Transferencia, Otro]",
  "subtotal": "decimal",
  "valor_iva": "decimal",
  "total": "decimal",
  "cliente": "relation → manyToOne",
  "usuario": "relation → manyToOne",
  "detalles": "relation → oneToMany"
}
```

### 7. **Detalle Factura** (`api::detalle-factura.detalle-factura`)
```json
{
  "cantidad": "integer (min: 1)",
  "precio_unitario": "decimal",
  "porcentaje_iva": "decimal",
  "valor_iva": "decimal",
  "valor_total_linea": "decimal",
  "factura": "relation → manyToOne",
  "producto": "relation → manyToOne"
}
```

### 8. **Movimiento Inventario** (`api::movimiento-inventario.movimiento-inventario`)
```json
{
  "fecha": "datetime",
  "tipo_movimiento": "enum[Entrada, Salida, Ajuste Inventario, Devolución]",
  "cantidad": "integer",
  "motivo": "text",
  "stock_resultante": "integer (min: 0)",
  "producto": "relation → manyToOne",
  "usuario": "relation → manyToOne"
}
```

## 🔗 Relaciones Implementadas

### Cliente
- `1:N` → Facturas

### Categoría Producto
- `1:N` → Productos

### Producto
- `N:1` → Categoría
- `1:N` → Detalles Factura
- `1:N` → Movimientos Inventario

### Usuario
- `N:M` → Roles
- `1:N` → Facturas (registradas)
- `1:N` → Movimientos Inventario (registrados)

### Rol
- `N:M` → Usuarios

### Factura
- `N:1` → Cliente
- `N:1` → Usuario
- `1:N` → Detalles Factura

### Detalle Factura
- `N:1` → Factura
- `N:1` → Producto

### Movimiento Inventario
- `N:1` → Producto
- `N:1` → Usuario

## 🚀 Próximos Pasos

1. **Iniciar Strapi:**
   ```bash
   npm run develop
   ```

2. **Acceder al admin:**
   ```
   http://localhost:1337/admin
   ```

3. **Verificar colecciones:**
   - Ve a Content-Type Builder
   - Todas las colecciones deberían estar listadas
   - Strapi generará automáticamente los tipos TypeScript

4. **Endpoints API generados automáticamente:**
   ```
   GET    /api/clientes
   POST   /api/clientes
   GET    /api/clientes/:id
   PUT    /api/clientes/:id
   DELETE /api/clientes/:id
   
   (Y así para todas las colecciones)
   ```

## 📝 Notas

- Todos los content types tienen `draftAndPublish: false` para simplicidad
- Los campos `unique` están marcados en los schemas
- Las validaciones (min, max, required) están configuradas
- Los TypeScript errors en controllers/services/routes se resolverán cuando Strapi regenere los tipos
