# CAF Trainer

CAF Trainer est une application de formation en ligne destinee aux centres d'appels.
Elle s'appuie sur un **backend Express** et un **frontend React** ecrits en TypeScript.
Aucune base de donnees n'est necessaire : toutes les informations (utilisateurs,
modules, tickets, etc.) sont enregistrees dans des fichiers JSON.

Cette version du README se veut plus bavarde pour expliquer en detail
l'architecture du projet et son fonctionnement.

## 1. Mise en route

```bash
npm install        # installe les dependances de tous les workspaces
npm run setup-env  # configure les chemins des fichiers
npm start          # demarre le serveur et l'appli React
```

`setup-env.js` vous demande la lettre du lecteur et le dossier racine dans
lequel seront ecrites toutes les donnees (JSON, images, videos et archives).
Si vous indiquez la lettre `C`, le chemin est base sur votre variable
d'environnement `%USERPROFILE%` pour enregistrer les fichiers dans votre
repertoire utilisateur.

Le script `npm start` fait appel a `scripts/start.js`. Ce dernier propose de
lancer les deux processus (serveur et client) en mode "verbose" pour afficher les
logs ou bien en mode silencieux. Il attend que la compilation du frontend soit
terminee, puis ouvre automatiquement `http://localhost:3000` dans votre
navigateur. Le backend ecoute par defaut sur le port `5000` mais cette valeur peut
etre modifiee via le fichier `.env` situe a la racine du projet.

## 2. Organisation generale

Le depot est organise sous la forme d'un monorepo utilisant les workspaces NPM.
Les principaux dossiers sont :

```text
CAF_Trainer_JSON/
├─ backend/     # code du serveur Express
├─ client/      # application React
├─ scripts/     # utilitaires (demarrage, nettoyage RGPD…)
├─ certificats/ # certificats internes (ex: Zscaler)
└─ package.json
```

### 2.1 Backend

Le backend est ecrit en TypeScript et compile automatiquement lors du demarrage.
Il expose une API REST sous le prefixe `/api`. L'entree principale est
`backend/src/index.ts` qui configure Express, charge les routes et lit le fichier
`.env` pour connaitre le port et les identifiants SMTP utilises pour l'envoi de mails.

Les sous-dossiers importants sont :

```
backend/
├─ src/
│  ├─ config/  # utilitaires (dataStore, mail, etc.)
│  ├─ data/    # fichiers JSON persistants
│  ├─ models/  # interfaces TypeScript partagees
│  ├─ routes/  # definitions des endpoints API
│  └─ utils/   # fonctions annexes (notifier, analytics)
├─ image/      # images uploadees
└─ video/      # videos uploadees
```

Les routes implementent toutes les fonctionnalites de l'outil :

- `auth.ts` gere l'inscription et la connexion des utilisateurs (mots de passe haches avec `bcrypt`).
- `users.ts` permet de consulter ou modifier la liste des utilisateurs.
- `modules.ts` expose la creation et la mise a jour des modules de formation.
- `progress.ts` sauvegarde l'avancement des apprenants.
- `favorites.ts` stocke les favoris de chaque utilisateur.
- `notifications.ts` liste les notifications en attente.
- `tickets.ts` gere les tickets SAV ou les demandes aupres des managers.
- `checklist.ts` fournit l'URL de la checklist d'evaluation.
- `images.ts` et `videos.ts` publient les medias uploades.
- `analytics.ts` enregistre les temps de connexion et calcule des moyennes.
- `quiz.ts` stocke les resultats de quiz.
- `sites.ts` et `cafTypes.ts` classent les utilisateurs par site ou par type de caf.
- `alert.ts` diffuse un message a tous les utilisateurs connectes.

Chaque route s'appuie sur `config/dataStore.ts`, un petit utilitaire lisant et ecrivant simplement des tableaux JSON dans `backend/src/data`. Un dossier `archive` permet de deplacer d'anciens enregistrements pour respecter la legislation RGPD.

### 2.2 Scripts back

Dans le dossier `scripts/` on trouve plusieurs utilitaires executes avant le lancement du serveur :

- `rgpdCleanup.js` deplace ou supprime les donnees qui ne doivent plus apparaitre (utilisateurs supprimes depuis plus de six mois, anciens tickets, etc.).
- `fixSessions.js` ajoute des heures de deconnexion fictives pour les sessions qui se seraient terminees brutalement (fermeture du navigateur).
- `start.js` orchestre le demarrage simultane du backend et du frontend.

### 2.3 Frontend

L'application React est situee dans `client/` et a ete creee avec Create React App. Elle utilise React Router pour la navigation et `axios` pour les appels HTTP. La structure principale ressemble a ceci :

