
## Configuración Principal

### `main.ts`
- Configuración global de la aplicación NestJS.
- **Características:**
  - Validación global con `ValidationPipe`.
  - Configuración CORS.
  - Documentación Swagger.
  - Conexión a MongoDB.

### `app.module.ts`
- Módulo principal que importa:
  - `ConfigModule` para variables de entorno.
  - `MongooseModule` para la conexión a MongoDB.
  - `UsersModule` y `AuthModule` para funcionalidades específicas.

### `app.controller.ts` y `app.service.ts`
- Controlador y servicio básicos con un endpoint `/` que retorna "Hello World!".

## Módulo de Usuarios

### `users.controller.ts`
- Controlador RESTful para la gestión de usuarios.
- **Endpoints:**
  - `POST /usuarios`: Crear un nuevo usuario.
  - `GET /usuarios`: Obtener todos los usuarios.
  - `GET /usuarios/:id`: Obtener un usuario por ID.
  - `PUT /usuarios/:id`: Actualizar un usuario (requiere autenticación JWT).
  - `DELETE /usuarios/:id`: Eliminar un usuario (requiere autenticación JWT).
- **Decoradores Swagger** para documentación automática.

### `users.service.ts`
- Lógica de negocio para operaciones CRUD.
- **Características:**
  - Validación de ID y correo electrónico único.
  - Manejo de contraseñas con bcrypt.
  - Exclusión de contraseñas en respuestas.

### `user.schema.ts`
- Esquema de MongoDB para usuarios.
- **Campos:**
  - `nombreCompleto`: Nombre del usuario (requerido).
  - `correoElectronico`: Correo único (requerido).
  - `contraseña`: Contraseña hasheada (requerido).
  - `activo`: Estado del usuario (default: true).
- **Middleware:** Hashing automático de contraseñas antes de guardar.

### DTOs (Data Transfer Objects)
- `create-user.dto.ts`: Define la estructura para crear usuarios.
- `update-user.dto.ts`: Extiende `CreateUserDto` con campos opcionales.

## Autenticación
- **JWT (JSON Web Tokens):** Protege endpoints sensibles (`PUT`, `DELETE`).
- **Guard `JwtAuthGuard`:** Verifica tokens en solicitudes.

## Base de Datos
- **MongoDB:** Conectado mediante `MongooseModule`.
- **URI:** Configurable por variable de entorno (`MONGODB_URI`).

## Documentación API
- **Swagger UI:** Disponible en `/api/docs`.
- **Autenticación Bearer:** Configurada para endpoints protegidos.

## Pruebas
- **Pruebas Unitarias:** Ejemplo en `app.controller.spec.ts` (usando Jest).

## Instalación y Uso
1. Clonar el repositorio.
2. Instalar dependencias: `npm install`.
3. Configurar `.env` con `MONGODB_URI`.
4. Ejecutar: `npm run start:dev`.
5. Acceder a Swagger en `http://localhost:3000/api/docs`.

## Dependencias Clave
- NestJS Core
- Mongoose
- Bcrypt (hashing)
- JWT (autenticación)
- Swagger (documentación)
- Class-validator (validación)

## Notas Adicionales
- Las contraseñas se hashean automáticamente antes de guardar.
- Los endpoints sensibles requieren autenticación JWT.
- Swagger proporciona interactividad para probar la API.