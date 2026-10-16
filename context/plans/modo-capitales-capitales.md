# Anexo del plan "Capitales": las 197 capitales propuestas

> Documento local (gitignored, `context/plans/`). Lo genera un script a partir de
> `modo-capitales-capitales.json` (mismo directorio), que es el que la Fase 3 del
> plan convierte en `src/data/capitals.ts`. **Nada de esto es definitivo hasta que
> el dueño lo apruebe** (fila en `CONTENT_CHECKLIST.md`, §5.3 del plan).
>
> Sesión del 2026-09-22, worktree `.claude/worktrees/cranky-cohen-e9f64d`.

## Fuentes (consultadas el 2026-09-22)

| Sigla | Fuente | Para qué | Cómo se obtuvo |
|---|---|---|---|
| **UE** | Oficina de Publicaciones de la UE, *Libro de estilo interinstitucional*, **Anexo A5 «Lista de Estados, territorios y monedas»**, versión en español, **última actualización 16-09-2026**. Declara haberse elaborado «en consulta con la Real Academia Española, el Ministerio de Asuntos Exteriores y de Cooperación de España y otras instituciones interesadas en la toponimia extranjera en español» | **Grafía española** y ciudad principal | PDF completo `https://style-guide.europa.eu/o/opportal-service/isg?resource=pdf-web/ISG_es_4web.pdf` (13,6 MB), págs. 237-254, `pdftotext -table` y parseo por fila (código ISO → celda de capital). Las notas al pie (p. ej. 9, 11, 14, 22, 64, 73, 88, 103, 104, 106, 110) se leyeron a mano |
| **UE-nota** | Las notas al pie de esa misma tabla | Capitales múltiples y sedes de gobierno | Ídem |
| **WD** | Wikidata, propiedad **P36 «capital»** de cada país (por su código ISO 3166-1, P297), con rango, fechas (P580/P582) y rol (P3831), etiquetas y alias en español | Qué ciudad es hoy la capital, capitales múltiples, **cambios recientes** y variantes en español | SPARQL en `query.wikidata.org` (consulta al final). Se descartaron las declaraciones con fecha de fin y las de entidades históricas que comparten código |
| **WP** | Wikipedia en inglés, «List of national capitals» (wikitext por la API) | Tercera referencia en los casos dudosos y en lo que la UE no lista (Kosovo, Palestina) | `en.wikipedia.org/w/api.php?action=parse&page=List_of_national_capitals&prop=wikitext` |

No se pudieron usar:

- **RAE**, «Lista de países y capitales con sus gentilicios»: 403 con verificación de
  Cloudflare, igual que en la auditoría del catálogo. **No se forzó.** La tabla de la
  UE dice estar consultada con la RAE.
- **CIA World Factbook**: ya no existe (la URL redirige a su despedida).

## Resultado de cruzar las fuentes

- **176 de 197**: la forma de la UE coincide letra por letra con la etiqueta española
  de Wikidata (o con una de sus capitales, cuando hay varias).
- Las **21 restantes** son de grafía (Camberra/Canberra, Nueva Deli/Nueva Delhi,
  Hanoi/Hanói, Babane/Mbabane, Nassau/Nasáu, Uagadugu/Uagadugú, Abu Dabi/Abu Dhabi,
  Port Moresby/Puerto Moresby, Tarawa/Tarawa Sur, Melekeok/Ngerulmud, Santiago/Santiago
  de Chile, Panamá/Ciudad de Panamá, Kuwait/Ciudad de Kuwait, Yibuti/Ciudad de Yibuti,
  Saint John’s, Saint George’s…) o casos donde una fuente no da capital (Israel,
  Palestina, Kosovo, Santa Sede). **Ninguna discrepancia es de ciudad** salvo las
  capitales múltiples y disputadas de la sección 5.3 del plan.
- **Cambios que no se habrían acertado de memoria:** Guinea Ecuatorial →
  **Ciudad de la Paz desde el 03-01-2026** (las tres fuentes; Malabo hasta entonces),
  Burundi → **Guitega/Gitega** desde 2019, Palaos → Ngerulmud desde 2006, Myanmar →
  Naipyidó desde 2005, Kazajistán → Astaná (Nur-Sultán entre 2019 y 2022).
