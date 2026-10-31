#!/usr/bin/env bash
# Sauvegarde du portfolio (sur le VPS) : base de données + fichiers envoyés.
#
#   cd /chemin/vers/portfolio-backend && npm run backup
#
# Crée dans BACKUP_DIR (par défaut ../backups) :
#   portfolio-AAAA-MM-JJ_HHMM.dump          → la base (informations, compétences, projets, messages…)
#   portfolio-AAAA-MM-JJ_HHMM-fichiers.tgz  → le dossier uploads (photo, images des projets, CV)
# et supprime les sauvegardes de plus de BACKUP_KEEP_DAYS jours (par défaut 14).
#
# Tous les soirs à 3 h, automatiquement (crontab -e) :
#   0 3 * * * cd /chemin/vers/portfolio-backend && bash scripts/backup.sh >> ../backups/backup.log 2>&1
#
# Restaurer une sauvegarde :
#   pg_restore --clean --if-exists -d "$DATABASE_URL" portfolio-AAAA-MM-JJ_HHMM.dump
#   tar xzf portfolio-AAAA-MM-JJ_HHMM-fichiers.tgz -C <dossier parent de uploads>
set -euo pipefail

cd "$(dirname "$0")/.."

# Lit DATABASE_URL, UPLOADS_DIR, BACKUP_DIR… dans .env (sans écraser ce qui est déjà défini).
if [ -f .env ]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
    [ -n "${!key:-}" ] && continue
    value="${value%\"}"; value="${value#\"}"
    export "$key=$value"
  done < .env
fi

: "${DATABASE_URL:?DATABASE_URL manquant (fichier .env)}"
UPLOADS_DIR="${UPLOADS_DIR:-$PWD/uploads}"
BACKUP_DIR="${BACKUP_DIR:-$PWD/../backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

command -v pg_dump >/dev/null || { echo "✗ pg_dump introuvable (sudo apt install postgresql-client)"; exit 1; }

mkdir -p "$BACKUP_DIR"
stamp="$(date +%Y-%m-%d_%H%M)"
db_file="$BACKUP_DIR/portfolio-$stamp.dump"
files_file="$BACKUP_DIR/portfolio-$stamp-fichiers.tgz"

# Écrit d'abord dans un fichier temporaire : une sauvegarde ratée ne laisse pas de fichier vide.
pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" --file="$db_file.part"
mv "$db_file.part" "$db_file"
echo "✓ Base sauvegardée : $db_file ($(du -h "$db_file" | cut -f1))"

if [ -d "$UPLOADS_DIR" ]; then
  tar czf "$files_file.part" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
  mv "$files_file.part" "$files_file"
  echo "✓ Fichiers sauvegardés : $files_file ($(du -h "$files_file" | cut -f1))"
else
  echo "• Pas de dossier uploads ($UPLOADS_DIR), rien à sauvegarder"
fi

deleted=$(find "$BACKUP_DIR" -maxdepth 1 -name 'portfolio-*' -type f -mtime +"$KEEP_DAYS" -print -delete | wc -l)
echo "✓ Terminé ($(date '+%d/%m/%Y %H:%M')) — $deleted ancienne(s) sauvegarde(s) supprimée(s), on garde $KEEP_DAYS jours"
