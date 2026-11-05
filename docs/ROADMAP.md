# Roadmap produit

## Fait (pilote fonctionnel)
- Connexion par code (OTP) et sessions signées ; autorisations vérifiées côté serveur.
- Publication trajets/colis, matching, réservation, séquestre simulé, codes de remise/livraison, litiges signalés, avis, messagerie.
- Multi-devises, estimateur, PWA de base, carte animée.

## P0 : avant pilote privé réel
- Fournisseur SMS/WhatsApp (`OTP_WEBHOOK_URL`) et désactivation du mode démo.
- Prestataire de paiement agréé (webhooks signés, idempotence) à la place de la simulation.
- Interface support/opérations pour traiter les litiges et libérer/rembourser les fonds.
- CGU, confidentialité, règles douanières par pays. Tests d'intégration PostgreSQL et E2E.

## P1 : pilote contrôlé
- Notifications (SMS/e-mail/WhatsApp) sur chaque changement d'état.
- Photos de remise stockées en privé. Signalement/blocage d'utilisateurs.
- Taux de change réels. Rate limiting distribué.

## P2 : mise à l'échelle
- Vérification d'identité par partenaire. Assurance/garantie partenaire.
- Suivi cartographique avec consentement. Wolof/anglais. Application mobile.
