# Contribuir a Fibers

Gràcies per voler ajudar a millorar Fibers. Per a canvis grans, obre primer una issue per parlar de la proposta. Les correccions petites i els ajustos de documentació es poden enviar directament com a pull request.

## Parlar amb la comunitat

També tenim un [canal de Discord](https://discord.gg/pqsbcBb) per parlar, fer preguntes i comentar idees amb la comunitat.

## Preparar l’entorn

1. Fes un fork del repositori i crea una branca per al canvi.
2. Instal·la les dependències amb `npm install`.
3. Si encara no tens `.env`, copia `.env.example` a `.env` i configura les variables necessàries. No afegeixis mai credencials ni fitxers `.env` als commits.
4. Inicia l’aplicació amb `npm run dev`.

## Abans d’enviar una pull request

Executa les comprovacions corresponents als canvis:

```sh
npm run check
npm run lint
npm test
```

Les proves d’integració requereixen configurar Supabase a `.env`. `npm run test:rls` també necessita `SUPABASE_PROJECT_ID` i el CLI de Supabase autenticat.

Descriu què canvia la pull request, per què és necessari i com ho has comprovat. Per a canvis visuals, inclou captures de pantalla quan sigui possible.

## Llicència de les contribucions

El projecte es distribueix segons la [PolyForm Shield License 1.0.0](LICENSE). És *source-available*, no una llicència de codi obert aprovada per l’OSI, i no permet oferir productes o serveis que competeixin amb Fibers. Llegeix-ne el text complet abans de contribuir.

En enviar codi o altres materials a aquest repositori, confirmes que tens dret a fer-ho i que la teva contribució es distribueix sota els mateixos termes de la PolyForm Shield License 1.0.0. Conserves els drets d’autor de la teva contribució.
