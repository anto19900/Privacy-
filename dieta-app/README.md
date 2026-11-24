# 🥗 Dieta & Spesa

App Android (React + TypeScript + Tailwind CSS + Capacitor) per:

- **Profilo e fabbisogno**: wizard iniziale, BMR (Mifflin-St Jeor), TDEE, calorie target e macro.
  Per il dimagrimento scegli il ritmo (0,5–1,5 kg/settimana): deficit = kg × 7.700 / 7 kcal al giorno.
- **Piano settimanale** Lun–Dom, 5 pasti al giorno, con alimenti generici a *cluster*
  (carboidrati, proteine, verdure, grassi, frutta…) e grammature calcolate sul fabbisogno.
- **Ottimizzatore macro** (`src/lib/solver.ts`): per ogni giorno le grammature sono calcolate con minimi quadrati
  vincolati per centrare insieme proteine, carboidrati, grassi e kcal (tipicamente entro pochi grammi).
- **Tasto "Cambia"** su ogni alimento: alternative dello stesso cluster; dopo il cambio il giorno viene
  ri-ottimizzato per restare nei macro. ~90 alimenti generici con varianti (senza lattosio/glutine, vegani).
- **Pasto libero settimanale** (giorno, pranzo/cena, ~600/900/1200 kcal): conteggiato nel bilancio
  settimanale riducendo carboidrati e grassi negli altri giorni, proteine invariate.
- **"Invia Pranzo e Cena a Mamma"**: messaggio pronto per WhatsApp / Telegram / condivisione Android / copia testo,
  per il singolo giorno o per tutta la settimana.
- **Lista della spesa** automatica per reparto, aggiornata con i cambi, spunte, voci extra e condivisione.
- **Peso**: registrazione, grafico Recharts con linea obiettivo e **previsione** tratteggiata fino al peso obiettivo
  (data stimata di arrivo), variazione, BMI e distanza dall'obiettivo.

- **Diario dei pasti**: ogni pasto si segna come Mangiato / Altro (kcal stimate) / Saltato; i pasti rimasti
  del giorno vengono ri-ottimizzati sul target residuo. Riquadro aderenza degli ultimi 7 giorni.
- **Metabolismo reale**: media mobile 7 giorni del peso e stima del TDEE reale (calorie medie − variazione
  di peso × 7.700) con proposta di correzione delle calorie applicabile con un tocco (`src/lib/adaptive.ts`).
- **Promemoria** (notifiche locali): pesata, menù a Mamma (apre già il messaggio del giorno dopo), spesa.

- **Preferiti e "mai più"** dal tasto Cambia; **varietà** alta/media/bassa; **pasti ripetibili**
  ("uguale a ieri", "ripeti questo pasto tutta la settimana").
- **Giorni di allenamento**: +20% carboidrati, presi dai giorni di riposo (media settimanale e proteine invariate).
- **Spesa smart**: confezioni reali, "ce l'ho già" in dispensa, spesa divisa Lun–Gio / Ven–Dom.
- **Misure corporee e foto** (vita, fianchi, collo… % grasso stimata con formula US Navy, confronto foto).
- **Backup** JSON (foto incluse a scelta) e **export CSV** di peso e misure.
- Tema chiaro/scuro/sistema, icona e splash personalizzati.

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

## Test

```bash
npm test           # Vitest: calcoli, ottimizzatore macro, pasto libero, diario, spesa, export
```

`npm run build` esegue i test prima della build: se la precisione dei macro peggiora, la build si ferma.

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

## APK di release firmato

La firma usa `android/keystore.properties` (non versionato) che punta al keystore in `android/keystore/`
(anch'esso escluso da git). Con quei due file al loro posto:

```bash
npm run build && npx cap sync android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Per il Play Store: `./gradlew bundleRelease` (file .aab). **Conserva il keystore e la password**:
senza, non potrai pubblicare aggiornamenti della stessa app.

Formato di `keystore.properties`:

```
storeFile=../keystore/dieta-spesa-release.jks
storePassword=...
keyAlias=dietaspesa
keyPassword=...
```
