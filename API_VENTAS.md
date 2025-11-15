# API de Ventas

## Endpoint de Negocio: Registrar Venta

### POST /api/ventas/registrar

Endpoint transaccional que maneja todo el proceso de venta en una sola operación.

#### Request Body

```json
{
  "clienteId": 1,
  "productos": [
    {
      "productoId": 3,
      "cantidad": 2
    },
    {
      "productoId": 7,
      "cantidad": 1
    }
  ],
  "medioPago": "Efectivo"
}
```

#### Campos

- **clienteId** (number, requerido): ID del cliente
- **productos** (array, requerido): Lista de productos a vender
  - **productoId** (number): ID del producto
  - **cantidad** (number): Cantidad a vender
- **medioPago** (string, requerido): Método de pago. Opciones:
  - "Efectivo"
  - "Tarjeta Débito"
  - "Tarjeta Crédito"
  - "Transferencia"
  - "Otro"

#### Respuesta Exitosa (200)

```json
{
  "success": true,
  "mensaje": "Venta registrada exitosamente. Factura: F-00000001",
  "factura": {
    "id": 1,
    "numero_factura": "F-00000001",
    "fecha_emision": "2025-11-15T17:30:00.000Z",
    "medio_pago": "Efectivo",
    "subtotal": 150000,
    "valor_iva": 28500,
    "total": 178500,
    "cliente": {
      "id": 1,
      "nombres": "Juan",
      "apellidos": "Pérez",
      "numero_identificacion": "123456789"
    },
    "usuario": {
      "id": 1,
      "username": "cajero01",
      "nombres": "María",
      "apellidos": "García"
    },
    "detalles": [
      {
        "id": 1,
        "cantidad": 2,
        "precio_unitario": 50000,
        "porcentaje_iva": 19,
        "valor_iva": 19000,
        "valor_total_linea": 119000,
        "producto": {
          "id": 3,
          "nombre": "Montura Modelo X",
          "referencia": "MON-001"
        }
      }
    ]
  }
}
```

#### Errores Posibles

**400 Bad Request** - Validación fallida
```json
{
  "error": {
    "message": "La venta debe incluir al menos un producto"
  }
}
```

**400 Bad Request** - Stock insuficiente
```json
{
  "error": {
    "message": "Stock insuficiente para Montura Modelo X. Disponible: 1, Solicitado: 2"
  }
}
```

**400 Bad Request** - Cliente no encontrado
```json
{
  "error": {
    "message": "Cliente con ID 999 no encontrado"
  }
}
```

**400 Bad Request** - Producto no encontrado
```json
{
  "error": {
    "message": "Producto con ID 999 no encontrado"
  }
}
```

**400 Bad Request** - Producto inactivo
```json
{
  "error": {
    "message": "Producto Montura Modelo X no está activo"
  }
}
```

**401 Unauthorized** - No autenticado
```json
{
  "error": {
    "message": "Debe estar autenticado para registrar ventas"
  }
}
```

---

## GET /api/ventas/del-dia

Obtiene el resumen de ventas del día actual.

#### Query Parameters

- **usuarioId** (number, opcional): Filtrar por usuario específico

#### Ejemplos

```bash
# Todas las ventas del día
GET /api/ventas/del-dia

# Ventas del día de un usuario específico
GET /api/ventas/del-dia?usuarioId=1
```

#### Respuesta Exitosa (200)

```json
{
  "fecha": "2025-11-15",
  "cantidad_ventas": 5,
  "total_ventas": 892500,
  "facturas": [
    {
      "id": 1,
      "numero_factura": "F-00000001",
      "fecha_emision": "2025-11-15T08:30:00.000Z",
      "total": 178500,
      "cliente": {
        "nombres": "Juan",
        "apellidos": "Pérez"
      },
      "usuario": {
        "username": "cajero01"
      }
    }
  ]
}
```

---

## Proceso Interno

Cuando se llama a `POST /api/ventas/registrar`, el backend ejecuta las siguientes operaciones **dentro de una transacción**:

1. **Validación del Cliente**
   - Verifica que el cliente existe

2. **Validación de Productos**
   - Verifica que todos los productos existen
   - Verifica que los productos están activos
   - Verifica stock suficiente

3. **Cálculo de Totales**
   - Calcula subtotal de cada línea
   - Calcula IVA de cada línea según el porcentaje del producto
   - Calcula totales generales

4. **Generación de Número de Factura**
   - Genera número consecutivo automático (F-00000001, F-00000002, etc.)

5. **Creación de Factura**
   - Crea el registro de factura con totales calculados

6. **Creación de Detalles**
   - Crea cada línea de detalle de factura

7. **Actualización de Stock**
   - Reduce el stock de cada producto vendido

8. **Registro de Movimientos**
   - Crea movimientos de inventario tipo "Salida" para trazabilidad

Si algún paso falla, **toda la transacción se revierte** y no queda ningún dato inconsistente.

---

## Ejemplos de Uso

### cURL

```bash
curl -X POST http://localhost:1337/api/ventas/registrar \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": 1,
    "productos": [
      {"productoId": 3, "cantidad": 2},
      {"productoId": 7, "cantidad": 1}
    ],
    "medioPago": "Efectivo"
  }'
```

### JavaScript (Fetch)

```javascript
const registrarVenta = async () => {
  const response = await fetch('http://localhost:1337/api/ventas/registrar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clienteId: 1,
      productos: [
        { productoId: 3, cantidad: 2 },
        { productoId: 7, cantidad: 1 }
      ],
      medioPago: 'Efectivo'
    })
  });

  const data = await response.json();
  console.log(data);
};
```

### Python (Requests)

```python
import requests

url = 'http://localhost:1337/api/ventas/registrar'
data = {
    'clienteId': 1,
    'productos': [
        {'productoId': 3, 'cantidad': 2},
        {'productoId': 7, 'cantidad': 1}
    ],
    'medioPago': 'Efectivo'
}

response = requests.post(url, json=data)
print(response.json())
```

---

## Configuración de Autenticación

Por defecto, los endpoints están configurados con `auth: false` para facilitar las pruebas.

Para producción, cambiar en `/src/api/factura/routes/factura.ts`:

```typescript
{
  method: 'POST',
  path: '/ventas/registrar',
  handler: 'factura.registrarVenta',
  config: {
    auth: true, // Cambiar a true
    policies: [],
    middlewares: [],
  },
}
```

Y enviar el token JWT en las peticiones:

```bash
curl -X POST http://localhost:1337/api/ventas/registrar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```
