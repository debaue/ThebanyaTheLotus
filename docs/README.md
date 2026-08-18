# Website «Лисья поляна»

Statische Website für die Basis „Лисья поляна" (Instagram: [@thebanya_thelotos_](https://www.instagram.com/thebanya_thelotos_/)) — Gästehaus, Sauna, Chan, Pavillons, Angeln und die Lotusplantage in Adygeja / Region Krasnodar.

Reines HTML/CSS/JS, kein Build-Schritt nötig.

```
docs/
  index.html      Seite (eine Seite mit Sections: Hero, Über uns, Leistungen, Galerie, Preise, Kontakt)
  css/style.css
  js/script.js
  images/         Fotos der Lotusplantage
  videos/         Kurze Videoclips für die Galerie
```

## GitHub Pages aktivieren

1. Im Repo: **Settings → Pages**
2. Unter „Build and deployment" → **Source: Deploy from a branch**
3. Branch: `main` (nach dem Merge dieses PRs), Ordner: **/docs**
4. Speichern — die Seite ist danach unter `https://<user>.github.io/<repo>/` erreichbar.

## Eigene Domain verbinden

Sobald ihr eine Domain gekauft habt (z. B. bei Namecheap, Cloudflare, Hetzner, …):

1. Datei `docs/CNAME` mit genau einer Zeile anlegen, z. B.:
   ```
   lisyapolyana.ru
   ```
2. Beim Domain-Registrar die DNS-Einträge setzen:
   - **Für eine Root-Domain** (z. B. `lisyapolyana.ru`): vier `A`-Records auf die GitHub-Pages-IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - **Für `www`**: ein `CNAME`-Record auf `<user>.github.io`.
3. In **Settings → Pages** die Domain eintragen und „Enforce HTTPS" aktivieren (kann etwas dauern, bis das Zertifikat ausgestellt ist).

Danach führt ein Klick auf die Domain direkt auf die GitHub-Pages-Seite.
