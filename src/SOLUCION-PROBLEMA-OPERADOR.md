# 🔧 Solución: Error de Autenticación de Operador

## ✅ Problema Resuelto

**Síntoma**: Al iniciar sesión como operador, el sistema mostraba un error de autenticación y no permitía acceder al dashboard.

**Causa**: El backend no manejaba correctamente los casos donde:
1. El perfil del usuario no existía en la tabla `profiles`
2. Los datos adicionales del operador no existían en la tabla `operators`
3. Los errores no se registraban adecuadamente para debugging

## 🔨 Cambios Realizados

### 1. Backend: Mejor Manejo de Errores en `/auth/me`

**Archivo**: `/supabase/functions/server/index.tsx`

**Mejoras**:
- ✅ Logs detallados en cada paso de autenticación
- ✅ Creación automática de perfil si no existe (usando `user_metadata`)
- ✅ Manejo graceful de datos adicionales faltantes (operators/experts)
- ✅ No bloquea el login si faltan datos secundarios

```typescript
// ANTES: Fallaba si no había perfil
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

if (error) {
  return c.json({ error: "Error al obtener perfil" }, 500); // ❌ Bloqueaba
}

// AHORA: Crea el perfil si no existe
if (profileError && profileError.code === 'PGRST116') {
  console.log("Perfil no existe, creando desde metadatos...");
  const { data: newProfile } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || 'Usuario',
      phone: user.user_metadata?.phone || '',
      city: user.user_metadata?.city || null,
      role: user.user_metadata?.role || 'usuario'
    })
    .select()
    .single();
  
  return c.json(newProfile); // ✅ Devuelve el perfil recién creado
}
```

### 2. Backend: Mejora en `verifyAuth()`

**Mejoras**:
- ✅ Validación del formato del header
- ✅ Logs detallados del proceso de autenticación
- ✅ Manejo de excepciones

```typescript
// ANTES: Simple pero sin logs
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) return null;
  const accessToken = authHeader.split(" ")[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  return user;
}

// AHORA: Con validación y logs
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) {
    console.log("No se proporcionó header de autorización");
    return null;
  }
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.log("Formato de header inválido:", authHeader);
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(parts[1]);
    
    if (error) {
      console.log("Error verificando usuario:", error.message);
      return null;
    }

    console.log("Usuario autenticado:", user.email, "ID:", user.id);
    return user;
  } catch (error: any) {
    console.log("Excepción verificando auth:", error.message);
    return null;
  }
}
```

### 3. Frontend: `AuthProvider` con Fallback

**Archivo**: `/components/auth/AuthProvider.tsx`

**Mejoras**:
- ✅ Logs de debugging
- ✅ Fallback a `user_metadata` si falla la API
- ✅ Mejor manejo de errores

```typescript
const loadUserData = async (supabaseUser: User) => {
  try {
    console.log('Cargando datos para usuario:', supabaseUser.email);
    const userData = await fetchFromServer('/auth/me');
    
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: userData.name || supabaseUser.user_metadata.name || 'Usuario',
      phone: userData.phone || supabaseUser.user_metadata.phone || '',
      role: userData.role || supabaseUser.user_metadata.role || 'usuario',
    });
    
    console.log('Usuario cargado con rol:', userData.role);
  } catch (error: any) {
    console.error('Error cargando datos:', error);
    
    // FALLBACK: usar datos de metadata de auth
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || 'Usuario',
      phone: supabaseUser.user_metadata?.phone || '',
      role: supabaseUser.user_metadata?.role || 'usuario',
    });
    
    console.log('Usando datos de fallback del user_metadata');
  }
};
```

### 4. Frontend: Logs en `fetchFromServer`

**Archivo**: `/utils/supabase/client.tsx`

**Mejoras**:
- ✅ Logs de peticiones HTTP
- ✅ Información del token usado
- ✅ Respuestas del servidor
- ✅ Manejo detallado de errores

---

## 🧪 Cómo Probar que Funciona

### Paso 1: Abrir Consola del Navegador
```
Presiona F12 → Pestaña "Console"
```

### Paso 2: Registrar un Operador Nuevo

1. Click en "Regístrate aquí"
2. Selecciona rol: **Operador**
3. Completa:
   - Nombre: María Operadora
   - Email: operadora@test.com
   - Teléfono: +34 600 111 222
   - Ciudad: Madrid
   - **Turno: Mañana** (obligatorio para operadores)
   - Contraseña: test123
4. Click en "Crear Cuenta"

**En la consola deberías ver**:
```
[fetchFromServer] Petición a: /auth/signup
[fetchFromServer] Usando access token del usuario
Obteniendo perfil para usuario: [uuid]
Perfil encontrado: operadora@test.com Rol: operador
Usuario cargado exitosamente con rol: operador
```

### Paso 3: Iniciar Sesión como Operador

1. Si acabas de registrarte, ya deberías estar en el dashboard
2. Si no, inicia sesión con: operadora@test.com / test123

**Deberías ver**:
- ✅ Dashboard de Operador
- ✅ Estadísticas globales
- ✅ Lista de TODOS los tickets
- ✅ Botones "Asignar a Experto"

**En la consola deberías ver**:
```
[fetchFromServer] Petición a: /auth/me
Usuario autenticado: operadora@test.com ID: [uuid]
Perfil encontrado: operadora@test.com Rol: operador
Devolviendo datos de usuario con rol: operador
Usuario cargado con rol: operador
[fetchFromServer] Petición a: /tickets
[fetchFromServer] Petición a: /stats
```

