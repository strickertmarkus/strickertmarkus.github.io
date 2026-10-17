# Ingemars träning – funktionell kontroll 16–17 oktober 2026

## Omfattning

Träningssidans översikt, passbyggare, planering, mallar, träningslogg, rekord, statistik, menyer och beständig lagring. Stretch, meditation och genomförande av träningsmode ingår inte i denna granskning.

## Samtliga funktionsfixar

1. Kopierade övningar och deras set får egna ID:n. Kopior kan därför inte kollapsa till samma post vid synkning.
2. Saknade eller dubbla övnings- och set-ID:n repareras i äldre planer, utkast, historik, passmallar och veckomallar utan att innehållet tas bort. Inläst data kopieras före normalisering.
3. Veckomallar ersätter hela veckan, inklusive vilodagar. Tidigare pass ligger inte kvar på mallens vilodagar.
4. Användning av veckomall tar bort gamla dagsutkast som annars kunde återställa fel pass.
5. Kopiering av en dag rensar destinationens gamla utkast.
6. Byte av plats på dagar uppdaterar även datumen i flyttade utkast.
7. Återanvända övningar hämtar värden från senaste riktiga träningshistoriken först, därefter planer och mallar, sist standardvärden. Genomfört/överhoppat återställs i den nya planen.
8. Egna övningar i sparade passmallar finns med bland valbara övningar.
9. Datumändring i passbyggaren flyttar det sparade utkastet till rätt datum och använder destinationsdagens plan som bas för synkning.
10. Tomma eller ogiltiga kalenderdatum kan inte tyst spara på föregående datum. Tomt datum visar ”Välj datum”, även efter omrendering.
11. Passbyggarens numeriska fält ändrar inte längre felaktig inmatning tyst till 0 eller 999. Tom obligatorisk vikt/tid skiljs från uttryckligt nollvärde. Validering kräver ändliga värden inom 0–999, hela repetitioner, positiva repetitioner för styrkeset och positiv tid för tidsset. Decimalvikter och decimaltider fungerar. Valfria tomma repetitioner blir 0.
12. Samma validering används när ett pass sparas som mall.
13. Träningsloggen skiljer också tom obligatorisk vikt/tid från uttryckligt nollvärde; tomt valfritt repetitionsmål behandlas som 0.
14. Vid sparande av en öppen loggredigering sammanfogas ursprungsversion, lokala ändringar och senaste synkade version. Ändringar i olika fält från två enheter bevaras.
15. Osparade loggändringar skyddas av bekräftelse vid stängning och varning när sidan lämnas. Avbruten stängning behåller redigeringen. Ett misslyckat sparförsök stänger inte redigeraren.
16. Radering av ett pass som redan raderats på en annan enhet ger besked i stället för ett JavaScript-fel.
17. Escape stänger först den öppna övningsmenyn och lämnar passbyggaren öppen. Klick utanför menyn stänger den; skrollning avslutar inte pågående namnredigering.
18. Vald passmall och veckomall bevaras vid omrendering, exempelvis när ett set läggs till.
19. Bakgrundsskroll låses även för veckoplaneraren och loggdetaljer. Låsningen finns kvar medan en annan träningsdialog är öppen och återställs vid återgång från passbyggaren. Synliga återställningsmeddelanden placeras i den aktiva veckodialogen.
20. En vanlig sparbekräftelse från synkningen återapplicerar inte identisk data och återställer därför inte gränssnittet i onödan.
21. En öppen veckoplanerare utan osparade ändringar uppdateras när verkliga ändringar kommer från en annan enhet.
22. Styrkestatistik utesluter demo-, tids-, överhoppade och ej genomförda set. Genomförda kroppsviktsset med 0 kg räknas. Övningsnamn matchas utan skillnad på stora/små bokstäver och dubbleras inte i statistikvalet. Historikens setantal utesluter överhoppade set. Veckans minuter summeras numeriskt även om äldre värden lagrats som text.
23. Återställda konfliktversioner bevarar även inställningarna mellan övningar och för starttimer.
24. Långa pass- och övningsnamn bryts inom historik, detaljdialog och förhandsvisning. Historikens mått får behålla sitt utrymme.
25. Veckomallsmenyns höjd, padding och radavstånd har rättats så att text inte klipps vertikalt på mobil.

26. Formgivningen för starttimer och aktivitet mellan övningar/set gäller nu även dator. Reglerna låg felaktigt inuti en mobilavgränsning och har flyttats till den gemensamma CSS-delen. En webbläsarkontroll verifierar reglagens layout även vid 1440 pixlar.

## Testning och underhåll

- 32 automatiserade enhetstester: 20 befintliga kontotester och 12 nya riktade regressionstester.
- Ny automatisk webbläsarkontroll i WebKit 390 × 844 och Chromium 412 × 844, med ytterligare kontroller vid 320 och 1440 pixlars bredd.
- Verkliga skärmbilder granskade för meny, passbyggare, veckoplanering, förhandsvisning, loggredigering, långa namn och datoröversikt.
- Flöden: veckomål och gränsvärden, egna övningsnamn, decimaler, kopiering, menyer, Escape, klick utanför, skrollning, dra/avbryta, utkast, omladdning, förhandsvisning, mallval, tillämpning/radering/ångra, veckoplanering, loggredigering, rekord och statistik.
- Inställningar för starttimer och aktiviteter mellan övningar/set sparas och kontrolleras utan att starta träningsmode.
- Simulerad skrivstörning/offline, omladdning och återanslutning samt samtidiga ändringar från annan enhet.
- Stor profil: 251 historiska pass, minst 250 planerade datum och 80 tillagda mallar bevaras efter omladdning och ytterligare sparande.
- Geometrikontroller för horisontell overflow, dialogplacering och mobilfältens textstorlek. Inga JavaScript-fel i de granskade webbläsarflödena.
- Cacheversionen för kontoskriptet har uppdaterats och testflödet körs automatiskt vid relevanta ändringar på main.

## Avgränsning

Webbläsartesterna använder isolerade testdata och simulerad Firebase-kommunikation; Ingemars riktiga träningsdata har inte ändrats av testerna. Detta verifierar återkommande användningsflöden och felåterhämtning, inte faktisk användning under flera månader, fysiska telefoner eller produktionsdatabasens aktuella behörigheter.
