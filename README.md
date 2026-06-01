# Agenda de Recordatorios Telegram

Aplicación web para enviar recordatorios automáticos por Telegram, funcionando 24/7 desde un servidor.

## Estructura del proyecto

```
agenda-bot/
├── server.js          ← servidor Node.js + cron jobs
├── package.json       ← dependencias
├── .gitignore
└── public/
    └── index.html     ← página web
```

## Cómo subir a Railway (hosting gratuito)

### Paso 1 — Crear cuenta en GitHub
1. Entrá a https://github.com y creá una cuenta gratuita

### Paso 2 — Subir el proyecto a GitHub
1. En GitHub, hacé clic en "New repository"
2. Nombre: `agenda-bot`
3. Hacé clic en "Create repository"
4. Subí los archivos: arrastrá todos los archivos del proyecto al repositorio

### Paso 3 — Crear cuenta en Railway
1. Entrá a https://railway.app
2. Hacé clic en "Login with GitHub"
3. Autorizá Railway

### Paso 4 — Deployar el proyecto
1. En Railway, hacé clic en "New Project"
2. Elegí "Deploy from GitHub repo"
3. Seleccioná tu repositorio `agenda-bot`
4. Railway detecta automáticamente que es Node.js y lo despliega

### Paso 5 — Conectar tu dominio
1. En Railway, ir a tu proyecto → Settings → Networking
2. Hacé clic en "Generate Domain" para obtener un dominio gratuito
3. O agregá tu dominio propio en "Custom Domain"

## Uso

1. Abrí tu dominio en el navegador
2. Ingresá tu Bot Token y Chat ID de Telegram
3. Hacé clic en "Guardar →" — llegará un mensaje de prueba a tu Telegram
4. Agregá tus recordatorios con hora y días
5. ¡Listo! Los mensajes llegan solos, sin necesidad de tener la página abierta
