# ArbitroCV — Plataforma de Formación Arbitral FFCV

Plataforma web para el Comité de Árbitros de la Comunitat Valenciana. Tests por regla, situaciones de partido con vídeo, insignias gamificadas, ranking y panel de administración completo.

---

## Stack

- **Frontend**: React 18 + Vite
- **Auth + DB**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Vídeos**: YouTube / Google Drive / Cloudinary (embed por URL)

---

## Despliegue paso a paso

### 1. Supabase (base de datos)

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Crea el proyecto (guarda la contraseña)
3. Ve a **SQL Editor** → pega el contenido de `supabase-schema.sql` → **Run**
4. Ve a **Settings → API** y copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`

### 2. Variables de entorno

Crea el archivo `.env` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://XXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...
```

### 3. Instalar y probar en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

### 4. Subir a GitHub

```bash
git init
git add .
git commit -m "ArbitroCV inicial"
git remote add origin https://github.com/TU_USUARIO/arbitrocv.git
git push -u origin main
```

### 5. Deploy en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa el repositorio de GitHub
3. En **Environment Variables** añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Haz clic en **Deploy**

¡Listo! Vercel redesplegará automáticamente cada vez que hagas push a main.

---

## Primer acceso y configuración

### Crear cuenta de admin

1. Accede a la web → **Regístrate** con tu email
2. En Supabase → **Table Editor → profiles** → busca tu usuario
3. Cambia `status` a `active` y `role` a `admin`
4. Ya puedes entrar al panel de admin (`/admin`)

### Añadir preguntas

**Opción A — Panel admin:**
- Ve a `/admin/preguntas` → **Nueva pregunta**

**Opción B — Importar CSV:**
Formato del CSV:
```
regla,pregunta,opcion_a,opcion_b,opcion_c,opcion_d,correcta,explicacion
12,"¿Qué distancia debe guardar la barrera?","9,15 m","7 m","10 m","5 m",0,"Según la Regla 13..."
1,"¿Cuánto mide el círculo central?","9,15 m radio","7 m radio","11 m radio","5 m radio",0,"El radio es 9,15 m"
```

### Añadir vídeos de situaciones

1. Sube el vídeo a **YouTube**, **Google Drive** o **Cloudinary**
2. Ve a `/admin/situaciones`
3. Pega la URL en el campo correspondiente

Formatos soportados:
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://drive.google.com/file/d/FILE_ID/view`
- `https://res.cloudinary.com/...`

### Añadir vídeos al temario

1. Ve a `/admin/temario`
2. Haz clic en **Editar** en la regla correspondiente
3. Añade la URL del vídeo y los puntos clave

---

## Aprobar árbitros nuevos

Cuando un árbitro se registra, queda en estado `pending`. Para aprobarle:

1. Ve a `/admin/usuarios`
2. Haz clic en **Aprobar**

O directamente en Supabase → tabla `profiles` → cambia `status` a `active`.

---

## Estructura del proyecto

```
arbitrocv/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Topbar + sidebar
│   ├── hooks/
│   │   ├── useAuth.jsx          # Contexto de autenticación
│   │   └── useToast.jsx         # Sistema de notificaciones
│   ├── lib/
│   │   ├── supabase.js          # Cliente Supabase
│   │   └── data.js              # Datos estáticos (reglas, insignias)
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Tests.jsx            # Motor de tests con cronómetro
│   │   ├── Situaciones.jsx      # Reproductor de vídeos + respuestas
│   │   ├── Temario.jsx          # 17 reglas con acordeón
│   │   ├── Insignias.jsx        # Sistema de logros estilo Duolingo
│   │   ├── RankingMisiones.jsx  # Ranking XP + misiones activas
│   │   └── Admin.jsx            # Panel completo de administración
│   ├── App.jsx                  # Router principal
│   ├── main.jsx
│   └── index.css                # Tokens FFCV + estilos globales
├── supabase-schema.sql          # Schema completo de la BD
├── .env.example
└── package.json
```
