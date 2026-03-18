# Workshop Orders API

REST API para gestión de órdenes de trabajo de taller mecánico, construida con NestJS, TypeORM y PostgreSQL.

## Stack Tecnológico

- **Framework:** NestJS v10
- **Base de datos:** PostgreSQL 16
- **ORM:** TypeORM
- **Autenticación:** JWT (Passport)
- **Validación:** class-validator + class-transformer
- **Documentación:** Swagger (OpenAPI)
- **Contenedores:** Docker & Docker Compose

## Estructura del Proyecto

```
src/
├── auth/                    # Módulo de autenticación (JWT)
│   ├── decorators/          # Decorador @Public()
│   ├── dto/                 # RegisterDto, LoginDto
│   ├── entities/            # User entity
│   ├── guards/              # JwtAuthGuard
│   └── strategies/          # JwtStrategy (Passport)
├── customers/               # Módulo de clientes
│   ├── dto/                 # CreateCustomerDto, UpdateCustomerDto
│   └── entities/            # Customer entity
├── vehicles/                # Módulo de vehículos
│   ├── dto/                 # CreateVehicleDto, UpdateVehicleDto
│   └── entities/            # Vehicle entity
├── work-orders/             # Módulo de órdenes de trabajo
│   ├── dto/                 # CRUD DTOs + FilterWorkOrdersDto
│   ├── entities/            # WorkOrder entity
│   └── enums/               # WorkOrderStatus enum + transiciones
├── common/                  # Filtros globales, DTOs comunes
│   ├── dto/                 # PaginationDto, PaginatedResponseDto
│   └── filters/             # AllExceptionsFilter
├── config/                  # Configuración (database, jwt)
├── app.module.ts
└── main.ts
```

## Requisitos Previos

- Node.js >= 18
- Docker y Docker Compose (para PostgreSQL)
- npm

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd workshop-orders-api
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_NAME=workshop_orders
JWT_SECRET=tu-secret-seguro
JWT_EXPIRATION=1d
APP_PORT=3000
```

### 3. Opción A: Ejecutar con Docker Compose (recomendado)

```bash
docker-compose up -d
```

Esto levanta PostgreSQL y la API automáticamente. La API estará disponible en `http://localhost:3000`.

### 3. Opción B: Ejecutar localmente

Primero, levantar solo PostgreSQL con Docker:

```bash
docker-compose up -d postgres
```

Luego instalar dependencias y ejecutar:

```bash
npm install
npm run start:dev
```

### 4. Acceder a la documentación Swagger

Abrir en el navegador: [http://localhost:3000/api](http://localhost:3000/api)

## Endpoints

### Autenticación (públicos)

| Método | Ruta            | Descripción              |
| ------ | --------------- | ------------------------ |
| POST   | /auth/register  | Registrar nuevo usuario  |
| POST   | /auth/login     | Login (retorna JWT)      |

### Clientes (protegidos con JWT)

| Método | Ruta            | Descripción                   |
| ------ | --------------- | ----------------------------- |
| POST   | /customers      | Crear cliente                 |
| GET    | /customers      | Listar clientes (paginado)    |
| GET    | /customers/:id  | Obtener cliente por ID        |
| PATCH  | /customers/:id  | Actualizar cliente            |
| DELETE | /customers/:id  | Eliminar cliente (soft delete)|

### Vehículos (protegidos con JWT)

| Método | Ruta           | Descripción                    |
| ------ | -------------- | ------------------------------ |
| POST   | /vehicles      | Crear vehículo                 |
| GET    | /vehicles      | Listar vehículos (paginado)    |
| GET    | /vehicles/:id  | Obtener vehículo por ID        |
| PATCH  | /vehicles/:id  | Actualizar vehículo            |
| DELETE | /vehicles/:id  | Eliminar vehículo (soft delete)|

### Órdenes de Trabajo (protegidos con JWT)

| Método | Ruta                    | Descripción                          |
| ------ | ----------------------- | ------------------------------------ |
| POST   | /work-orders            | Crear orden de trabajo               |
| GET    | /work-orders            | Listar órdenes (paginado + filtros)  |
| GET    | /work-orders/:id        | Obtener orden por ID                 |
| PATCH  | /work-orders/:id        | Actualizar campos (no status)        |
| PATCH  | /work-orders/:id/status | Cambiar estado de la orden           |
| DELETE | /work-orders/:id        | Eliminar orden (soft delete)         |

**Filtros disponibles en GET /work-orders:**
- `?status=RECEIVED` — Filtrar por estado
- `?customerId=uuid` — Filtrar por cliente
- `?page=1&limit=10` — Paginación

## Flujo de Estados (Work Orders)

```
RECEIVED → IN_PROGRESS → COMPLETED → DELIVERED
```

Solo se permiten transiciones **en orden secuencial**. Cualquier intento de transición inválida retorna un error `400 Bad Request` con un mensaje descriptivo.

## Características Implementadas

- ✅ Autenticación JWT con Passport
- ✅ Validación de inputs con class-validator
- ✅ Manejo global de errores con ExceptionFilter
- ✅ Paginación en todos los listados
- ✅ Documentación Swagger en /api
- ✅ Soft delete en todas las entidades (Customer, Vehicle, WorkOrder)
- ✅ Audit fields automáticos (createdAt, updatedAt) con TypeORM
- ✅ Filtros por status y customerId en work-orders
- ✅ Docker Compose (PostgreSQL + API)
- ✅ Variables de entorno con .env
- ✅ Unit tests (12+ tests)

## Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con cobertura
npm run test:cov

# Ejecutar tests en modo watch
npm run test:watch
```

## Modelo de Base de Datos

```
┌──────────┐       ┌──────────┐       ┌─────────────┐
│  users   │       │customers │       │  vehicles   │
├──────────┤       ├──────────┤       ├─────────────┤
│ id (PK)  │       │ id (PK)  │◄──┐   │ id (PK)     │
│ email    │       │ name     │   └───│ customerId  │
│ password │       │ email    │       │ plate       │
│ name     │       │ phone    │       │ brand       │
│ createdAt│       │ createdAt│       │ model       │
│ updatedAt│       │ updatedAt│       │ year        │
└──────────┘       │ deletedAt│       │ createdAt   │
                   └──────────┘       │ updatedAt   │
                                      │ deletedAt   │
                                      └──────┬──────┘
                                             │
                                      ┌──────┴──────┐
                                      │ work_orders │
                                      ├─────────────┤
                                      │ id (PK)     │
                                      │ vehicleId   │
                                      │ description │
                                      │ status      │
                                      │ technician  │
                                      │   Notes     │
                                      │ createdAt   │
                                      │ updatedAt   │
                                      │ deletedAt   │
                                      └─────────────┘
```

## Decisiones Técnicas

- **TypeORM** fue elegido por su excelente integración nativa con NestJS y soporte de decoradores.
- **Soft delete** implementado con `@DeleteDateColumn()` de TypeORM para mantener un historial de registros eliminados.
- **Flujo de estados** validado en la capa de servicio para separar la lógica de negocio del controlador (principio SOLID - SRP).
- **Guard global JWT** con decorador `@Public()` para excepcionar rutas públicas, evitando repetir `@UseGuards()` en cada controlador.
- **ExceptionFilter global** para formateo uniforme de errores en toda la API.

## Licencia

MIT