```
client/
├─ src/
│  ├─ api/        # fonctions d'appel a l'API REST
│  ├─ components/ # composants reutilisables (boutons, formulaires...)
│  ├─ context/    # contextes React (authentification, notifications...)
│  ├─ pages/      # pages et vues principales de l'app
│  ├─ data/       # exemples de modules utilises pour les demos
│  └─ extensions/ # elements annexes (editeur Quill, Tiptap...)
└─ public/
```

Le contexte `AuthContext` centralise les informations de l'utilisateur connecte. Lorsqu'un onglet se ferme, il appelle `/api/analytics/logout` afin d'enregistrer la fin de la session. Les differentes pages (liste des modules, progression, dashboard manager, etc.) font toutes appel aux fonctions situees dans `src/api` qui elles-memes contactent le serveur.

## 3. Dialogue entre front et back

Le client contacte l'API sous `http://localhost:5000/api/` (ou un autre port si configure). Quelques endpoints types :

- `POST /api/auth/login` : renvoie les informations de l'utilisateur si les identifiants sont corrects.
- `POST /api/auth/register` : cree un nouvel utilisateur (reserve aux managers).
- `GET /api/modules` : liste tous les modules disponibles.
- `PATCH /api/progress` : met a jour la progression d'un utilisateur dans un module.
- `GET /api/notifications` : recupere les notifications non lues.
- `POST /api/analytics/logout` : enregistre la deconnexion effective.

Le backend renvoie toujours des objets JSON simples. Il n'y a pas de couche ORM ni de base SQL : toutes les donnees sont directement lues depuis les fichiers presents dans `backend/src/data` et sauvegardees immediatement apres toute mise a jour. Cela rend le code tres facile a deployer sur une simple machine sans base de donnees.

## 3.1 Politique de mot de passe

Les nouveaux comptes et tout changement de mot de passe doivent respecter les criteres suivants :

1. **Longueur** : entre 10 et 16 caracteres.
2. **Complexite** : au moins **trois types** parmi majuscules, minuscules, chiffres et symboles.
3. **Pas d'informations personnelles** ni mots du dictionnaire connus.
4. **Pas de repetitions ni suites evidentes** (`aaaa`, `abcd`, `1234`, `password`, etc.).

### Astuce memotechnique

Transformez une phrase facile a retenir en mot de passe :

> *"J’ai acheté 3 livres pour 27€, c’est fou !"*

donne par exemple `JaA3Lp27€,cf!` – court et robuste.

**Important :** seuls un manager ou un admin peuvent changer le mot de passe
d'un CAF. L'admin peut également modifier ceux des autres rôles directement
depuis son espace.

## 4. Variables d'environnement

Le fichier `.env` rassemble plusieurs reglages importants :

```
MAIL_USER=services@conforea.fr
MAIL_PASS=Test2025!
PORT=5000
JWT_SECRET=MaCleSuperSecrete
DATA_DIR=./backend/src/data
IMAGE_DIR=./backend/image
VIDEO_DIR=./backend/video
ARCHIVE_DIR=./backend/archive
```

`MAIL_USER` et `MAIL_PASS` servent a l'envoi de mails automatiques (notifications et alertes). `PORT` indique sur quel port demarre Express. `JWT_SECRET` est prevu pour de futures evolutions utilisant JSON Web Tokens. `DATA_DIR`, `IMAGE_DIR`, `VIDEO_DIR` et `ARCHIVE_DIR` definissent les emplacements des donnees, images, videos et archives. Le script `setup-env.js` permet de les reconfigurer et place les fichiers dans `%USERPROFILE%` si vous choisissez la lettre `C`.

## 5. Conseils de developpement

1. **Ne modifiez pas directement les fichiers de `backend/src/data`** tant que le serveur tourne, au risque d'ecraser les modifications en cours.
2. **Gardez un oeil sur les scripts de nettoyage** : `rgpdCleanup.js` peut deplacer des donnees dans `backend/archive`. Cela permet de conserver un historique sans encombrer les fichiers principaux.
3. **Utilisez les outils integres** : le projet fournit des commandes npm dans le `package.json` racine pour lancer le backend seul (`npm run start:backend`) ou juste le client (`npm run start:client`).

## 6. Conclusion

Cette architecture tres simple s'appuie uniquement sur Node.js, Express et React. Toute la persistance passe par de simples fichiers JSON, ce qui facilite enormement le deploiement et la sauvegarde. CAF Trainer reste cependant extensible : rien n'empeche d'ajouter une base de donnees ou un systeme d'authentification plus avance si le besoin s'en fait sentir.
