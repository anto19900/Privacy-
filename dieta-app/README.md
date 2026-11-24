# 🥗 Dieta & Spesa

App Android (React + TypeScript + Tailwind CSS + Capacitor) per:

- **Profilo e fabbisogno**: wizard iniziale, BMR (Mifflin-St Jeor), TDEE, calorie target e macro.
  Per il dimagrimento scegli il ritmo (0,5–1,5 kg/settimana): deficit = kg × 7.700 / 7 kcal al giorno.
- **Piano settimanale** Lun–Dom, 5 pasti al giorno, con alimenti generici a *cluster*
  (carboidrati, proteine, verdure, grassi, frutta…) e grammature calcolate sul fabbisogno.
- **Tasto "Cambia"** su ogni alimento: alternative dello stesso cluster con grammature isocaloriche.
- **"Invia Pranzo e Cena a Mamma"**: messaggio pronto per WhatsApp / Telegram / condivisione Android / copia testo,
  per il singolo giorno o per tutta la settimana.
- **Lista della spesa** automatica per reparto, aggiornata con i cambi, spunte, voci extra e condivisione.
- **Peso**: registrazione, grafico Recharts con linea obiettivo e **previsione** tratteggiata fino al peso obiettivo
  (data stimata di arrivo), variazione, BMI e distanza dall'obiettivo.

Funziona 100% offline: i dati restano nel `localStorage` del telefono.

## Struttura

```
src/
  lib/        types, foods (database a cluster), nutrition, plan (generatore + swap isocalorico),
              shopping, messages (testi per Mamma), share (Capacitor Share/WhatsApp/Clipboard), store
  components/ Sheet, ShareSheet, MealCard, MacroSummary, ProfileFields, MammaButton
  screens/    Onboarding, Today, Week, Shopping, Weight, ProfileScreen
android/      progetto nativo Capacitor (com.dieta.planner)
```

## Sviluppo

```bash
npm install
npm run dev        # anteprima nel browser
npm run build      # typecheck + build in dist/
```

## Generare l'APK

Requisiti: **JDK 21** e **Android SDK** (platform 35, build-tools 35).

### Con Android Studio
1. `npm install && npm run build && npx cap sync android`
2. `npx cap open android` (oppure apri la cartella `android/` in Android Studio)
3. Menu **Build → Build App Bundle(s) / APK(s) → Build APK(s)**

### Da riga di comando
```bash
# una sola volta: SDK (accetta le licenze quando richiesto)
export ANDROID_HOME=$HOME/Android/Sdk
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

npm install
npm run apk        # = build + cap sync + ./gradlew assembleDebug
```

L'APK di debug si trova in:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Installazione su telefono collegato via USB: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`
(oppure copia il file sul telefono e aprilo, abilitando "Installa app sconosciute").

> Valori nutrizionali indicativi: l'app non sostituisce il parere di un medico o nutrizionista.
