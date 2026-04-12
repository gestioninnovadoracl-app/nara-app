# NARA App — Gestión de tienda de ropa

App móvil web para gestión de inventario y ventas diarias.

## Stack
- React + Vite
- Firebase (Auth + Firestore + Storage)
- Vercel (deploy)

---

## PASO 1 — Configurar Firebase

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Crea un nuevo proyecto → ponle nombre: `nara-app`
3. En el proyecto, ve a **Authentication** → Comenzar → habilita **Correo/contraseña**
4. Crea un usuario: **Authentication → Usuarios → Agregar usuario**
   - Correo: el que uses para ingresar (ej: admin@nara.com)
   - Contraseña: la que elijas
5. Ve a **Firestore Database** → Crear base de datos → Modo producción → elige región
6. En **Reglas de Firestore**, pega esto:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
7. Ve a **Storage** → Comenzar → acepta reglas por defecto
8. En **Reglas de Storage**, pega esto:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
9. Ve a **Configuración del proyecto** (ícono engranaje) → **Tus apps** → Agrega app Web (</>)
   - Ponle nombre `nara-web` y copia las credenciales

---

## PASO 2 — Subir a GitHub

```bash
cd nara-app
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/nara-app.git
git push -u origin main
```

---

## PASO 3 — Deploy en Vercel

1. Ve a [https://vercel.com](https://vercel.com) → New Project → importa tu repo de GitHub
2. En **Environment Variables**, agrega estas variables con tus datos de Firebase:

| Variable | Valor |
|---|---|
| VITE_FIREBASE_API_KEY | tu apiKey |
| VITE_FIREBASE_AUTH_DOMAIN | tu authDomain |
| VITE_FIREBASE_PROJECT_ID | tu projectId |
| VITE_FIREBASE_STORAGE_BUCKET | tu storageBucket |
| VITE_FIREBASE_MESSAGING_SENDER_ID | tu messagingSenderId |
| VITE_FIREBASE_APP_ID | tu appId |

3. Clic en **Deploy** — listo ✓

Cada vez que hagas `git push`, Vercel actualiza la app automáticamente.

---

## Desarrollo local

```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales de Firebase
npm install
npm run dev
```

---

## Variables de entorno — lista completa para Vercel

| Variable | Descripción |
|---|---|
| VITE_FIREBASE_API_KEY | apiKey de Firebase |
| VITE_FIREBASE_AUTH_DOMAIN | authDomain de Firebase |
| VITE_FIREBASE_PROJECT_ID | projectId de Firebase |
| VITE_FIREBASE_STORAGE_BUCKET | storageBucket de Firebase |
| VITE_FIREBASE_MESSAGING_SENDER_ID | messagingSenderId de Firebase |
| VITE_FIREBASE_APP_ID | appId de Firebase |
| VITE_APP_USER | El nombre de usuario para el login (ej: `nara`) |
| VITE_APP_EMAIL | El correo que creaste en Firebase Auth (ej: `admin@nara.internal`) |
| VITE_APP_PASSWORD | La contraseña que creaste en Firebase Auth |

> En la pantalla de login solo aparece "Usuario" y "Contraseña". El correo queda completamente oculto.