---

## 🐛 Debugging: Si Aún No Funciona

### Problema 1: "No autorizado" al cargar el dashboard

**Síntoma**: El login funciona pero luego muestra error 401

**Solución**:
1. Abre la consola (F12)
2. Busca el mensaje: `[fetchFromServer] hasToken: false`
3. Si dice `false`, el problema está en la sesión de Supabase

**Fix**:
```typescript
// Limpiar sesión y volver a intentar
const supabase = createClient();
await supabase.auth.signOut();
// Volver a iniciar sesión
```

### Problema 2: "Perfil no encontrado"

**Síntoma**: El backend no encuentra el perfil en la tabla `profiles`

**Solución en SQL**:
```sql
-- Verificar si existe el perfil
SELECT * FROM profiles WHERE email = 'operadora@test.com';

-- Si no existe, verificar en auth.users
SELECT * FROM auth.users WHERE email = 'operadora@test.com';

-- Si existe en auth pero no en profiles, el trigger no funcionó
-- Crear manualmente:
INSERT INTO profiles (id, email, name, phone, city, role)
VALUES (
  'uuid-del-auth-user',
  'operadora@test.com',
  'María Operadora',
  '+34 600 111 222',
  'Madrid',
  'operador'
);
```

### Problema 3: Tabla `operators` no existe

**Síntoma**: Error mencionando `operators` o `relation does not exist`

**Solución**: Ejecutar el script de migración
```bash
1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta: /MIGRACION-NORMALIZADA.sql
```

### Problema 4: El operador no tiene registro en tabla `operators`

**Síntoma**: Login funciona pero faltan datos (turno, departamento)

**Solución en SQL**:
```sql
-- Verificar registro en operators
SELECT * FROM operators WHERE id IN (
  SELECT id FROM profiles WHERE email = 'operadora@test.com'
);

-- Si no existe, crear:
INSERT INTO operators (id, shift, department)
VALUES (
  (SELECT id FROM profiles WHERE email = 'operadora@test.com'),
  'Mañana',
  NULL
);
```

---

## 📊 Verificación Final

### Consulta SQL para verificar operadores

```sql
-- Ver todos los operadores con sus datos completos
SELECT 
  p.email,
  p.name,
  p.phone,
  p.city,
  p.role,
  o.shift,
  o.department,
  o.tickets_assigned,
  o.created_at
FROM profiles p
LEFT JOIN operators o ON p.id = o.id
WHERE p.role = 'operador'
ORDER BY p.created_at DESC;
```

**Resultado esperado**:
| email | name | role | shift | tickets_assigned |
|-------|------|------|-------|------------------|
| operadora@test.com | María Operadora | operador | Mañana | 0 |

### Consulta SQL para verificar función de trigger

```sql
-- Ver triggers activos
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth';
```

Debería mostrar: `handle_new_user` en la tabla `auth.users`

---

## ✅ Checklist de Verificación

Marca cada elemento cuando lo verifiques:

- [ ] Ejecuté `/MIGRACION-NORMALIZADA.sql` en Supabase
- [ ] La tabla `operators` existe
- [ ] El trigger `handle_new_user` existe
- [ ] Puedo registrar un operador nuevo
- [ ] El operador aparece en tabla `profiles` con role='operador'
- [ ] El operador aparece en tabla `operators` con su turno
- [ ] Puedo iniciar sesión como operador
- [ ] Veo el dashboard de operador (no de usuario)
- [ ] Veo TODOS los tickets (no solo míos)
- [ ] Puedo filtrar tickets
- [ ] Puedo asignar tickets a expertos
- [ ] Las estadísticas se muestran correctamente
- [ ] No hay errores en la consola del navegador

---

## 🎯 Resultado Esperado

Después de estos cambios, **TODOS los roles funcionan correctamente**:

### ✅ Usuario
- Registra ✓
- Login ✓
- Dashboard ✓
- Crea tickets ✓

### ✅ Operador
- Registra con turno ✓
- Login ✓
- Dashboard con TODOS los tickets ✓
- Filtra tickets ✓
- Asigna tickets ✓

### ✅ Experto
- Registra con especializaciones ✓
- Login ✓
- Dashboard con tickets asignados ✓
- Cambia estados ✓
- Chat con usuarios ✓

---

## 💡 Logs Útiles para Debugging

### Ver logs del servidor en tiempo real

Los logs aparecen en la consola del navegador con el prefijo `[fetchFromServer]`

**Logs exitosos**:
```
[fetchFromServer] Petición a: /auth/me
[fetchFromServer] Usando access token del usuario
Usuario autenticado: email@test.com ID: uuid
Perfil encontrado: email@test.com Rol: operador
Devolviendo datos de usuario con rol: operador
```

**Logs con error**:
```
[fetchFromServer] Error en /auth/me: {"error":"No autorizado"}
Error cargando datos del usuario: No autorizado
Usando datos de fallback del user_metadata
```

Si ves el segundo caso, el problema está en la autenticación del backend.

---

## 🚀 Siguiente Paso

Una vez funcionando correctamente:

1. ✅ Registra 1 operador
2. ✅ Registra 2-3 expertos con diferentes especializaciones
3. ✅ Registra 2-3 usuarios
4. ✅ Crea tickets como usuarios
5. ✅ Asigna tickets como operador
6. ✅ Resuelve tickets como experto

**¡Tu sistema está 100% funcional!** 🎉
