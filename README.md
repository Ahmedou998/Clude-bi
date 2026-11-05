# Teranga GP

Marketplace collaborative de transport de colis entre particuliers (« GP »), Afrique ↔ Europe, dans les deux sens.
Paiement bloqué jusqu'à la livraison, codes à usage unique pour la remise et la livraison, avis, messagerie.

> **État :** pilote fonctionnel. Tout le parcours marche de bout en bout (connexion par code, publication, matching, réservation, séquestre, remise, livraison, avis).
> Le **paiement est simulé** et la connexion affiche le code à l'écran (mode démonstration) : aucun argent ne circule et aucun SMS n'est envoyé tant que ces deux points ne sont pas branchés (voir « Passer en réel »).

## Ce qui est inclus

- **Accueil animé** : carte Afrique–Europe en points, arcs de liaison, colis qui voyage (liaison cliquable qui préremplit la recherche), compteurs, section « argent bloqué » pilotée par le défilement, FAQ par profil, estimateur de prix multi-devises. Respecte `prefers-reduced-motion`.
- **Trajets** : publication, recherche (ville/pays libres, accents ignorés), tri, capacité restante en direct.
- **Colis** : déclaration (contenu, catégorie, destinataire, objets interdits) et **matching** avec score de compatibilité (itinéraire, capacité, date, budget).
- **Réservation** : demande → acceptation → paiement bloqué → remise (code 1) → livraison (code 2, fonds libérés). Annulation (remboursement), signalement de problème, messagerie, avis, historique horodaté.
- **Confiance** : téléphone vérifié par code, réputation (note, livraisons), codes visibles uniquement de l'expéditeur, 5 essais maximum, destinataire visible du voyageur seulement après paiement.
- **Multi-devises** : XOF, EUR, USD, GBP, CAD, MAD, TND, GHS ; affichage converti (taux indicatifs).
- **Espace personnel** avec « À faire maintenant », PWA (manifeste), en-têtes de sécurité, limitation de débit, sessions signées httpOnly.

## Démarrage local

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:push        # crée les tables
npm run db:seed        # données de démonstration (comptes marqués « Démo »)
npm run dev
```

Ouvrir http://localhost:3000. Pour se connecter : saisir n'importe quel numéro ou e-mail ; en mode démo, le code s'affiche à l'écran.

## Scripts

`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:push`, `db:seed` (`-- --reset` pour recréer), `db:studio`, `map` (régénère la carte).

## Déploiement Render

1. Pousser le dépôt sur GitHub avec `render.yaml` à la racine.
2. Dans Render, choisir **New > Blueprint**, connecter ce dépôt et valider le blueprint. Il crée le service web et PostgreSQL dans la région de Francfort ; `SESSION_SECRET` est généré automatiquement.
3. Le déploiement est en mode pilote : le code OTP est affiché à l'écran et les paiements sont simulés. Ne pas l'utiliser pour traiter de vrais paiements ou des comptes publics.
4. Avant un lancement public, configurer `OTP_WEBHOOK_URL` et `OTP_WEBHOOK_TOKEN`, puis passer `ALLOW_DEMO_OTP` à `false` ; intégrer et valider un prestataire de paiement séparément.

## Passer en réel (obligatoire avant d'accepter du public)

1. **Codes de connexion** : définir `OTP_WEBHOOK_URL` (relais vers votre fournisseur SMS/e-mail/WhatsApp, reçoit `{channel, to, message}`) puis `ALLOW_DEMO_OTP=false`.
2. **Paiement** : implémenter `PaymentProvider` (`src/lib/payments.ts`) avec un prestataire agréé (Wave, Orange Money, carte…), webhooks signés, idempotence ; puis `PAYMENT_PROVIDER=<nom>`.
3. **Secrets** : `SESSION_SECRET` (32+ caractères, généré automatiquement par `render.yaml`).
4. **Migrations** : le déploiement utilise `prisma db push` (pilote). Pour la production, passer à `prisma migrate dev` puis `migrate deploy`.
5. **Juridique** : CGU, confidentialité, douane/marchandises par pays, assurance, conformité paiement. Rien de cela n'est rédigé ici.
6. Limitation de débit en mémoire : remplacer par Redis si plusieurs instances. Taux de change : brancher un fournisseur.

## Architecture

- `src/lib/booking-flow.ts` : machine à états (pure, testée). `src/lib/bookings.ts` : transitions transactionnelles, verrous de ligne, séquestre.
- `src/lib/matching.ts` : prix, commission (8 %, `SERVICE_FEE_RATE`), score de compatibilité.
- `src/lib/otp.ts`, `session.ts`, `rate-limit.ts` : sécurité. `src/lib/queries.ts` : lectures sérialisées.
- `src/app/api/*` : auth, trajets, colis, réservations (+ actions et messages).
- `prisma/schema.prisma` : modèle (réservations, événements, paiements, avis, OTP). `prisma/seed.ts` : démo.
- `docs/` : architecture, feuille de route, registre d'objections.

## Qualité

`npm test` couvre la machine à états, le matching, les OTP, les sessions, les devises et les schémas Zod. Aucun test d'intégration PostgreSQL ni E2E : à ajouter avant le pilote ouvert.
