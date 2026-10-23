# RC.4 na npm `latest`: upute za DevOps

## Status i opseg

Ovo su upute za odobrenu jednokratnu promjenu npm dist-taga na **već objavljenim** verzijama `0.1.0-rc.4`; ne tvrde da je promjena izvršena. Prema korisnikovoj potvrdi, DevOps je već objavio svih pet paketa. Tag `v0.1.0-rc.4` i izvorni commit `4ff4954be95bab5db9004f9a09c744f780f38929` ostaju nepromijenjeni. Ne pokretati novi build, `npm publish`, Git tag/push ni provenance/OIDC provjeru; OIDC uspjeh nije potvrđen.

`0.1.0-rc.4` ostaje prerelease i koristi Solid `2.0.0-rc.15`. npm dist-tag `latest` određuje što dobiva **nepinned** instalacija; ne mijenja semver status i ne znači stable/GA izdanje. Za ovaj prerelease odobreno je jednokratno postaviti `latest` na rc.4. Budući prerelease publish workflow i `publishConfig` ostaju na `next` ([workflow](../.github/workflows/publish.yml)); paketi se ne objavljuju ponovno.

## Prije promjene

1. Radi ovlašteni DevOps operater u privatnoj shell sesiji. Prije **svih** npm naredbi (prijava, preflight, promjena tagova, provjera i povrat) pokreni `cd /tmp` ili drugi poznati direktorij izvan svakog Git repozitorija te ostani ondje; tako se projektni `.npmrc` neće učitati. Koristi postojeću odobrenu npm autentikaciju ako je dostupna; ako nije, izvršavaj cijeli postupak u istoj shell sesiji s privremenim npm userconfigom izvan repozitorija. Nikad ne ispisivati/catati userconfig, pokretati `npm config list`, uključivati `set -x` ili zapisivati tokene/2FA podatke u log.

   Ako nema postojeće odobrene npm autentikacije i za ovaj postupak treba privremena prijava, koristi ovaj blok; u suprotnom ga preskoči i postojeću konfiguraciju ostavi netaknutom:

   ```bash
   umask 077
   NPM_CONFIG_USERCONFIG="$(mktemp /tmp/radix2solid-npmrc.XXXXXX)" || exit 1
   if [ -z "$NPM_CONFIG_USERCONFIG" ] || [ ! -f "$NPM_CONFIG_USERCONFIG" ]; then
     printf 'Temporary npm userconfig creation failed.\n' >&2
     exit 1
   fi
   export NPM_CONFIG_USERCONFIG
   TEMP_NPM_LOGIN=0
   cleanup_temp_npm_auth() {
     if [ "$TEMP_NPM_LOGIN" = 1 ]; then
       npm logout --registry=https://registry.npmjs.org/ || printf 'Temporary npm logout failed; escalate before closing.\n' >&2
     fi
     rm -f "$NPM_CONFIG_USERCONFIG"
   }
   trap cleanup_temp_npm_auth EXIT
   npm login --registry=https://registry.npmjs.org/ || exit 1
   TEMP_NPM_LOGIN=1
   ```

2. Neposredno prije izmjene zabilježiti **trenutačne** `latest` i `next` tagove za svih pet paketa u privatne operativne bilješke. Upotrijebiti eksplicitan javni registry:

   ```bash
   npm dist-tag ls @wsagency/radix2solid-primitives --registry=https://registry.npmjs.org/
   npm dist-tag ls @wsagency/radix2solid-icons --registry=https://registry.npmjs.org/
   npm dist-tag ls @wsagency/radix2solid-icons-extra --registry=https://registry.npmjs.org/
   npm dist-tag ls @wsagency/radix2solid-themes --registry=https://registry.npmjs.org/
   npm dist-tag ls @wsagency/radix2solid-charts --registry=https://registry.npmjs.org/
   ```

3. Posljednje stanje koje je korisnik prijavio **povijesno je, nije trenutačna provjera**: `next=0.1.0-rc.4` za svih pet; `latest` je bio `rc.1` za Primitives, Icons i Themes, `rc.3` za Icons Extra te `rc.2` za Charts. Ako je bilo koji trenutačni `next` drukčiji od rc.4, nedostaje ili pokazuje noviju verziju, **stani bez izmjena** i potvrdi stanje s vlasnikom. Za `latest`, ako je već rc.4, zabilježi i preskoči taj paket; inače, ako odstupa od povijesne vrijednosti, nedostaje ili je neočekivan, stani i potvrdi stanje prije bilo kakve izmjene.

## Jednokratna promjena

Svaki poziv mijenja jedan paket; operacija nije atomska. Pokrenuti ih pojedinačno i stati na prvoj grešci:

```bash
npm dist-tag add @wsagency/radix2solid-primitives@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
npm dist-tag add @wsagency/radix2solid-icons@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
npm dist-tag add @wsagency/radix2solid-icons-extra@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
npm dist-tag add @wsagency/radix2solid-themes@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
npm dist-tag add @wsagency/radix2solid-charts@0.1.0-rc.4 latest --registry=https://registry.npmjs.org/
```

## Provjera i povrat

Nakon svih poziva ponovno izvršiti pet naredbi `npm dist-tag ls` iznad. Za svaki paket potvrditi `latest=0.1.0-rc.4` i `next` jednak zabilježenoj vrijednosti prije promjene (očekivano rc.4). Zabilježiti samo tagove i ishod, ne vjerodajnice.

Ako naredba zakaže ili se stanje djelomično promijeni, **stani** i usporedi rezultate svih pet paketa s prije-snimkom. Vraćaj samo paket za koji je potvrđeno da ga je ova operacija promijenila s postojeće početne `latest` vrijednosti na rc.4. Ako je `latest` već bio rc.4 ili je trenutačna vrijednost već zabilježena početna verzija, preskoči paket. Neposredno prije svakog povrata ponovno provjeri tag i nastavi samo ako je trenutačni `latest` još `0.1.0-rc.4`; ako nedostaje, ima drugu vrijednost ili promjena nije dokazivo nastala ovom operacijom, ne mijenjaj ga i eskaliraj vlasniku. Početni `latest` koji nedostaje mora prekinuti preflight, pa nema `rm` povrata. Za dopušten povrat upotrijebi zabilježenu postojeću početnu verziju: `npm dist-tag add <ime-paketa>@<zabilježena-verzija> latest --registry=https://registry.npmjs.org/`. Nakon ručnog povrata provjeri svih pet paketa.
Za privremenu prijavu kreiranu ovim blokom, prije zatvaranja sesije pokreni `npm logout --registry=https://registry.npmjs.org/`, postavi `TEMP_NPM_LOGIN=0`, ukloni samo taj userconfig naredbom `rm -f "$NPM_CONFIG_USERCONFIG"` i isključi EXIT trap naredbom `trap - EXIT`. Ako sesija završi prije ručnog čišćenja, trap se odjavljuje samo kada `TEMP_NPM_LOGIN=1` i uklanja samo taj privremeni userconfig. Ako je korištena postojeća autentikacija ili userconfig, nemoj pokretati privremeni blok, odjavljivati se niti brisati tu konfiguraciju.

Ovo je isključivo dist-tag promjena postojećih prerelease verzija; ne mijenja pakete, verzije, `next`, workflow, Git tag ni OIDC provenance. Za točne consumer instalacije i API kontekst pogledaj [root README](../README.md) i README-e pet paketa.
