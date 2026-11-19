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
const KI_GRP = { joeforell: 'forell', vihmaforell: 'forell', vikerforell: 'forell', meriforell: 'forell', kroonforell: 'forell', angerjas: 'angerjas', kuuangerjas: 'angerjas', raim: 'raim', kilu: 'raim', sarg: 'sarg', roosarg: 'sarg', kuusarg: 'sarg', nokkhaug: 'tuulehaug', ahven: 'ahven', haug: 'haug', koha: 'koha', latikas: 'latikas', lohe: 'lohe' };
function kiQual(sp, w, giant) {
  if (giant || w > sp.max_w * 1.0001) return ['Rekordsuurus', '#ffd27a'];
  const p = Math.log(Math.max(w, sp.min_w) / sp.min_w) / Math.log(Math.max(1.01, sp.max_w / sp.min_w));
  return p >= .85 ? ['Trofeekala', '#ffb347'] : p >= .6 ? ['Suurepärane', '#8fd17a'] : p >= .3 ? ['Hea', '#5ac8e8'] : ['Tavaline', '#c3d3a4'];
}
function kiValue(r) {
  const c = (FS.inventory || []).find(x => x.id === r.catch_id), m = FV.market && FV.market[r.species], v = estPrice(r.catch_id); if (!c) return '';
  const bits = [m ? `turg täna ×${String(m.mult).replace('.', ',')}${m.mult >= 1.1 ? ' 📈' : m.mult <= .85 ? ' 📉' : ''}` : '', c.fresh != null && +c.fresh < 1 ? `värskus ${Math.round(c.fresh * 100)}%` : '', m && m.sold ? `täna müüdud ${m.sold}` : ''].filter(Boolean);
  return `<div><small>Turuväärtus</small><b style="color:#ffd27a">${fmt(v)} kulda</b>${bits.length ? `<small>${bits.join(' · ')}</small>` : ''}</div>`;
}
function kiPanel(r) {
  const sp = FD.sp[r.species]; if (!sp) return '';
  const I = KI[r.species] || [null, sp.descr, []], q = kiQual(sp, +r.weight, r.giant), L = typeof fLen === 'function' ? fLen(sp, +r.weight) : '';
  const spot = (FD.spot[r.spot || FV.spot] || {}).name || '';
  const inInv = (FS.inventory || []).some(x => x.id === r.catch_id), ws = typeof KTK !== 'undefined' && KTK.d ? KTK.d.proc.ws : 1;
  const lockSmoke = typeof KTK !== 'undefined' && KTK.d && ws < 3;
  const act = (k, ic, t, s, dis) => `<button type="button" class="ki-a" data-ki="${k}" data-arg="${r.catch_id}" ${dis ? 'disabled' : ''}><span>${ic}</span><b>${t}</b><small>${s}</small></button>`;
  return `<div class="ki">
    <div class="ki-h">${I[0] ? `<i>${esc(I[0])}</i>` : ''}${I[3] ? '<span class="ki-myth">✨ Muinasjutuline liik</span>' : ''}</div>
    <h4>Sinu saak</h4>
    <div class="ki-g"><div><small>Kaal</small><b>${fKg(+r.weight)}</b></div>${L ? `<div><small>Pikkus</small><b>${L}</b></div>` : ''}<div><small>Püügikoht</small><b>${esc(spot)}</b></div><div><small>Kvaliteet</small><b style="color:${q[1]}">${q[0]}</b></div>${inInv ? kiValue(r) : ''}</div>
    <h4>📖 Kala tutvustus</h4><p>${esc(I[1] || sp.descr)}</p>
    ${I[2].length ? `<h4>🌿 Huvitavad faktid</h4><ul>${I[2].map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
    ${inInv ? `<h4>Mida saad saagiga teha?</h4><div class="ki-acts">
      ${act('fil', '🔪', 'Fileeri', 'Tee kalafileed')}
      ${act('smoke', '🔥', 'Suitsuta', lockSmoke ? 'Avaneb töökoja 3. tasemel' : 'Valmista suitsukala', lockSmoke)}
      ${act('biz', '🤝', 'Müü', 'Paku ettevõtetele')}
      ${act('book', '📘', 'Kalaraamat', 'Vaata kollektsiooni')}</div>` : ''}
  </div>`;
}
{
  const _rc = resultCard;
  resultCard = function () {
    const h = _rc.apply(this, arguments), r = FV.result;
    if (!r || r.kind !== 'fish' || !FD.sp[r.species]) return h;
    // asenda lühikirjeldus põhjaliku tutvustusega (kirjeldus on nüüd paneelis)
    const sp = FD.sp[r.species], short = `<p class="lead" style="font-size:12.5px">${esc(sp.descr)}</p>`;
    return h.replace(short, '').replace(/(<div class="acts">)/, kiPanel(r) + '<div class="ki-more">Veel võimalusi</div>$1');
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
.ki-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px}
.ki-g div{padding:8px 11px;border-radius:10px;background:rgba(0,0,0,.22)}.ki-g small{display:block;color:#a9c4c8;font-size:12px}.ki-g b{font-size:16px}
.ki-acts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:2px}
.ki-a{display:grid;justify-items:center;gap:2px;padding:12px 8px;border-radius:12px;border:1px solid rgba(134,205,224,.22);background:rgba(255,255,255,.05);color:#e6efec;font:inherit;cursor:pointer;transition:background .15s,border-color .15s}
.ki-a span{font-size:22px;line-height:1}.ki-a b{font-size:15px}.ki-a small{font-size:12px;color:#a9c4c8}
.ki-a:hover:not(:disabled),.ki-a:focus-visible{background:rgba(70,208,198,.14);border-color:rgba(130,245,230,.6)}
.ki-a:disabled{opacity:.5;cursor:not-allowed}
.ki-more{grid-column:1/-1;font-size:12.5px;color:#a9c4c8;margin-top:6px}
@media (min-width:760px){.ki-acts{grid-template-columns:repeat(4,minmax(0,1fr))}}
</style>`);