- **Indonesia**: Nusantara está designada por ley, pero según WP el traslado no es
  oficial todavía; UE y WD dicen Yakarta. Hay que revisarlo antes de cada publicación
  que toque este archivo.

## Reglas con las que se armó la tabla (las aprueba el dueño, D063-D065)

1. **Se muestra** la forma de la UE. Donde la UE no da capital (Israel, Kosovo,
   Palestina, Santa Sede) se muestra la de Wikidata.
2. **También vale** (política A, recomendada): las otras capitales del mismo país que
   registra la UE (en sus notas) o Wikidata (P36 vigente) · las variantes en español de
   la UE o de Wikidata (etiqueta o alias `es`) · la forma corta o larga del mismo nombre
   («Washington», «Ciudad de Panamá», «Habana») · el topónimo local cuando Wikidata lo
   registra como alias español (Phnom Penh, Accra, Bissau…).
3. **No valen**: apodos (La Ciudad Eterna, Chepe), nombres o capitales anteriores
   (Nur-Sultán, Rangún, Malabo, Buyumbura, Dar es-Salaam), abreviaturas (DF, CABA,
   CPH), capitales económicas y sedes que ninguna fuente llama capital (La Haya,
   Valparaíso, Abiyán).
4. Variantes que solo se diferencian por la tilde **no se añaden** (las cubre la
   dificultad fácil), salvo tres grafías documentadas como distintas: Hanói, Uagadugú,
   Taipei.
