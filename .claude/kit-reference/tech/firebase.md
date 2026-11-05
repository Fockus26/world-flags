# Firebase (Auth + Firestore)

## Local backend for QA

The emulators, not Docker: they need Java (a JDK) and the `firebase-tools` CLI.

- `firebase.json` with an `emulators` block (auth, firestore, ui) in git, and a `"emulators":
  "firebase emulators:start --project demo-<project>"` script. The project is always `demo-*`:
  with it the emulators cannot reach real resources.
- The client connects to them when `NEXT_PUBLIC_USE_EMULATORS` (`PUBLIC_`/`VITE_` in
  Astro/Vite) is `"true"` (`connectAuthEmulator`, `connectFirestoreEmulator`); the Admin SDK
  reads `FIREBASE_AUTH_EMULATOR_HOST`/`FIRESTORE_EMULATOR_HOST` by itself.
- `qa-local.ts` sets all of that, gives the role as a custom claim (`role`) and runs
  `scripts/seed-emulator.ts` if it exists. A role kept in a document (`admins/{uid}`) →
  `assignRoleFirebase` in `scripts/qa-roles.ts`.
- In git: `firestore.rules`, `firestore.indexes.json`, `firebase.json`.

## Rules tests

`@firebase/rules-unit-testing`: `initializeTestEnvironment` in `beforeAll(fn, 30_000)` — bun's
default 5 s ran out on the first cold run and the suite failed (inversiones-js) — and their
folder out of `test:related` (`--dir`), since they need the emulator.

## Emails

Check before designing that the console's templates can do what the design asks:
`EMAIL-TEMPLATES.md` § Firebase.

## Leaving it

To move a project to César's VPS, when he asks: `migrate-firebase-vps.md`. Firestore means
redesigning the model, so check its estimate first.
