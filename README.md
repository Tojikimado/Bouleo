# Bouleo

Application Windows de gestion de concours de pétanque, entièrement locale,
développée avec Electron, Vite, React et TypeScript.

## Développement

Installer Node.js et npm, puis exécuter `npm ci` et `npm run dev`.
Le téléchargement initial des dépendances et des outils de packaging nécessite
Internet. L'application installée fonctionne hors ligne, sans Node.js installé.

`npm run format` applique le formatage Prettier aux fichiers du projet.
`npm run format:check` vérifie ce formatage sans modifier les fichiers.
Les dépendances, compilations, installateurs et le fichier de verrouillage npm
sont exclus du formatage.

## Organisation du code

- `src/App.tsx` gère la navigation, le concours actif et les brouillons de saisie.
- `src/pages` et `src/components` affichent les données et transmettent les actions.
- `src/utils` regroupe les règles du concours, la génération des parties,
  le classement et les mises à jour du concours.
- `src/types` définit les données métier et les échanges avec Electron.
- `useContestSaving` relie React au coordinateur de sauvegarde, qui conserve
  les modifications en attente et gère les nouvelles tentatives.
- `electron/preload.ts` expose les opérations autorisées à l'interface ;
  `electron/contestStore.ts` valide les données et sérialise les accès aux fichiers.

Les règles communes (taille des équipes, limites, scores et exemptions) se trouvent
dans `src/utils/contestRules.ts`. La validation des fichiers reste nécessaire
à leur lecture et à leur écriture, même si le formulaire contrôle déjà les saisies.

## Version Windows de test 0.1.2

Depuis Windows :

```powershell
npm ci
npm test
npm run lint
npm run build:win
```

- `npm run typecheck` : vérification TypeScript.
- `npm test` : tests de régression métier, formulaires, sauvegardes et fermeture.
- `npm run build` : compilation de l'interface et d'Electron.
- `npm run pack:win` : application Windows x64 décompressée.
- `npm run build:win` : installateur NSIS Windows x64, sans publication.

L'installateur est généré dans
`release/0.1.2/Bouleo-Windows-0.1.2-Setup.exe`.
L'application décompressée se trouve dans `release/0.1.2/win-unpacked`.
Distribuer l'installateur, pas seulement l'exécutable de ce dernier dossier.

Sur la machine de préparation, l'extraction de winCodeSign 2.6.0 a échoué sur
des liens symboliques macOS. Un cache local a été préparé dans
`release/.builder-cache` en excluant le dossier `darwin` de l'archive officielle.
Pour réutiliser ce cache lors des prochains builds sur cette machine :

```powershell
$env:ELECTRON_BUILDER_CACHE = Join-Path (Get-Location) 'release/.builder-cache'
npm run build:win
```

Ce cache est ignoré par Git et n'est pas distribué avec l'installateur.
Sur une autre machine, si la même erreur de liens symboliques apparaît,
il faudra également préparer les outils Windows ou utiliser un environnement
de compilation disposant du droit de créer ces liens.

L'assistant est en français, propose le dossier d'installation et crée des
raccourcis sur le bureau et dans le menu Démarrer. Aucune signature de code
n'est configurée dans le projet pour cette version de test.

L'icône Windows multirésolution se trouve dans `public/images/icon.ico`.

## Sauvegardes

Les concours sont enregistrés en JSON dans le sous-dossier `contests` du
répertoire Electron `userData`, normalement `%APPDATA%\Bouleo\contests`
pour l'application installée. Ils sont séparés des fichiers du programme.
Sauvegarder ce dossier avant les essais de mise à niveau ou de désinstallation.
Vérifier aussi le dossier utilisé en développement avant de transférer des concours.

## Recette avant diffusion

Sur une machine Windows x64 sans Node.js, vérifier :

- installation avec un compte standard, raccourcis et lancement hors ligne ;
- affichage du logo, des polices et des icônes ;
- création et reprise des concours dans les différents formats ;
- équipes exemptes, correction des scores et égalités au classement ;
- fermeture immédiatement après une saisie puis reprise du concours ;
- réinstallation et désinstallation/réinstallation avec conservation des concours.

Les changements de configuration sont appliqués à la validation des participants.
Les noms saisis sont conservés en mémoire lors d'un aller-retour entre participants
et configuration ; ce brouillon n'est pas une sauvegarde sur disque.
La régénération des parties ayant des scores demande une confirmation.
Le nombre de parties est limité à un entier de 1 à 100.

Les erreurs de sauvegarde sont affichées avec un bouton de nouvelle tentative.
La fermeture attend la sauvegarde ; en cas d'échec, Bouleo propose de rester
ou de quitter explicitement sans enregistrer. Une seule instance peut fonctionner.
Les fichiers illisibles ou incompatibles sont signalés et conservés.
La liste des concours utilise la date enregistrée dans chaque sauvegarde,
indépendamment de la date de copie ou de modification du fichier.

Avant diffusion publique : mettre à niveau Electron vers une branche maintenue,
puis définir la signature Windows et les conditions de distribution.
