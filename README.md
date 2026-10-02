# Fibers

Web per compartir materials d'estudi entre estudiants de la FIB, reconstruïda amb Astro i Material UI.

## Desenvolupament

```sh
npm install
npm run dev
```

## Producció

```sh
npm run build
npm run preview
```

Les pàgines i la llista inicial d'assignatures són estàtiques. El catàleg parteix de l'inventari històric de la web antiga, agrupat com abans; la disponibilitat dels materials es mostra com a pendent de revisió. El formulari de contacte desa els enviaments amb Netlify Forms. Cal activar **Form detection** a la configuració del lloc de Netlify i tornar-lo a desplegar. El formulari d'aportacions obre el programa de correu; els fitxers s'han d'adjuntar manualment.

El domini canònic de producció es defineix a `astro.config.mjs`. En compilar, Astro genera el sitemap (`sitemap-index.xml`) i `robots.txt` hi publica la seva adreça. Les pàgines tenen metadades Open Graph i dades estructurades JSON-LD.

Els 54 fitxers recuperats es conserven a `public/files/`. `src/data/materials.json` en manté el catàleg i `src/data/materials.ts` associa cada recurs amb una assignatura o amb la pàgina de recursos generals. Els títols vinculats provenen de la pàgina HTML antiga.
