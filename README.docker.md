# 🐳 Docker - Guía de Despliegue

Esta guía explica cómo dockerizar y desplegar la aplicación SIOV Óptica Central (Strapi).

## 📋 Requisitos Previos

- Docker Engine 20.10+
- Docker Compose 2.0+
- (Opcional) Docker Hub account para publicar imágenes

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.docker .env

# Editar y configurar con valores seguros
nano .env  # o tu editor preferido
```

**⚠️ IMPORTANTE:** Genera claves seguras únicas:

```bash
# Generar claves aleatorias
openssl rand -base64 32
```

### 2. Desarrollo Local con Docker

```bash
# Iniciar en modo desarrollo (con hot-reload)
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Detener
docker-compose -f docker-compose.dev.yml down
```

La aplicación estará disponible en: `http://localhost:1337`

### 3. Producción con Docker

```bash
# Construir y levantar servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f strapi

# Detener
docker-compose down

# Detener y eliminar volúmenes (⚠️ elimina datos)
docker-compose down -v
```

## 🏗️ Arquitectura de Contenedores

El proyecto incluye 3 servicios principales:

### 1. **Strapi** (Backend)
- Node.js 20 Alpine
- Puerto: 1337
- Volúmenes: uploads, data, logs

### 2. **PostgreSQL** (Base de datos)
- PostgreSQL 16 Alpine
- Puerto: 5432
- Volumen persistente para datos

### 3. **Nginx** (Reverse Proxy - Opcional)
- Nginx Alpine
- Puertos: 80, 443
- Sirve archivos estáticos y proxy a Strapi

## 📦 Comandos Útiles

### Construcción de Imágenes

```bash
# Construir imagen de producción
docker build -t siov-optica-central:latest .

# Construir imagen de desarrollo
docker build -f Dockerfile.dev -t siov-optica-central:dev .

# Construir sin caché
docker build --no-cache -t siov-optica-central:latest .
```

### Gestión de Contenedores

```bash
# Ver contenedores en ejecución
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f strapi
docker-compose logs -f postgres

# Reiniciar un servicio
docker-compose restart strapi

# Ejecutar comandos dentro del contenedor
docker-compose exec strapi npm run strapi

# Acceder a la shell del contenedor
docker-compose exec strapi sh

# Ver estadísticas de recursos
docker stats
```

### Gestión de Volúmenes

```bash
# Listar volúmenes
docker volume ls

# Inspeccionar un volumen
docker volume inspect siov-optica-central_strapi-uploads

# Backup de volumen
docker run --rm \
  -v siov-optica-central_strapi-uploads:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restaurar volumen
docker run --rm \
  -v siov-optica-central_strapi-uploads:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

### Base de Datos

```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U strapi -d strapi

# Backup de base de datos
docker-compose exec postgres pg_dump -U strapi strapi > backup.sql

# Restaurar base de datos
docker-compose exec -T postgres psql -U strapi strapi < backup.sql

# Ver logs de PostgreSQL
docker-compose logs -f postgres
```

## 🌐 Despliegue en Servidor

### 1. Preparar el Servidor

```bash
# En el servidor (Ubuntu/Debian)
sudo apt update
sudo apt install docker.io docker-compose git

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Agregar usuario al grupo docker (opcional)
sudo usermod -aG docker $USER
```

### 2. Clonar el Proyecto

```bash
# Clonar repositorio
git clone https://github.com/AdrianCCRS/SIOV-optica-central.git
cd SIOV-optica-central

# Configurar .env
cp .env.docker .env
nano .env  # Editar con valores de producción
```

### 3. Configurar Dominio y SSL

Editar `nginx/conf.d/strapi.conf` y cambiar:

```nginx
server_name tu-dominio.com www.tu-dominio.com;
```

#### Opción A: Certbot (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot

# Obtener certificados
sudo certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Copiar certificados
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem nginx/ssl/

# Descomentar líneas SSL en nginx/conf.d/strapi.conf
```

#### Opción B: Cloudflare + Origin Certificate

1. Generar certificado en Cloudflare Dashboard
2. Guardar en `nginx/ssl/`
3. Configurar SSL en nginx

### 4. Iniciar Aplicación

```bash
# Construir y levantar
docker-compose up -d --build

# Verificar estado
docker-compose ps

# Ver logs
docker-compose logs -f
```

### 5. Configurar Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## 🔄 Actualización de la Aplicación

```bash
# En el servidor
cd /path/to/SIOV-optica-central

# Pull últimos cambios
git pull origin main

# Reconstruir y reiniciar
docker-compose up -d --build

# Ver logs para verificar
docker-compose logs -f strapi
```

## 📊 Monitoreo

### Healthcheck

Los contenedores incluyen healthchecks automáticos:

```bash
# Ver estado de salud
docker-compose ps
docker inspect --format='{{.State.Health.Status}}' siov-strapi
```

### Logs

```bash
# Logs en tiempo real
docker-compose logs -f

# Últimas 100 líneas
docker-compose logs --tail=100

# Logs de últimos 10 minutos
docker-compose logs --since 10m
```

## 🔐 Seguridad

### Mejores Prácticas

1. **Nunca exponer puertos de BD directamente**
   ```yaml
   # Comentar en producción:
   # ports:
   #   - '5432:5432'
   ```

2. **Usar secretos seguros**
   - Generar con `openssl rand -base64 32`
   - Diferentes para cada entorno

3. **Limitar acceso al admin**
   ```nginx
   location /admin {
       allow 192.168.1.0/24;  # Tu IP
       deny all;
   }
   ```

4. **Mantener actualizado**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## 🐛 Troubleshooting

### Problema: Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs strapi

# Verificar configuración
docker-compose config

# Recrear contenedor
docker-compose up -d --force-recreate strapi
```

### Problema: Error de conexión a BD

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Probar conexión
docker-compose exec strapi nc -zv postgres 5432
```

### Problema: Falta de espacio

```bash
# Limpiar imágenes no usadas
docker system prune -a

# Limpiar volúmenes no usados (⚠️ cuidado)
docker volume prune
```

## 📚 Recursos Adicionales

- [Documentación Docker](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Strapi Deployment](https://docs.strapi.io/dev-docs/deployment)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica variables de entorno en `.env`
3. Consulta la documentación de Strapi
4. Abre un issue en el repositorio
