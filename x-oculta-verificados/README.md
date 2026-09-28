# Oculta Verificados

Oculta tweets de contas com selo de verificado azul (X Premium) no X / Twitter.

- `extension/` — extensão para navegador (Chrome, Edge, Brave, Opera, Firefox desktop e Firefox Android).
- `mobile/` — app Android/iOS (Expo + React Native) que abre o x.com em uma WebView e aplica o mesmo filtro.

## Funcionalidades

- Oculta tweets de autores com selo **azul** (padrão), e opcionalmente **dourado** (organizações) e **cinza** (governo).
- Opção de ocultar também tweets que **citam** contas verificadas.
- Dois modos: **Remover** da timeline ou **Recolher** (mostra uma faixa com botão "Mostrar").
- Lista de **exceções** (@ que nunca serão ocultados).
- Contador de tweets ocultos.

## Extensão

### Chrome / Edge / Brave / Opera

1. Abra `chrome://extensions` (ou `edge://extensions`).
2. Ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione a pasta `extension/`.
4. Abra o x.com. Clique no ícone da extensão para configurar.

### Firefox

1. Abra `about:debugging#/runtime/this-firefox`.
2. Clique em **Carregar extensão temporária** e escolha `extension/manifest.json`.

Para instalar de forma permanente (inclusive no Firefox para Android), empacote com
[`web-ext`](https://github.com/mozilla/web-ext) (`npx web-ext build -s extension`) e assine no addons.mozilla.org.

## App mobile

O app oficial do X não permite modificar a timeline, então o app abre o x.com em uma WebView
e injeta o filtro. Faça login com usuário e senha (o Google bloqueia login dentro de WebViews).

```bash
cd mobile
npm install
npx expo start
```

Escaneie o QR code com o **Expo Go** (Android/iOS) ou rode `npx expo run:android` / `npx expo run:ios`.
Para gerar APK/IPA use [EAS Build](https://docs.expo.dev/build/introduction/): `npx eas build -p android`.

O botão azul flutuante mostra quantos tweets foram ocultos; toque nele para abrir as configurações.

## Como funciona

O X marca o selo com `svg[data-testid="icon-verified"]` dentro de `[data-testid="User-Name"]` de cada
`article[data-testid="tweet"]`. O tipo de selo é detectado assim:

| Selo    | Detecção                                   |
| ------- | ------------------------------------------ |
| Dourado | o SVG contém um `linearGradient`           |
| Azul    | cor do SVG com azul predominante (#1d9bf0) |
| Cinza   | demais cores (#829aab)                     |

Um `MutationObserver` processa os tweets conforme a timeline carrega. Se o X mudar o HTML, ajuste os
seletores em `extension/content.js` e `mobile/src/injectedScript.js`.

> Observação: o X não diferencia mais visualmente o selo azul "legado" do pago, então ambos são ocultados.
