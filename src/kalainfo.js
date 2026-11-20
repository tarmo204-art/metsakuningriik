/* =====================================================================
   Kala tutvustus püügi järel: ladinakeelne nimi, tutvustus, huvitavad faktid,
   sinu saagi andmed ja suured nupud „Mida saad saagiga teha?“.
   KI[id] = [ladinakeelne nimi, tutvustus, [faktid], muinasjutuline?]
   ===================================================================== */
const KI = {
  ahven: ['Perca fluviatilis', 'Ahven on Eesti üks tuntumaid kalu. Teda tunneb ära rohekate külgede tumedate triipude, oranžikate kõhuuimede ja okkalise seljauime järgi.', ['Elab peaaegu igas Eesti järves, jões ja ka rannikumeres.', 'Noored ahvenad söövad putukavastseid, suured ahvenad on röövkalad.', 'Ahven ujub parvedes ja jahib sageli koos.', 'Talvel võtab ahven hästi ka jääaugust.']],
  sarg: ['Rutilus rutilus', 'Särg on Eestis väga levinud mageveekala. Teda tunneb ära hõbedase keha, punakate silmade ja oranžikate uimede järgi.', ['Elab järvedes, jõgedes ja ka riimvees rannikul.', 'Toitub veetaimedest, putukatest ja väikestest veeloomadest.', 'Võib moodustada suuri parvi.', 'On üks Eesti tavalisemaid kalaliike.']],
  roosarg: ['Scardinius erythrophthalmus', 'Roosärg on särje sugulane, kellel on kuldne läige ja erepunased uimed. Suu on veidi ülespoole suunatud, sest ta korjab toitu veepinnalt.', ['Armastab sooja ja taimerikast vett.', 'Sööb palju veetaimi.', 'Teda aetakse tihti särjega segi – vaata uimede värvi!', 'Kevadel kudeb taimede vahele.']],
  tobias: ['Ammodytes tobianus', 'Tobias ehk väike tobiaskala on sale ja pikk merekala, kes kaevab end ohu korral välgukiirusel liiva sisse.', ['Elab madalas meres liivase põhja kohal.', 'Ööseks peitub liiva.', 'On tähtis toit lõhedele, tursale ja merelindudele.', 'Ujub suurtes parvedes.']],
  kiisk: ['Gymnocephalus cernua', 'Kiisk on väike, limane ja torkivate okastega ahvena sugulane. Kalurid peavad teda sageli tüütuks söödavargaks.', ['Tema keha katab paks lima.', 'Seljauimel on teravad okkad.', 'Elab põhja lähedal ja sööb kalamarja ning vastseid.', 'Kiisasupp oli vanasti hinnatud roog.']],
  teib: ['Leuciscus leuciscus', 'Teib on sale ja kiire jõekala, kes armastab voolavat vett. Tema keha on hõbedane ja selg tumedam.', ['Elab peamiselt jõgedes.', 'Ujub kärestikes vastuvoolu.', 'Toitub putukatest, mis kukuvad vette.', 'Kudeb varakevadel.']],
  laternkala: ['Myctophum punctatum', 'Laternkala on pisike sügavikukala, kelle kõhul on helendavad täpid ehk valgusorganid.', ['Päeval elab sügaval, öösel tõuseb pinnale toituma.', 'Helendavad täpid aitavad tal varjuda.', 'Laternkalu on ookeanides tohutult palju.', 'Läänemerre ta tavaliselt ei satu.']],
  latikas: ['Abramis brama', 'Latikas on lai ja lapik põhjakala, kes tuhnib mudas toitu otsides. Vanad latikad on pronksikarva.', ['Suu on väljasirutatav nagu toru.', 'Sööb põhjast usse ja vastseid.', 'Suured latikad võivad kaaluda üle 5 kg.', 'Kevadel on isastel peas valged kudemisnäsad.']],
  raim: ['Clupea harengus membras', 'Räim on Läänemere heeringas ja Eesti rahvuskala. Väike, hõbedane ja väga maitsev.', ['Eesti rahvuskala aastast 2007.', 'Ujub tohututes parvedes.', 'Räim on Läänemeres väiksem kui ookeani heeringas.', 'Suitsuräim on Eesti klassika.']],
  lest: ['Platichthys flesus', 'Lest on lame põhjakala, kelle mõlemad silmad on ühel küljel. Ta lamab põhjas ja muudab värvi vastavalt põhjale.', ['Noor lest ujub nagu tavaline kala, hiljem liigub üks silm teisele küljele.', 'Elab nii meres kui ka jõesuudmetes.', 'Võib peituda liiva sisse nii, et ainult silmad paistavad.', 'Kuivatatud lest on saarte toit.']],
  jaaahven: ['Perca fluviatilis (talvine vorm)', 'Jääahven on talvise vee kange ja tumedam ahven, kes on külma vee eluga eriti hästi kohanenud.', ['Võtab kõige paremini jääaugust.', 'Talvel liigub sügavamas vees.', 'Tema triibud on talvel tumedamad.', 'Talikalastajate lemmik.'], 1],
  tint: ['Osmerus eperlanus', 'Tint on väike sale kala, kes lõhnab värske kurgi järgi. Peipsi tint on kuulus üle Eesti.', ['Värske tint lõhnab tõesti kurgi järgi!', 'Kudeb kevadel jõgedes.', 'Läbipaistva hõbedase kehaga.', 'Kuivatatud tint on Peipsi-äärne hõrgutis.']],
  kuusarg: ['Rutilus lunaris', 'Kuuvalgusärg on muinasjutuline särg, kelle soomused helendavad kuuvalgel nagu hõbe.', ['Tuleb pinnale ainult kuuvalgetel öödel.', 'Täiskuu ajal on teda kõige rohkem.', 'Vanad kalurid uskusid, et ta toob õnne.', 'Päeval on ta täiesti tavalise särje moodi.'], 1],
  viidikas: ['Alburnus alburnus', 'Viidikas on väike hõbedane pinnakala, keda on suvel suurte parvedena näha veepinna lähedal.', ['Püüab putukaid otse veepinnalt.', 'Tema soomustest tehti vanasti kunstpärleid.', 'Hea söödakala röövkalade püügiks.', 'Väga kiire ja vilgas.']],
  nurg: ['Blicca bjoerkna', 'Nurg on latika moodi lapik kala, aga väiksem ja punakate rinnauimedega.', ['Elab parvedes koos latikatega.', 'Kasvab harva üle poole kilo.', 'Toitub põhjaloomadest ja planktonist.', 'Suurem silm kui latikal.']],
  lepamaim: ['Phoxinus phoxinus', 'Lepamaim on pisike kirju kala kiirevoolulistest ja puhastest ojadest.', ['Kudemise ajal muutub isase kõht punaseks.', 'Elab ainult puhtas ja hapnikurikkas vees.', 'Ujub väikeste parvedena.', 'Tunneb ohtu lõhna järgi.']],
  luukarits: ['Gasterosteus aculeatus', 'Luukarits on kolme seljaokkaga pisike kala. Kevadel on isasel erepunane kõht.', ['Isane ehitab taimedest pesa.', 'Isane valvab marja ja poegi üksi.', 'Okkad kaitsevad teda röövkalade eest.', 'Elab nii mage- kui ka merevees.']],
  ogalik: ['Pungitius pungitius', 'Ogalik on üheksa seljaokkaga pisikala ja üks Eesti väikseimaid kalu.', ['Kasvab tavaliselt vaid 5–7 cm pikkuseks.', 'Elab ka väga väikestes kraavides ja lompides.', 'Isane ehitab pesa taimede vahele.', 'Talub hästi hapnikuvaest vett.']],
  trulling: ['Barbatula barbatula', 'Trulling on vurrudega põhjakala, kes peidab end päeval kivide alla.', ['Suu ümber on kuus vurru.', 'Aktiivne peamiselt öösel.', 'Elab puhta veega ojades ja jõgedes.', 'Tunneb toitu vurrude abil.']],
  hink: ['Cobitis taenia', 'Hink on täpiline pisike põhjakala, kes kaevub ohu korral liiva sisse.', ['Silma all on peidetud kahe tipuga oga.', 'Sõelub toitu liivast.', 'Aktiivne hämaras ja öösel.', 'Kaitsealune liik paljudes Euroopa riikides.']],
  voldas: ['Cottus gobio', 'Võldas on suure peaga põhjakala puhastest ojadest. Ujupõit tal pole, seega ta hüppab mööda põhja.', ['Elab ainult väga puhtas vees.', 'Isane valvab marja kivi all.', 'Hea veepuhtuse näitaja.', 'Kaitsealune liik Eestis.']],
  kilu: ['Sprattus sprattus', 'Kilu on räime väike sugulane. Kiluvõileib on Eesti klassika!', ['Ujub tohututes parvedes avameres.', 'Vürtsikilu on tehtud juba üle 150 aasta.', 'Kasvab harva üle 15 cm.', 'On tähtis toit tursale ja lõhele.']],
  mustmudil: ['Neogobius melanostomus', 'Must mudil on võõrliik, kes jõudis Läänemerre laevade ballastveega ja levis väga kiiresti.', ['Esimest korda leiti Eestis 2005. aastal.', 'Sööb teiste kalade marja ja karpe.', 'Kõhuuimed on kasvanud kokku iminapaks.', 'Isane muutub kudemise ajal peaaegu mustaks.']],
  linask: ['Tinca tinca', 'Linask on rohekuldne, väikeste soomuste ja punaste silmadega aeglane kala. Ta on aga väga sitke.', ['Tema keha katab paks lima.', 'Talub hästi hapnikuvaest vett.', 'Elab mudastes ja taimerikastes järvedes.', 'Teda kutsutakse vahel „arstikalaks“.']],
  haug: ['Esox lucius', 'Haug on järvede ja jõgede röövkala teravate hammastega. Ta varitseb taimede vahel ja ründab välgukiirusel.', ['Tal on suus sadu teravaid hambaid.', 'Suured haugid võivad kaaluda üle 15 kg.', 'Sööb ka konni, hiiri ja väikseid linde.', 'Kudeb väga vara kevadel, kohe pärast jää minekut.']],
  liivamudil: ['Pomatoschistus minutus', 'Liivamudil on liivase põhja värvi pisike merekala, keda on peaaegu võimatu märgata.', ['Elab madalas rannavees.', 'Isane ehitab pesa karbikoore alla.', 'Kasvab vaid umbes 9 cm pikkuseks.', 'Muudab värvi vastavalt põhjale.']],
  sainas: ['Leuciscus idus', 'Säinas on kuldse kõhuga jõekala. Ta on tugev ujuja ja hea kalameeste trofee.', ['Kevadel ujub jõgedes üles kudema.', 'Elab ka rannikumere riimvees.', 'Sööb putukaid, tigusid ja väikseid kalu.', 'Kuldset vormi peetakse ka tiigikalana.']],
  koha: ['Sander lucioperca', 'Koha on klaasjate silmadega öine kiskja. Tema silmad näevad hämaras väga hästi.', ['Jahib peamiselt hämaras ja öösel.', 'Väga hinnatud ja maitsev kala.', 'Suus on suured kihvad.', 'Isane valvab marjapesa.']],
  tursk: ['Gadus morhua', 'Tursk on mere ahne kala, kelle lõual on üks vurr. Vanasti oli ta Läänemere tähtsaim püügikala.', ['Lõuavurr aitab toitu leida.', 'Emane võib kudeda miljoneid marjaterasid.', 'Läänemere tursk on väiksem kui ookeani tursk.', 'Tursamaksaõli on täis vitamiine.']],
  siig: ['Coregonus lavaretus', 'Siig on hõbedane ja väga hinnatud lõhilane. Tal on väike suu ja väike rasvauim.', ['Elab meres, järvedes ja jõgedes.', 'Kudeb sügisel.', 'Suitsusiig on suur delikatess.', 'Sööb planktonit ja põhjaloomi.']],
  raabis: ['Coregonus albula', 'Rääbis on Peipsi ja teiste suurte järvede kuulus väike lõhilane.', ['Ujub suurtes parvedes vabas vees.', 'Kudeb hilissügisel.', 'Tema mari on väga hinnatud.', 'Elab ainult puhtas ja jahedas vees.']],
  kristallahven: ['Perca crystallina', 'Kristallahven on muinasjutuline ahven, kelle soomused on läbipaistvad nagu klaas.', ['Läbi soomuste paistavad tema luud.', 'Päikese käes sätendab kõigis värvides.', 'Väga raske märgata vees.', 'Kalurid hoiavad teda õnnetoojana.'], 1],
  pilvekala: ['Nubichthys griseus', 'Pilvekala on hall ja vaikne kala, kes tuleb välja ainult pilvise ilmaga.', ['Päikesepaistel peitub sügavusse.', 'Tema värv sulandub pilvise taeva peegeldusega.', 'Ujub aeglaselt ja vaikselt.', 'Pilvise ilmaga võtab ta väga hästi.'], 1],
  vimb: ['Vimba vimba', 'Vimb on ninaka koonuga kala, kes tuleb kevadel merest jõgedesse kudema.', ['Kudemise ajal läheb isane peaaegu mustaks.', 'Rändab ka sadu kilomeetreid.', 'Elab Eesti rannikumeres ja jõgedes.', 'Suitsuvimb on hinnatud roog.']],
  turb: ['Squalius cephalus', 'Turb on laia peaga jõekala, kes sööb peaaegu kõike – isegi konni ja väikseid kalu.', ['Väga ettevaatlik ja kergesti ehmuv.', 'Armastab kiirevoolulisi jõgesid.', 'Suured turvad on röövkalad.', 'Võib elada üle 20 aasta.']],
  paikesekarp: ['Cyprinus solaris', 'Päikesekarp on muinasjutuline karpkala, kes tuleb pinnale päikest võtma.', ['Päikesepaistel on ta kuldne.', 'Võtab kõige paremini keskpäeval.', 'Ujub aeglaselt pinna lähedal.', 'Pilvise ilmaga kaob sügavusse.'], 1],
  koger: ['Carassius carassius', 'Koger on kuldne ja väga vastupidav kala. Ta elab ka mudastes tiikides, kus teised kalad hakkama ei saa.', ['Talub talvel peaaegu hapnikuta vett.', 'Võib talve üle elada mudasse kaevunult.', 'Kasvab aeglaselt.', 'Elab tihti väikestes tiikides ja soodes.']],
  emakala: ['Zoarces viviparus', 'Emakala on kummaline merekala, kes sünnitab elusaid poegi – marja ta ei koe.', ['Emane sünnitab kuni 300 poega.', 'Tema luud on rohekad.', 'Elab kivide ja vetikate vahel.', 'Ainus Eesti kala, kes sünnitab elusaid poegi.']],
  hobekoger: ['Carassius gibelio', 'Hõbekoger on kogre hõbedane sugulane, kes levib Eesti vetes kiiresti.', ['Võib paljuneda ka ilma isasteta.', 'Väga vastupidav.', 'Tõrjub välja kohalikku kogret.', 'Kuldkala on pärit tema sugulastest.']],
  merihark: ['Myoxocephalus scorpius', 'Merihärg on okkalise peaga merekala, kes elab kivide vahel ja sööb kõike, mis suhu mahub.', ['Peas on teravad okkad.', 'Välja tõmmatuna võib ta häält teha.', 'Värv sobitub kividega.', 'Isane valvab marja.']],
  makrell: ['Scomber scombrus', 'Makrell on kiire triibulise seljaga merekala, kes ujub suurtes parvedes.', ['Tal pole ujupõit, seepärast peab ta kogu aeg ujuma.', 'Läänemerre satub harva.', 'Suitsumakrell on väga populaarne.', 'Selja triibud on rohekassinised.']],
  nokkhaug: ['Belone belone', 'Nokkhaug ehk tuulehaug on pika nokaga merekala, kelle luud on rohelised.', ['Rohelised luud on täiesti ohutud.', 'Kevadel tuleb randa kudema.', 'Võib hüpata veest välja.', 'Ujub pinna lähedal.']],
  merinoel: ['Syngnathus typhle', 'Merinõel on peenike nagu nõel. Ta on merihobu sugulane.', ['Poegi kannab hoopis isane kõhu all taskus.', 'Peitub meriheina vahel püstiasendis.', 'Sööb pisikesi vähilaadseid.', 'Ujub väga aeglaselt.']],
  madunoel: ['Nerophis ophidion', 'Madunõel on ussi moodi pikk ja peenike kala, kes peitub meriheina vahel.', ['Isane kannab marja kõhul.', 'Tal pole peaaegu üldse uimi.', 'Väga raske märgata.', 'Merihobu ja merinõela sugulane.']],
  peled: ['Coregonus peled', 'Peled on siia sugulane, kes toodi kunagi Siberist Eesti järvedesse.', ['Kasvab kiiresti.', 'Sööb planktonit.', 'Asustati Eestisse 20. sajandil.', 'Väga maitsev suitsutatult.']],
  mudamaim: ['Leucaspius delineatus', 'Mudamaim on haruldane pisike kala soiste ja mudaste veekogude vaiksest veest.', ['Kasvab vaid 6–9 cm pikkuseks.', 'Isane valvab marja.', 'Elab väikestes tiikides ja kraavides.', 'Eestis haruldane.']],
  vingerjas: ['Misgurnus fossilis', 'Vingerjas on ilma ennustav kala: enne äikest muutub ta rahutuks ja ujub ringi.', ['Oskab hingata ka soolestiku kaudu.', 'Võib kuivas mudas ellu jääda.', 'Vanasti hoiti teda purgis ilmaennustajana.', 'Suu ümber on 10 vurru.']],
  ojasilm: ['Lampetra planeri', 'Ojasilm on jõesilmu väike sugulane, kes elab kogu elu ojades.', ['Täiskasvanuna ei söö ta enam üldse.', 'Vastsed elavad mudas mitu aastat.', 'Tal pole lõugu ega soomuseid.', 'Ta on iidne olend, mitte päris kala.']],
  angerjas: ['Anguilla anguilla', 'Angerjas ujub peamiselt öösel ja on libe nagu seep. Tema elu on täis saladusi.', ['Sünnib kaugel Sargasso meres.', 'Rändab Eestisse tuhandeid kilomeetreid.', 'Võib roomata märjal rohul ühest veekogust teise.', 'Võib elada üle 50 aasta.']],
  luts: ['Lota lota', 'Luts on talvekala, kes armastab külma vett. Ta on ainus tursalaadne kala, kes elab magevees.', ['Kudeb südatalvel jää all.', 'Aktiivne öösel.', 'Tema maks on väga suur ja toitev.', 'Lõual on üks vurr nagu tursal.']],
  harjus: ['Thymallus thymallus', 'Harjus on suure purjekujulise seljauimega jõekala. Teda kutsutakse jõgede lipukandjaks.', ['Elab ainult väga puhtas ja jahedas vees.', 'Seljauim on kirju ja värviline.', 'Lõhnab kergelt tüümiani järgi.', 'Väga hinnatud lendõngitsejate seas.']],
  vikerforell: ['Oncorhynchus mykiss', 'Vikerforell on vikerkaarevärviline tugev ujuja. Ta on pärit Põhja-Ameerikast.', ['Külgedel on roosakas triip.', 'Kasvatatakse palju kalakasvandustes.', 'Väga tugev võitleja õnge otsas.', 'Mereline vorm kannab nime steelhead.']],
  karpkala: ['Cyprinus carpio', 'Karpkala on uhke ja jõuline tiigikala, keda on kasvatatud juba üle 2000 aasta.', ['Suu ümber on neli vurru.', 'Võib elada üle 40 aasta.', 'Peeglikarpkalal on ainult mõned suured soomused.', 'Väga tark ja ettevaatlik.']],
  meriforell: ['Salmo trutta trutta', 'Meriforell on hõbedane rändaja, kes elab meres, aga kudeb jõgedes.', ['Noored kalad elavad jões 1–4 aastat.', 'Naaseb kudema oma sünnijõkke.', 'Võib kasvada üle 10 kg.', 'Väga tugev ja kiire.']],
  lohe: ['Salmo salar', 'Lõhe on jõgede kuningas, kes hüppab üle kärestike ja kosede, et jõuda kudemispaika.', ['Leiab tee tagasi oma sünnijõkke lõhna järgi.', 'Võib hüpata üle 3 meetri kõrgusele.', 'Kudemise ajal ta ei söö.', 'Eesti jõgedes on looduslikud lõhed kaitse all.']],
  paalia: ['Salvelinus alpinus', 'Paalia on arktiline lõhilane oranži kõhuga. Ta elab kõige põhjapoolsemates vetes.', ['Elab kõige põhjapoolsemas magevees.', 'Kudemise ajal läheb kõht erkpunaseks.', 'Talub väga külma vett.', 'Eestis väga haruldane.']],
  vihmaforell: ['Salmo pluvialis', 'Vihmaforell on muinasjutuline forell, kes hüppab vihmapiiskade järele.', ['Võtab ainult vihmase ilmaga.', 'Arvab, et vihmapiisad on putukad.', 'Sätendab nagu märg kivi.', 'Pärast vihma kaob ta jälle.'], 1],
  toogjas: ['Leuciscus aspius', 'Tõugjas on ainus röövtoiduline karpkalaline Eestis. Ta ründab pinnal kalu kõva pritsmega.', ['Tal pole hambaid, aga ta on ometi kiskja.', 'Jahib pinnal väikseid kalu.', 'Väga kiire ujuja.', 'Võib kaaluda üle 7 kg.']],
  joeforell: ['Salmo trutta fario', 'Jõeforell on punaste täppidega ojade kaunitar. Ta elab kogu elu jões.', ['Täpid on mustad ja punased.', 'Elab ainult puhtas ja jahedas vees.', 'Valvab oma kohta jões.', 'Väga ettevaatlik kala.']],
  uduhobe: ['Nebulargentea occulta', 'Uduhõbe on muinasjutuline kala, kes on peaaegu nähtamatu ja ilmub ainult udus.', ['Udus on tema soomused hõbedased.', 'Päikese käes ta kaob.', 'Ainult kannatlik kalur näeb teda.', 'Tema kohta on palju legende.'], 1],
  joesilm: ['Lampetra fluviatilis', 'Jõesilm on iidne lõugadeta kala, kes rändab sügisel öösiti jõest üles.', ['Tal on imisuu, mitte lõuad.', 'Ta on peaaegu muutumatuna elanud üle 300 miljoni aasta.', 'Praetud ja marineeritud silm on Eesti hõrgutis.', 'Pärast kudemist ta sureb.']],
  hobekarp: ['Hypophthalmichthys molitrix', 'Hõbekarp on suur hõbedane karpkala, kes hüppab ehmatades veest välja.', ['Mootorpaadi müra peale võib hüpata 3 meetrit kõrgele.', 'Sööb planktonit.', 'Pärit Ida-Aasiast.', 'Silmad on pea allosas.']],
  kammeljas: ['Scophthalmus maximus', 'Kammeljas on suur lapik merekala, kelle mõlemad silmad on keha vasakul küljel.', ['Muudab värvi vastavalt põhjale.', 'Väga hinnatud ja kallis kala.', 'Tal pole soomuseid, vaid luunäsad.', 'Läänemeres kasvab väiksemaks kui ookeanis.']],
  amuur: ['Ctenopharyngodon idella', 'Valgeamuur on taimtoiduline hiid, kes hoiab tiigid veetaimedest puhtana.', ['Sööb päevas rohkem taimi, kui ise kaalub.', 'Pärit Hiinast ja Amuuri jõest.', 'Võib kasvada üle 30 kg.', 'Kasutatakse kraavide ja tiikide puhastamiseks.']],
  kirveskala: ['Argyropelecus hemigymnus', 'Kirveskala on hõbedane kirvekujuline sügavikukala, kes helendab pimedas.', ['Kõhul on helendavad organid.', 'Silmad vaatavad ülespoole.', 'Elab sadade meetrite sügavusel.', 'Kasvab vaid paari sentimeetri pikkuseks.']],
  kuldahven: ['Perca aurea', 'Kuldne ahven on muinasjutuline ahven puhtast kullast soomustega.', ['Tema soomused säravad ka pimedas.', 'Väga haruldane ja hinnaline.', 'Legendi järgi elab ta ainult rikkas vees.', 'Kalurid annavad teda edasi põlvest põlve.'], 1],
  saga: ['Silurus glanis', 'Säga on hiiglaslik vuntsidega põhjakala. Ta on Euroopa suurim mageveekala.', ['Võib kasvada üle 2,5 meetri pikkuseks.', 'Sööb ka partisid ja rotte.', 'Tal pole soomuseid.', 'Aktiivne peamiselt öösel.']],
  kuningkarp: ['Cyprinus carpio (koi)', 'Kuninglik karpkala on kuninga lemmik: punase-valgekirju ja uhke nagu koi.', ['Igal kalal on oma ainulaadne muster.', 'Võib elada üle 50 aasta.', 'Tunneb ära oma toitja.', 'Väga hinnatud tiigikala.']],
  tuur: ['Acipenser oxyrinchus', 'Tuur on iidne kala, kes elas juba dinosauruste ajal. Soomuste asemel on tal luukilbid.', ['Võib kaaluda üle 100 kg.', 'Tema marjast tehakse musta kaaviari.', 'Elab üle 60 aasta.', 'Läänemeres on ta peaaegu välja surnud ja kaitse all.']],
  virmaliskala: ['Aurorichthys borealis', 'Virmaliskala helendab jää all nagu virmalised taevas.', ['Värvid muutuvad roheliseks, lillaks ja siniseks.', 'Elab ainult külmas vees.', 'Ilmub selgetel talveöödel.', 'Tema valgus meelitab teisi kalu.'], 1],
  udukala: ['Nebulichthys nocturnus', 'Udukala ilmub ainult öösel udu seest ja kaob sama kiiresti.', ['Tema uimed on nagu udu.', 'Ujub täiesti hääletult.', 'Vanad kalurid kartsid teda.', 'Hommikuks on ta läinud.'], 1],
  vikerkaarekala: ['Iridichthys pluvialis', 'Vikerkaarekala helgib kõigis värvides. Teda nähakse ainult vihmasajus.', ['Iga soomus on eri värvi.', 'Pärast vihma tekib tema järele vikerkaar.', 'Väga haruldane.', 'Toob kalurile õnne.'], 1],
  tormihaug: ['Esox tempestatis', 'Tormihaug tõuseb tormiga sügavusest jahtima. Ta on tavalisest haugist palju suurem ja tigedam.', ['Võtab ainult tormise ilmaga.', 'Tema hambad on nagu nõelad.', 'Lainetes tunneb ta end koduselt.', 'Väga raske välja tõmmata.'], 1],
  tuun: ['Thunnus thynnus', 'Hariliku tuuni ehk tuunikala peetakse ookeani kiireimaks ujujaks. Ta on väga tugev ja raske kala.', ['Ujub kuni 70 km/h.', 'Võib kaaluda üle 600 kg.', 'Tema keha on soojem kui ümbritsev vesi.', 'Rändab üle terve ookeani.']],
  merikurat: ['Lophius piscatorius', 'Merikurat on hiiglasliku suuga põhjakala, kes meelitab saaki peas oleva „ritvaga“.', ['Ritva otsas on söödakujuline nahatükk.', 'Suu on peaaegu sama lai kui keha.', 'Võib neelata endaga sama suure kala.', 'Peitub põhjas liiva sisse.']],
  kuuangerjas: ['Anguilla lunaris', 'Kuu-angerjas on öine legend, kes helendab nagu kuu.', ['Ilmub ainult täiskuu öödel.', 'Tema helendus paistab läbi vee.', 'Väga libe ja tugev.', 'Kalurid peavad teda kuu sõnumitoojaks.'], 1],
  joekuningas: ['Esox rex fluminis', 'Jõekuningas on vana hiiglaslik haug, kellest kalurid räägivad lugusid.', ['Ta on elanud kauem kui ükski kalur.', 'On murdnud sadu õngi.', 'Tema seljal on vanad armid.', 'Keegi pole teda kaks korda püüdnud.'], 1],
  merivaim: ['Spectrichthys marinus', 'Merivaim on öise mere poolläbipaistev kala.', ['Läbi tema keha paistab kuu.', 'Ujub ainult öösel.', 'Liigub nagu udu vees.', 'Meremehed pidasid teda vaimuks.'], 1],
  jaahaug: ['Esox glacialis', 'Jäähaug on igijää all elav valge haug.', ['Tema soomused on jäävalged.', 'Elab ainult jäise vee all.', 'Väga aeglane, aga hirmuäratav.', 'Tema hambad on nagu jääpurikad.'], 1],
  haldjakala: ['Nymphichthys scintillans', 'Haldjakala on haldjate lemmik, kes sädeleb kõigis värvides.', ['Sädeleb nagu tolm päikesevalguses.', 'Väga väike ja kerge.', 'Legendi järgi teeb ta soovid teoks.', 'Ilmub ainult salapärastes paikades.'], 1],
  valgukala: ['Fulgurichthys tonans', 'Välgukala sähvatab nagu välk. Teda saab püüda ainult tormiga.', ['Tema keha on täis elektrit.', 'Ilmub äikese ajal.', 'Õngenöör värises tema lähedal.', 'Väga kiire ja ootamatu.'], 1],
  mookkala: ['Xiphias gladius', 'Mõõkkala on pika mõõgaga ookeani kuningas ja üks maailma kiiremaid kalu.', ['Mõõk on tegelikult pikk ülemine lõug.', 'Mõõgaga lööb ta saaki uimaseks.', 'Silmad ja aju on eriliselt soojad.', 'Võib kaaluda üle 500 kg.']],
  vahk: ['Astacus astacus', 'Jõevähk on Eesti jõgede ja järvede soomustatud elanik. Ta pole kala, vaid vähilaadne.', ['Elab kivide all ja käib öösiti toitu otsimas.', 'Kasvades vahetab ta mitu korda kesta.', 'Jõevähk on Eestis kaitse all ja tema püük on piiratud.', 'Keedetult muutub ta punaseks.']],
  airukala: ['Regalecus glesne', 'Airukala on väga pikk hõbedane kala punase harjaga. Teda peetakse meremaoks.', ['Maailma pikim luukala – kuni 8 meetrit.', 'Elab sügaval ookeanis.', 'Pinnal nähakse teda väga harva.', 'Temast on sündinud meremao legendid.']],
  ogahai: ['Squalus acanthias', 'Harilik ogahai on väike hai, kellel on mõlema seljauime ees mürgine oga. Vahel satub ka Läänemerre.', ['Võib elada üle 70 aasta.', 'Emane kannab poegi kuni 2 aastat.', 'Ujub suurte parvedena.', 'Oga võib tekitada valusa haava.']],
  heeringahai: ['Lamna nasus', 'Heeringahai on võimas ja kiire hai, kes jahib heeringaid ja makrelli. Läänemerre jõuab ta harva.', ['Tema keha on soojem kui vesi.', 'Väga kiire ujuja.', 'Võib kasvada üle 3 meetri.', 'Ohustatud liik.']],
  kuldkala: ['Carassius auratus (muinasjutu kuldkala)', 'Kuldkala on muinasjutu kala, kes täidab soovi, kui ta vabaks lased.', ['Ta on tuntud muinasjuttudest üle maailma.', 'Soovi täidab ta ainult heale inimesele.', 'Päris kuldkalad on kogre sugulased.', 'Ära ole ahne – muidu kaob kõik!'], 1],
  igijaavaim: ['Glaciospiritus aeternus', 'Igijää vaim on jäätunud järve süda ise.', ['Ta on vanem kui ükski järv.', 'Tema ümber külmub vesi kohe jääks.', 'Väga raske ja tugev.', 'Ilmub ainult kõige külmemal ajal.'], 1],
  leviaatan: ['Leviathan abyssalis', 'Leviaatan on mere sügavuste koletis. Tema püüdmiseks on vaja väga tugevat õnge.', ['Ta on vanem kui ükski laev.', 'Tema varju nähes põgenevad kõik kalad.', 'Ta on murdnud sadu õngi.', 'Legendid räägivad temast juba tuhandeid aastaid.'], 1],
  jarvelohe: ['Draco lacustris', 'Järvelohe on salajase järve müütiline valvur.', ['Ta valvab järve aardeid.', 'Tema soomused on nagu kilbid.', 'Tõuseb pinnale ainult öösel.', 'Kes ta püüab, sellest saab legend.'], 1],
  sugavusedraakon: ['Draco abyssi', 'Sügavuse draakon on müütiline olend, kes ärkab vaid sügaviku kõige pimedamas osas.', ['Tema silmad helendavad nagu tuled.', 'Ta magab sadu aastaid.', 'Tema ärgates vesi keeb.', 'Ükski kalur pole teda varem näinud.'], 1],
  hallhaug: ['Esox lucius (Villemi hallhaug)', 'Vana kaluri Villemi legend: hiiglaslik hall haug, kes on Udulahes elanud kauem, kui keegi mäletab.', ['Villem otsis teda terve elu.', 'Tema soomused on hallid nagu udu.', 'Tal on lõual vana konks.', 'Udulahe elanikud räägivad temast lugusid.'], 1],
  kroonahven: ['Perca regia', 'Kroonahven on lossiaia ahven, kelle triibud säravad kullast ja purpurist.', ['Elab ainult lossiaia tiikides.', 'Ujub parvedes purskkaevude all.', 'Tema triibud säravad päikese käes.', 'Kuninga kokad hindavad teda kõrgelt.'], 1],
  lossikarp: ['Cyprinus castelli', 'Lossikarp on kuninga lemmikkala: lilla soomus kuldsete äärtega.', ['Lossi kokad hoiavad teda kõige suuremas tiigis.', 'Võib elada üle 100 aasta.', 'Tunneb ära kuninga hääle.', 'Väga uhke ja aeglane.'], 1],
  kroonforell: ['Salmo coronatus', 'Kuninglik forell on kuldsete täppidega forell, kes kasvab ainult lossiaia puhtas allikavees.', ['Tema täpid on kuldsed.', 'Elab ainult allikavees.', 'Väga tugev ujuja.', 'Kuninga pidulaua kala.'], 1],
  kuningasaga: ['Silurus regalis', 'Kuningasäga on tiigi põhjas elav vana hiiglane, kelle vurrud on kullakarva.', ['Legendi järgi elab ta tiigis lossi ehitamisest saati.', 'Tema vurrud on kuldsed.', 'Ta on väga tark ja ettevaatlik.', 'Väga raske ja tugev.'], 1],
  kroonkala: ['Coronichthys regius', 'Kuninga kroonkala on müütiline kala, kelle seljauim on kroonikujuline.', ['Öeldakse, et kes ta püüab, see on kuninga väärt.', 'Tema seljauim särab nagu kroon.', 'Ilmub ainult kuninglikus tiigis.', 'Kõige haruldasem lossiaia kala.'], 1]
};
// Lucide ikoonid (lucide.dev, ISC litsents) – ühtne joonestiil: 24×24, joon 2, ümarad otsad
const LU = {
  'calendar-days': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
  weight: '<circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  'heart-pulse': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  fish: '<path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/><path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4"/><path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98"/>',
  gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  bug: '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  // Lucide'is pole õnge ikooni – joonistatud samas stiilis (24×24, joon 2, ümarad otsad)
  'fishing-rod': '<path d="M3 21 16.5 4.5"/><path d="M16.5 4.5c2.8 1.6 4.5 5 4.5 9.5"/><path d="M21 14v2.5"/><path d="M19.5 19a1.5 1.5 0 0 0 3 0c0-1-1.5-2.5-1.5-2.5S19.5 18 19.5 19Z"/><circle cx="6.5" cy="17" r="2"/><path d="M8 15.5 10 13.5"/>',
  'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  baby: '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  medal: '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/>',
  crown: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'trending-down': '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>'
};
function luc(n, cls) { return `<svg class="lu ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LU[n] || ''}</svg>` }
// vanuseklasside ikoonid ja värvid (noor → iidne)
const KI_AGE = [['baby', '#8fd17a'], ['fish', '#6fd6b0'], ['shield-check', '#5ac8e8'], ['medal', '#f2b552'], ['crown', '#c58cff']];
// värvid tähenduse järgi (sama värv = sama tüüpi info)
const KI_COL = { mõõt: '#7ec8e3', koht: '#8fd17a', aeg: '#a9b8ff', raha: '#ffd27a', tervis: '#ff8fa3', varustus: '#d8b48a', haruldus: null };
const KI_GRP = { joeforell: 'forell', vihmaforell: 'forell', vikerforell: 'forell', meriforell: 'forell', kroonforell: 'forell', angerjas: 'angerjas', kuuangerjas: 'angerjas', raim: 'raim', kilu: 'raim', sarg: 'sarg', roosarg: 'sarg', kuusarg: 'sarg', nokkhaug: 'tuulehaug', ahven: 'ahven', haug: 'haug', koha: 'koha', latikas: 'latikas', lohe: 'lohe' };
function kiQual(sp, w, giant) {
  if (giant || w > sp.max_w * 1.0001) return ['Rekordsuurus', '#ffd27a'];
  const p = Math.log(Math.max(w, sp.min_w) / sp.min_w) / Math.log(Math.max(1.01, sp.max_w / sp.min_w));
  return p >= .85 ? ['Trofeekala', '#ffb347'] : p >= .6 ? ['Suurepärane', '#8fd17a'] : p >= .3 ? ['Hea', '#5ac8e8'] : ['Tavaline', '#c3d3a4'];
}
function kiCell(icon, col, label, val, sub, vcol) {
  return `<div class="ki-c" style="--ic:${col}"><span class="ki-i">${luc(icon)}</span><div><small>${label}</small><b${vcol ? ` style="color:${vcol}"` : ''}>${val}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
}
function kiPanel(r) {
  const sp = FD.sp[r.species]; if (!sp) return '';
  const I = KI[r.species] || [null, sp.descr, []], q = kiQual(sp, +r.weight, r.giant), c0 = (FS.inventory || []).find(x => x.id === r.catch_id), bio = r.age != null ? r : c0 && c0.age != null ? c0 : null;
  const L = bio && bio.len != null ? fLenTxt(+bio.len) : typeof fLen === 'function' ? fLen(sp, +r.weight) : '', ag = fAge(sp, +r.weight, bio), ai = KI_AGE[ag.i] || KI_AGE[2];
  const spot = (FD.spot[r.spot || FV.spot] || {}).name || '', [rn, rc] = RAR2[r.rarity] || RAR2[1];
  const at = c0 && c0.at ? new Date(c0.at) : new Date(), time = at.toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' }), day = at.toLocaleDateString('et-EE', { day: 'numeric', month: 'long' });
  const bait = FV.castBait && FD.bait[FV.castBait] ? FD.bait[FV.castBait].name : '', rod = FV.castRod && FD.rod && FD.rod[FV.castRod] ? FD.rod[FV.castRod].name : '';
  const inInv = !!c0, ws = typeof KTK !== 'undefined' && KTK.d ? KTK.d.proc.ws : 1, lockSmoke = typeof KTK !== 'undefined' && KTK.d && ws < 3;
  const fr = c0 && c0.fresh != null ? Math.round(+c0.fresh * 100) : 100, m = FV.market && FV.market[r.species];
  const cells = [
    kiCell('weight', KI_COL.mõõt, 'Kaal', fKg(+r.weight)),
    L ? kiCell('ruler', KI_COL.mõõt, 'Pikkus', L) : '',
    kiCell('calendar-days', ai[1], 'Vanus', fAgeTxt(ag.years), `<span class="ki-ac" style="color:${ai[1]}">${luc(ai[0])}${ag.name}</span>`, ai[1]),
    kiCell('gem', q[1], 'Kvaliteet', q[0], '', q[1]),
    kiCell('star', rc, 'Haruldus', rn, '', rc),
    kiCell('heart-pulse', KI_COL.tervis, 'Tervis', fr >= 100 ? 'Värske' : fr + '% värske', fr >= 100 ? 'äsja püütud' : 'kala hakkab vananema'),
    kiCell('map-pin', KI_COL.koht, 'Püügikoht', esc(spot)),
    kiCell('clock', KI_COL.aeg, 'Püügiaeg', time, r.best ? 'parim aeg sellele kalale' : day),
    bait ? kiCell('bug', KI_COL.varustus, 'Sööt', esc(bait), r.fav ? 'lemmiksööt' : '') : '',
    rod ? kiCell('fishing-rod', KI_COL.varustus, 'Püügivahend', esc(rod)) : '',
    inInv ? kiCell('coins', KI_COL.raha, 'Väärtus', fmt(estPrice(r.catch_id)) + ' kulda', m ? `<span class="ki-ac">${luc(m.mult >= 1 ? 'trending-up' : 'trending-down')}turg ×${String(m.mult).replace('.', ',')}${m.sold ? ` · täna müüdud ${m.sold}` : ''}</span>` : '', KI_COL.raha) : ''
  ].join('');
  const badges = [r.new_species ? `<span class="ki-b" style="--ic:#8ff0c8">${luc('sparkles')}Esmaleid – uus liik kalaraamatus</span>` : '',
    r.giant ? `<span class="ki-b" style="--ic:#ffd27a">${luc('trophy')}Rekordsuurus</span>` : r.record ? `<span class="ki-b" style="--ic:#ffd27a">${luc('trophy')}Isiklik rekord</span>` : ''].join('');
  const act = (k, ic, t, s, dis) => `<button type="button" class="ki-a" data-ki="${k}" data-arg="${r.catch_id}" ${dis ? 'disabled' : ''}>${luc(ic)}<b>${t}</b><small>${s}</small></button>`;
  return `<div class="ki">
    ${I[3] || badges ? `<div class="ki-h">${I[3] ? `<span class="ki-b" style="--ic:#c58cff">${luc('sparkles')}Muinasjutuline liik</span>` : ''}${badges}</div>` : ''}
    <h4>Sinu saak</h4>
    <div class="ki-g">${cells}</div>
    <h4>${luc('book-open')}Kala tutvustus</h4><p>${esc(I[1] || sp.descr)}</p>
    ${I[2].length ? `<h4>${luc('lightbulb')}Huvitavad faktid</h4><ul>${I[2].map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
    ${inInv ? `<h4>Mida saad saagiga teha?</h4><div class="ki-acts">
      ${act('fil', 'scissors', 'Fileeri', 'Tee kalafileed')}
      ${act('smoke', 'flame', 'Suitsuta', lockSmoke ? 'Avaneb töökoja 3. tasemel' : 'Valmista suitsukala', lockSmoke)}
      ${act('biz', 'coins', 'Müü', 'Paku ettevõtetele')}
      ${act('book', 'book-open', 'Kalaraamat', 'Täienda kollektsiooni')}</div>` : ''}
  </div>`;
}
{
  const _rc = resultCard;
  resultCard = function () {
    const h = _rc.apply(this, arguments), r = FV.result;
    if (!r || r.kind !== 'fish' || !FD.sp[r.species]) return h;
    // asenda lühikirjeldus põhjaliku tutvustusega (kirjeldus on nüüd paneelis)
    const sp = FD.sp[r.species], short = `<p class="lead" style="font-size:12.5px">${esc(sp.descr)}</p>`;
    const bio = r.age != null ? r : (FS.inventory || []).find(x => x.id === r.catch_id), ag = fAge(sp, +r.weight, bio && bio.age != null ? bio : null), ai = KI_AGE[ag.i] || KI_AGE[2];
    // pealkirja all olev rida (vanus, kaal, pikkus, kogemus, lemmiksööt…) on kõik allpool infopaneelis – võtame selle ära
    return h.replace(/<span class="age-chip"[^>]*>[^<]*<\/span>/, '').replace(/<p class="lead">[^<]*kogemust[\s\S]*?<\/p>/, '').replace(short, '').replace(/(<div class="acts">)/, kiPanel(r) + '<div class="ki-more">Veel võimalusi</div>$1');
  };
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ki]'); if (!b || b.disabled) return;
  const k = b.dataset.ki, r = FV.result || {};
  if (k === 'book') { if (typeof fishCard === 'function') fishCard(r.species); return }
  if (k === 'biz') { FV.tab = 'biz'; renderFV(true); return }
  FV.tab = 'kalurimaja';
  if (typeof KTK !== 'undefined') {
    KTK.sub = k === 'fil' ? 'laud' : 'ahi';
    if (k === 'fil' && KTK.sel) KTK.sel[r.species] = 1;
    if (k === 'smoke' && typeof SM !== 'undefined') { SM.grp = KI_GRP[r.species] || 'muu'; SM.special = null; SM.method = 'kuum'; if (typeof smAuto === 'function' && SM.d) smAuto() }
  }
  renderFV(true);
  const fv = document.getElementById('fishView'); if (fv) fv.scrollTop = 0;
});
document.head.insertAdjacentHTML('beforeend', `<style>
.ki{grid-column:1/-1;display:grid;gap:6px;margin-top:4px;padding-top:10px;border-top:1px solid rgba(134,205,224,.16)}
.ki-h{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:-4px}.ki-h i{color:#a9c4c8;font-size:13.5px}
.ki-myth{font-size:12px;font-weight:800;padding:2px 9px;border-radius:999px;background:rgba(197,140,255,.16);color:#e2c8ff}
.ki h4{margin:8px 0 0;font-size:15px}
.ki p{margin:0;line-height:1.55;max-width:70ch}
.ki ul{margin:0;padding-left:20px;line-height:1.6}.ki li::marker{color:var(--rc,#8fd17a)}
.lu{width:18px;height:18px;flex:none;display:inline-block;vertical-align:-3px}
.ki h4{display:flex;align-items:center;gap:7px}.ki h4 .lu{color:#7ec8e3}
.ki-h{gap:8px}.ki-sp{display:inline-flex;align-items:center;gap:6px;color:#a9c4c8}.ki-sp .lu{color:#7ec8e3}
.ki-b{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;padding:3px 10px 3px 7px;border-radius:999px;color:var(--ic);background:color-mix(in srgb,var(--ic) 15%,transparent)}.ki-b .lu{width:15px;height:15px}
.ki-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
@media (max-width:560px){.ki-g{grid-template-columns:repeat(2,minmax(0,1fr))}.ki-c{grid-template-columns:28px minmax(0,1fr);gap:7px;padding:7px 8px}.ki-i{width:28px;height:28px}.ki-i .lu{width:16px;height:16px}.ki-c b{font-size:14.5px}}
.ki-c{display:grid;grid-template-columns:34px minmax(0,1fr);gap:9px;align-items:center;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.22)}
.ki-i{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;color:var(--ic);background:color-mix(in srgb,var(--ic) 14%,transparent)}
.ki-c small{display:block;color:#a9c4c8;font-size:12px}.ki-c b{display:block;font-size:15.5px;line-height:1.25}
.ki-ac{display:inline-flex;align-items:center;gap:4px}.ki-ac .lu{width:14px;height:14px}
.ki-chip{display:inline-flex;align-items:center;gap:5px}.ki-chip .lu{width:14px;height:14px;color:var(--ac)}
.ki-acts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:2px}
.ki-a{display:grid;justify-items:center;gap:3px;padding:12px 8px;border-radius:12px;border:1px solid rgba(134,205,224,.22);background:rgba(255,255,255,.05);color:#e6efec;font:inherit;cursor:pointer;transition:background .15s,border-color .15s}
.ki-a .lu{width:22px;height:22px;color:#7ec8e3;margin-bottom:2px}.ki-a b{font-size:15px}.ki-a small{font-size:12px;color:#a9c4c8}
.ki-a:hover:not(:disabled),.ki-a:focus-visible{background:rgba(70,208,198,.14);border-color:rgba(130,245,230,.6)}
.ki-a:disabled{opacity:.5;cursor:not-allowed}
.ki-more{grid-column:1/-1;font-size:12.5px;color:#a9c4c8;margin-top:6px}
@media (min-width:760px){.ki-acts{grid-template-columns:repeat(4,minmax(0,1fr))}}
</style>`);
