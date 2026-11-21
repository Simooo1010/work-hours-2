# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

# Work Tracker — "Tassametro" UI

The app UI follows the Work Hours "Tassametro" design spec: a taxi meter for your own work.

- **Two colours only**: safety yellow `#FFD60A` and near-black `#121212` (night theme = inverted, follows the OS setting). State is carried by fill, position and words, never by a third colour.
- **Type**: Big Shoulders Display (numbers, big buttons), IBM Plex Mono (labels), IBM Plex Sans (text and inputs).
- **Screens**: Timer (split-flap clock, live money meter, half-hour rounding ruler), Settimana (punched time card, totals, stub), Finance, Analisi, Sessioni, Impostazioni, Login. Desktop (>= 768 px) shows the timer on the left and Oggi / Settimana on the right.
- **Components** live in `src/components/Tassametro.jsx` (`FlapRow`, `Meter`, `RoundingRuler`, `TimeCard`, `Stub`, `Stamp`); tokens and styles in `src/tassametro.css` (loaded after `src/index.css`, which it remaps).
- **Accessibility**: the flap row is a single `role="img"` with the full time as label; reduced-motion disables flips and swaps digits.
- Logic is unchanged: Supabase / local demo mode, `utils/rounding.js`, `utils/financeIntegration.js`.

Development: `npm install`, `npm run dev`, `npm run build`, `npm run lint`.
Note: `npm run lint` reports pre-existing errors in files outside this change; the new files are lint-clean.