5. Espacios, guiones, puntos, comas y apóstrofos no cuentan al comparar (D065): no
   hacen falta alias para «Washington DC», «Porto-Novo» o «Saint John's» con `'`.

«(UE = WD)» en la tabla significa que las dos fuentes escriben lo mismo.

## Tabla

### Norteamérica

| Código | País | Se muestra (fuente) | También vale | Nota al revelar | Decide el dueño |
|---|---|---|---|---|---|
| `ca` | Canadá | **Ottawa** (UE = WD) |  |  |  |
| `us` | Estados Unidos | **Washington D. C.** (UE = WD) | Washington *(WD)* |  |  |
| `mx` | México | **Ciudad de México** (UE = WD) | México *(WD)* |  |  |

### Centroamérica

| Código | País | Se muestra (fuente) | También vale | Nota al revelar | Decide el dueño |
|---|---|---|---|---|---|
| `bz` | Belice | **Belmopán** (UE = WD) |  |  |  |
| `cr` | Costa Rica | **San José** (UE = WD) |  |  |  |
| `sv` | El Salvador | **San Salvador** (UE = WD) |  |  |  |
| `gt` | Guatemala | **Ciudad de Guatemala** (UE = WD) | Guatemala *(WD)* |  |  |
| `hn` | Honduras | **Tegucigalpa** (UE = WD) |  |  |  |
| `ni` | Nicaragua | **Managua** (UE = WD) |  |  |  |
| `pa` | Panamá | **Panamá** (UE) | Ciudad de Panamá *(WD)* |  |  |

### Caribe

| Código | País | Se muestra (fuente) | También vale | Nota al revelar | Decide el dueño |
|---|---|---|---|---|---|
| `ag` | Antigua y Barbuda | **Saint John’s** (UE) | St. John's *(WP)* |  |  |
| `bs` | Bahamas | **Nassau** (UE) | Nasáu *(WD)* |  |  |
| `bb` | Barbados | **Bridgetown** (UE = WD) |  |  |  |
| `cu` | Cuba | **La Habana** (UE = WD) | Habana *(WD)* |  |  |
| `dm` | Dominica | **Roseau** (UE = WD) |  |  |  |
| `gd` | Granada | **Saint George’s** (UE) | St. George's *(WD)* |  |  |
| `ht` | Haití | **Puerto Príncipe** (UE = WD) | Port-au-Prince *(WD)* |  |  |
| `jm` | Jamaica | **Kingston** (UE = WD) |  |  |  |
| `do` | República Dominicana | **Santo Domingo** (UE = WD) |  |  |  |
| `kn` | San Cristóbal y Nieves | **Basseterre** (UE = WD) |  |  |  |
| `vc` | San Vicente y las Granadinas | **Kingstown** (UE = WD) |  |  |  |
| `lc` | Santa Lucía | **Castries** (UE = WD) |  |  |  |
| `tt` | Trinidad y Tobago | **Puerto España** (UE = WD) | Port of Spain *(WD)* |  |  |

### Sudamérica

| Código | País | Se muestra (fuente) | También vale | Nota al revelar | Decide el dueño |
|---|---|---|---|---|---|
| `ar` | Argentina | **Buenos Aires** (UE = WD) |  |  |  |
| `bo` | Bolivia | **Sucre** (UE = WD) | La Paz *(UE-nota)* | Sucre es la capital constitucional; La Paz, la sede del Gobierno. | ⚠️ capital doble |
| `br` | Brasil | **Brasilia** (UE = WD) |  |  |  |
| `cl` | Chile | **Santiago** (UE) | Santiago de Chile *(WD)* | El Congreso está en Valparaíso. | ⚠️ Valparaíso NO vale (sede del Congreso, ninguna fuente la llama capital) |
| `co` | Colombia | **Bogotá** (UE = WD) |  |  |  |
| `ec` | Ecuador | **Quito** (UE = WD) |  |  |  |
| `gy` | Guyana | **Georgetown** (UE = WD) |  |  |  |
| `py` | Paraguay | **Asunción** (UE = WD) |  |  |  |
| `pe` | Perú | **Lima** (UE = WD) |  |  |  |
| `sr` | Surinam | **Paramaribo** (UE = WD) |  |  |  |
| `uy` | Uruguay | **Montevideo** (UE = WD) |  |  |  |
| `ve` | Venezuela | **Caracas** (UE = WD) |  |  |  |

### Europa

| Código | País | Se muestra (fuente) | También vale | Nota al revelar | Decide el dueño |
|---|---|---|---|---|---|
| `al` | Albania | **Tirana** (UE = WD) |  |  |  |
| `de` | Alemania | **Berlín** (UE = WD) |  |  |  |
| `ad` | Andorra | **Andorra la Vieja** (UE = WD) | Andorra la Vella *(WD)* |  |  |
| `at` | Austria | **Viena** (UE = WD) |  |  |  |
| `be` | Bélgica | **Bruselas** (UE = WD) |  |  |  |
| `by` | Bielorrusia | **Minsk** (UE = WD) |  |  |  |
| `ba` | Bosnia y Herzegovina | **Sarajevo** (UE = WD) |  |  |  |
| `bg` | Bulgaria | **Sofía** (UE = WD) |  |  |  |
| `va` | Ciudad del Vaticano | **Ciudad del Vaticano** (WD) | Vaticano *(WD)* | La Santa Sede no tiene capital; la Ciudad del Vaticano es la del Estado. |  |
| `hr` | Croacia | **Zagreb** (UE = WD) |  |  |  |
| `dk` | Dinamarca | **Copenhague** (UE = WD) |  |  |  |
| `sk` | Eslovaquia | **Bratislava** (UE = WD) |  |  |  |
| `si` | Eslovenia | **Liubliana** (UE = WD) |  |  |  |
| `es` | España | **Madrid** (UE = WD) |  |  |  |
| `ee` | Estonia | **Tallin** (UE = WD) |  |  |  |
| `fi` | Finlandia | **Helsinki** (UE = WD) |  |  |  |
| `fr` | Francia | **París** (UE = WD) |  |  |  |
| `gr` | Grecia | **Atenas** (UE = WD) |  |  |  |
| `hu` | Hungría | **Budapest** (UE = WD) |  |  |  |
| `ie` | Irlanda | **Dublín** (UE = WD) |  |  |  |
| `is` | Islandia | **Reikiavik** (UE = WD) |  |  |  |
| `it` | Italia | **Roma** (UE = WD) |  |  |  |
| `xk` | Kosovo | **Pristina** (WD) | Prishtina *(WD)* |  | ⚠️ Kosovo no figura en la lista de la UE; principal de Wikidata y Wikipedia |
| `lv` | Letonia | **Riga** (UE = WD) |  |  |  |
| `li` | Liechtenstein | **Vaduz** (UE = WD) |  |  |  |
| `lt` | Lituania | **Vilna** (UE = WD) |  |  |  |
| `lu` | Luxemburgo | **Luxemburgo** (UE = WD) | Ciudad de Luxemburgo *(WD)* |  |  |
| `mk` | Macedonia del Norte | **Skopie** (UE = WD) | Escopia *(WD)* |  |  |
| `mt` | Malta | **La Valeta** (UE = WD) | Valeta *(WD)* |  |  |
| `md` | Moldavia | **Chisináu** (UE = WD) |  |  |  |
| `mc` | Mónaco | **Mónaco** (UE = WD) |  |  |  |
| `me` | Montenegro | **Podgorica** (UE = WD) |  | Cetiña es la antigua capital real. | ⚠️ Cetiña NO vale (antigua capital real, sede de la Presidencia) |
| `no` | Noruega | **Oslo** (UE) |  |  |  |
| `nl` | Países Bajos | **Ámsterdam** (UE = WD) |  | La Haya es la sede del Gobierno, pero la capital es Ámsterdam. | ⚠️ La Haya NO vale (sede del Gobierno; ni la UE ni Wikidata la llaman capital) |
| `pl` | Polonia | **Varsovia** (UE = WD) |  |  |  |
| `pt` | Portugal | **Lisboa** (UE = WD) |  |  |  |
| `gb` | Reino Unido | **Londres** (UE = WD) |  |  |  |
| `cz` | República Checa | **Praga** (UE = WD) |  |  |  |
| `ro` | Rumanía | **Bucarest** (UE = WD) |  |  |  |
| `ru` | Rusia | **Moscú** (UE = WD) |  |  |  |
| `sm` | San Marino | **San Marino** (UE = WD) | Ciudad de San Marino *(WD)* |  |  |
| `rs` | Serbia | **Belgrado** (UE = WD) |  |  |  |
| `se` | Suecia | **Estocolmo** (UE = WD) |  |  |  |
| `ch` | Suiza | **Berna** (UE = WD) |  | Suiza no nombra capital oficial: Berna es la «ciudad federal». |  |
| `ua` | Ucrania | **Kiev** (UE = WD) |  |  |  |

### Oceanía

| Código | País | Se muestra (fuente) | También vale | Nota al revelar | Decide el dueño |
|---|---|---|---|---|---|
| `au` | Australia | **Camberra** (UE) | Canberra *(WD)* |  |  |
| `fj` | Fiyi | **Suva** (UE = WD) |  |  |  |
| `mh` | Islas Marshall | **Majuro** (UE = WD) |  |  |  |
| `sb` | Islas Salomón | **Honiara** (UE = WD) |  |  |  |
| `ki` | Kiribati | **Tarawa** (UE) | Tarawa Sur *(WD)* |  |  |
| `fm` | Micronesia | **Palikir** (UE = WD) |  |  |  |
| `nr` | Nauru | **Yaren** (UE = WD) |  | Nauru no tiene capital oficial: el Gobierno está en el distrito de Yaren. |  |
| `nz` | Nueva Zelanda | **Wellington** (UE = WD) |  |  |  |
| `pw` | Palaos | **Melekeok** (UE) | Ngerulmud *(WD)* | El Gobierno está en Ngerulmud, en el estado de Melekeok. |  |
| `pg` | Papúa Nueva Guinea | **Port Moresby** (UE) | Puerto Moresby *(WD)* |  |  |
| `ws` | Samoa | **Apia** (UE = WD) |  |  |  |
| `to` | Tonga | **Nukualofa** (UE = WD) |  |  |  |
| `tv` | Tuvalu | **Funafuti** (UE = WD) |  |  |  |
| `vu` | Vanuatu | **Port Vila** (UE = WD) |  |  |  |

### Asia

| Código | País | Se muestra (fuente) | También vale | Nota al revelar | Decide el dueño |
|---|---|---|---|---|---|
| `af` | Afganistán | **Kabul** (UE = WD) |  |  |  |
| `sa` | Arabia Saudita | **Riad** (UE = WD) |  |  |  |
| `am` | Armenia | **Ereván** (UE = WD) | Yereván *(WD)* |  |  |
| `az` | Azerbaiyán | **Bakú** (UE = WD) |  |  |  |
| `bh` | Baréin | **Manama** (UE = WD) |  |  |  |
| `bd` | Bangladés | **Daca** (UE = WD) | Dacca *(WD)* · Dhaka *(WD)* |  |  |
| `bn` | Brunéi | **Bandar Seri Begawan** (UE = WD) |  |  |  |
| `bt` | Bután | **Timbu** (UE = WD) |  |  |  |
| `kh` | Camboya | **Nom Pen** (UE = WD) | Phnom Penh *(WD)* |  |  |
| `qa` | Catar | **Doha** (UE = WD) |  |  |  |
| `cn` | China | **Pekín** (UE = WD) | Beijing *(UE-nota)* |  |  |
| `cy` | Chipre | **Nicosia** (UE = WD) |  |  |  |
| `kp` | Corea del Norte | **Pionyang** (UE = WD) |  |  |  |
| `kr` | Corea del Sur | **Seúl** (UE = WD) |  |  |  |
| `ae` | Emiratos Árabes Unidos | **Abu Dabi** (UE) | Abu Dhabi *(WD)* |  |  |
| `ph` | Filipinas | **Manila** (UE = WD) |  |  |  |
| `ge` | Georgia | **Tiflis** (UE = WD) | Tbilisi *(UE-nota)* |  |  |
| `in` | India | **Nueva Deli** (UE) | Nueva Delhi *(WD)* |  |  |
| `id` | Indonesia | **Yakarta** (UE = WD) | Jakarta *(WD)* | Hay una nueva capital designada, Nusantara, todavía sin traslado oficial. | ⚠️ Nusantara NO vale (designada por ley; Wikipedia: aún no es la capital) |
| `iq` | Irak | **Bagdad** (UE = WD) |  |  |  |
| `ir` | Irán | **Teherán** (UE = WD) |  |  |  |
| `il` | Israel | **Jerusalén** (WD) |  | (nota neutral a redactar por el dueño) | ⚠️ DECIDIDO (dueño, opción B): Jerusalén con nota neutra. Falta aprobar la nota |
| `jp` | Japón | **Tokio** (UE = WD) |  |  |  |
| `jo` | Jordania | **Amán** (UE = WD) | Ammán *(WD)* |  |  |
| `kz` | Kazajistán | **Astaná** (UE = WD) |  | Se llamó Nur-Sultán entre 2019 y 2022. | ⚠️ Nur-Sultán NO vale (nombre anterior) |
| `kg` | Kirguistán | **Biskek** (UE = WD) |  |  |  |
| `kw` | Kuwait | **Kuwait** (UE) | Ciudad de Kuwait *(WD)* |  |  |
| `la` | Laos | **Vientián** (UE = WD) |  |  |  |
| `lb` | Líbano | **Beirut** (UE = WD) |  |  |  |
| `my` | Malasia | **Kuala Lumpur** (UE = WD) | Putrajaya *(UE-nota)* | Kuala Lumpur es la capital constitucional; Putrajaya, la sede del Gobierno. | ⚠️ capital doble |
| `mv` | Maldivas | **Malé** (UE = WD) |  |  |  |
| `mn` | Mongolia | **Ulán Bator** (UE = WD) |  |  |  |
| `mm` | Myanmar | **Naipyidó** (UE = WD) | Naypyidaw *(WD)* · Nay Pyi Taw *(WD)* · Nepidó *(WD)* | Es la capital desde 2005; antes lo era Rangún. | ⚠️ Rangún NO vale (antigua capital) |
| `np` | Nepal | **Katmandú** (UE = WD) |  |  |  |
| `om` | Omán | **Mascate** (UE = WD) |  |  |  |
| `pk` | Pakistán | **Islamabad** (UE = WD) |  |  | ⚠️ Rawalpindi NO vale (Wikidata la arrastra de 1958-1967; Wikipedia: capital provisional) |
| `ps` | Palestina | **Jerusalén Este** (WD) | Ramala *(WD)* · Jerusalén Oriental *(WD)* | (nota neutral a redactar por el dueño) | ⚠️ DECIDIDO (dueño): se muestra Jerusalén Este; vale también Ramala. Falta aprobar la nota |
| `sg` | Singapur | **Singapur** (UE = WD) | Ciudad de Singapur *(WD)* |  |  |
| `sy` | Siria | **Damasco** (UE = WD) |  |  |  |
| `lk` | Sri Lanka | **Sri Jayawardenapura Kotte** (UE = WD) | Colombo *(UE-nota)* · Sri Jayawardenepura Kotte *(WD)* | Sri Jayawardenapura Kotte es la capital administrativa; Colombo, la comercial. | ⚠️ capital doble |
| `th` | Tailandia | **Bangkok** (UE = WD) | Bancoc *(WD)* |  |  |
| `tw` | Taiwán | **Taipéi** (UE = WD) | Taipei *(WD)* |  |  |
| `tj` | Tayikistán | **Dusambé** (UE = WD) |  |  |  |
| `tl` | Timor Oriental | **Dili** (UE = WD) |  |  |  |
| `tm` | Turkmenistán | **Asjabad** (UE = WD) | Asgabad *(WD)* · Ashjabad *(WD)* |  |  |
| `tr` | Turquía | **Ankara** (UE = WD) |  |  |  |
| `uz` | Uzbekistán | **Taskent** (UE = WD) |  |  |  |
| `vn` | Vietnam | **Hanoi** (UE) | Hanói *(WD)* |  |  |
| `ye` | Yemen | **Saná** (UE = WD) | Adén *(WD)* | Adén es la capital provisional del Gobierno reconocido desde 2015. | ⚠️ capital doble de facto; ver §5.3 |

### África

| Código | País | Se muestra (fuente) | También vale | Nota al revelar | Decide el dueño |
|---|---|---|---|---|---|
| `ao` | Angola | **Luanda** (UE = WD) |  |  |  |
| `dz` | Argelia | **Argel** (UE = WD) |  |  |  |
| `bj` | Benín | **Porto Novo** (UE = WD) | Cotonú *(UE-nota)* | Porto Novo es la capital oficial; Cotonú, la sede del Gobierno. | ⚠️ capital doble |
| `bw` | Botsuana | **Gaborone** (UE = WD) |  |  |  |
| `bf` | Burkina Faso | **Uagadugu** (UE) | Uagadugú *(WD)* |  |  |
| `bi` | Burundi | **Guitega** (UE = WD) | Gitega *(WD)* | Es la capital política desde 2019; Buyumbura, la económica. | ⚠️ Buyumbura NO vale (capital económica) |
| `cv` | Cabo Verde | **Praia** (UE = WD) |  |  |  |
| `cm` | Camerún | **Yaundé** (UE = WD) | Yaoundé *(WD)* |  |  |
| `td` | Chad | **Yamena** (UE = WD) |  |  |  |
| `km` | Comoras | **Moroni** (UE = WD) |  |  |  |
| `ci` | Costa de Marfil | **Yamusukro** (UE = WD) |  | Abiyán es la capital económica y el centro administrativo. | ⚠️ Abiyán NO vale (la UE: «centro administrativo»; WD no la registra como capital) |
| `eg` | Egipto | **El Cairo** (UE = WD) |  |  |  |
| `er` | Eritrea | **Asmara** (UE = WD) |  |  |  |
| `sz` | Esuatini | **Babane** (UE) | Mbabane *(WD)* · Lobamba *(WD)* | Babane (Mbabane) es la capital administrativa; Lobamba, la real y legislativa. | ⚠️ capital doble |
| `et` | Etiopía | **Adís Abeba** (UE = WD) |  |  |  |
| `ga` | Gabón | **Libreville** (UE = WD) |  |  |  |
| `gm` | Gambia | **Banjul** (UE = WD) |  |  |  |
| `gh` | Ghana | **Acra** (UE = WD) | Accra *(WD)* |  |  |
| `gn` | Guinea | **Conakri** (UE = WD) | Conakry *(WD)* |  |  |
| `gw` | Guinea-Bisáu | **Bisáu** (UE = WD) | Bissau *(WD)* |  |  |
| `gq` | Guinea Ecuatorial | **Ciudad de la Paz** (UE = WD) |  | Malabo fue la capital hasta enero de 2026. | ⚠️ DECIDIDO (dueño): Malabo no vale; la nota lo explica |
| `ke` | Kenia | **Nairobi** (UE = WD) |  |  |  |
| `ls` | Lesoto | **Maseru** (UE = WD) |  |  |  |
| `lr` | Liberia | **Monrovia** (UE = WD) |  |  |  |
| `ly` | Libia | **Trípoli** (UE = WD) |  |  |  |
| `mg` | Madagascar | **Antananarivo** (UE = WD) |  |  |  |
| `mw` | Malaui | **Lilongüe** (UE = WD) |  |  |  |
| `ml` | Malí | **Bamako** (UE = WD) |  |  |  |
| `ma` | Marruecos | **Rabat** (UE = WD) |  |  |  |
| `mu` | Mauricio | **Port Louis** (UE = WD) |  |  |  |
| `mr` | Mauritania | **Nuakchot** (UE = WD) |  |  |  |
| `mz` | Mozambique | **Maputo** (UE = WD) |  |  |  |
| `na` | Namibia | **Windhoek** (UE = WD) |  |  |  |
| `ne` | Níger | **Niamey** (UE = WD) |  |  |  |
| `ng` | Nigeria | **Abuya** (UE = WD) |  |  |  |
| `cf` | República Centroafricana | **Bangui** (UE = WD) |  |  |  |
| `cg` | República del Congo | **Brazzaville** (UE = WD) |  |  |  |
| `cd` | República Democrática del Congo | **Kinsasa** (UE = WD) |  |  |  |
| `rw` | Ruanda | **Kigali** (UE = WD) |  |  |  |
| `st` | Santo Tomé y Príncipe | **Santo Tomé** (UE = WD) |  |  |  |
| `sn` | Senegal | **Dakar** (UE = WD) |  |  |  |
| `sc` | Seychelles | **Victoria** (UE = WD) |  |  |  |
| `sl` | Sierra Leona | **Freetown** (UE = WD) |  |  |  |
| `so` | Somalia | **Mogadiscio** (UE = WD) |  |  |  |
| `za` | Sudáfrica | **Pretoria** (UE = WD) | Ciudad del Cabo *(UE-nota)* · Bloemfontein *(UE-nota)* · Tshwane *(UE-nota)* | Pretoria es la capital administrativa; Ciudad del Cabo, la legislativa, y Bloemfontein, la judicial. | ⚠️ capital triple |
| `sd` | Sudán | **Jartum** (UE = WD) | Kartum *(WD)* |  |  |
| `ss` | Sudán del Sur | **Yuba** (UE = WD) | Juba *(WD)* |  |  |
| `tz` | Tanzania | **Dodoma** (UE = WD) |  | Muchas instituciones siguen en Dar es-Salaam, la antigua capital. | ⚠️ Dar es-Salaam NO vale (antigua capital) |
| `tg` | Togo | **Lomé** (UE = WD) |  |  |  |
| `tn` | Túnez | **Túnez** (UE = WD) |  |  |  |
| `ug` | Uganda | **Kampala** (UE = WD) |  |  |  |
| `dj` | Yibuti | **Yibuti** (UE) | Ciudad de Yibuti *(WD)* · Djibouti *(WD)* |  |  |
| `zm` | Zambia | **Lusaka** (UE = WD) |  |  |  |
| `zw` | Zimbabue | **Harare** (UE = WD) |  |  |  |

## Consultas para reproducirlo

Wikidata (capitales vigentes y sus calificadores):

```sparql
SELECT ?code ?country ?capital ?capitalLabelEs ?capitalLabelEn ?rank ?start ?end ?roleLabel WHERE {
  ?country p:P297 ?isoSt . ?isoSt ps:P297 ?code .
  ?country p:P36 ?capSt . ?capSt ps:P36 ?capital ; wikibase:rank ?rank .
  OPTIONAL { ?capSt pq:P580 ?start }
  OPTIONAL { ?capSt pq:P582 ?end }
  OPTIONAL { ?capSt pq:P3831 ?role . ?role rdfs:label ?roleLabel FILTER(lang(?roleLabel)="en") }
  OPTIONAL { ?capital rdfs:label ?capitalLabelEs FILTER(lang(?capitalLabelEs)="es") }
  OPTIONAL { ?capital rdfs:label ?capitalLabelEn FILTER(lang(?capitalLabelEn)="en") }
}
```

Alias en español de esas capitales: `SELECT ?cap ?alt WHERE { VALUES ?cap { … } ?cap skos:altLabel ?alt FILTER(lang(?alt)="es") }`.

UE: `pdftotext -enc UTF-8 -table -f 237 -l 250 ISG_es_4web.pdf` y, por fila, la
expresión `\s{2,}([A-Z]{2})\s{2,}(\S(?:.*?\S)?)\s{2,}` (código ISO y celda siguiente).
Ojo: la UE usa `EL` para Grecia y `UK` para el Reino Unido.
