# Worklog

---
Task ID: 1
Agent: main (Z.ai)
Task: Prebaciti Word dokument "rjesenja tabela-MM (1).docx" (268 kviz pitanja iz matematike) u LaTeX + PDF, plus JSON za kviz web aplikaciju.

Work Log:
- Učitan pdf skill; Academic ruta (LaTeX/Tectonic); pročitani briefs/academic.md, configs/fonts.md, typesetting/cover.md (Template 04), typesetting/overflow.md
- AskUserQuestion: korisnik izabrao kviz format, vraćanje formula iz originala, slike uz pitanja, rješenja uz svako pitanje, ispravke grešaka, JSON + PDF, naslovna + podjele, zeleni tačni odgovori
- Ekstrakcija: pandoc → grid tabela (poziciono parsiranje, scripts/parse_quiz.py), OMML formule → LaTeX, --extract-media (87 slika)
- Čišćenje (scripts/build_data.py): unicode superscripts → math, math-italic slova → ASCII, \bullet→\cdot, stepen^{...}, ${^\circ}$→°, dijakritike u math→tekst, grčka slova→$\alpha$..., merge susjednih math segmenata, icomma decimalni zarezi
- ~110 per-question ispravki (scripts/build_data.py OV): vraćene sve izgubljene formule; uklonjen duplikat #16 (=#15); ispravljeni tačni odgovori (#159 N(-3,0), #167 D, #230 D); ispravljene greške u rješenjima (#92, #131, #138, #141, #184, #129 usklađeno sa postupkom); čiste tabele NZS/NZD; sistem jednačina preko \begin{cases}; tabela za #185
- Re-lettering opcija A-D, prazne opcije odbačene (166/181/182 → 2 opcije; 196/222/256 → 3 opcije), napomene o slikama koje nisu postojale u originalu (#241)
- LaTeX generator (scripts/gen_tex.py): article 10pt, fontspec lmroman10 (file-based), amsmath, icomma, enumitem custom liste, needspace protiv orphana, hyperlink TOC+bookmarks, 7 oblasti, 267 pitanja, 91 \includegraphics (originalne grafike), zeleni tačni odgovori s ✓
- Kompajlacija: pdf.py convert.latex (Tectonic) — 0 Overfull/Underfull boxova
- Naslovna: Template 04 (Midnight Blue), cover_validate.js + poster_validate.py PASS, html2poster.js render, pypdf append merge (čuva linkove), outline rekonstruisan preko pymupdf (+1 page shift)
- QA: pdf_qa (samo heuristička upozorenja: formula-overflow median false-positive kod kratkih linija kviz formata; margin symmetry false-positive na stranicama sa slikama; TOC linkovi su kind=4 named — funkcionalni, checker traži kind=1), font.check 0 problema, toc.check PASS, pages.clean: nema praznih stranica, meta.set Title/Author/Creator/Subject/Keywords
- Ispravljene 3 ciklusa bugova: q→question mapping u override-ima, konv_sup core/sup split, > blockquote regex koji je jeo ">" u matematici, 5 slika vraćenih u override-ima (110, 242, 247, 258, 261), margin overflow "Rješenje:" labela, TOC-first redoslijed, zadnja strana kompletno pitanje
- JSON export (scripts/export_json.py): 267 pitanja, id/original_no/topic/question/images/options/correct_letter/correct_index/solution; math u LaTeX zapisu (KaTeX/MathJax ready), slike kao media/imageN.ext

Stage Summary:
- Deliverables u /home/z/my-project/download/:
  - kviz-matematika.pdf (56 strana, 1.9 MB: naslovna + TOC + intro + 267 pitanja + 91 slika)
  - pitanja.json (267 pitanja, strukturirano za web kviz)
  - kviz-matematika-latex.zip (kviz-matematika.tex + media/ 87 slika + pitanja.json)
- Ključne odluke: originalne slike ugrađene u PDF (korisnik bira napomenu, ali slike postoje u docx — ugrađene uz napomenu samo gdje ne postoje); pitanja renumerisana 1-267 (duplikat uklonjen), originalni brojevi u JSON original_no
- Build artefakti: /home/z/my-project/work/quiz/ (build/ kviz.tex, media/, kviz-final.pdf, cover.html)
- Skripte: /home/z/my-project/scripts/ (parse_quiz.py, build_data.py, gen_tex.py, export_json.py, merge_cover.py, check_lost_images.py, scan_anomalies.py, show_final.py, dump_review.py, show_quiz.py)

---
Task ID: 2
Agent: main (Z.ai)
Task: Web aplikacija "Kviz Matura" — banka pitanja iz 3 predmeta (matematika/bosanski/engleski), 2 moda igranja, email auth, zaštita od skrejpanja, responzivan dizajn.

Work Log:
- fullstack-dev skill: Next.js 16 + Tailwind 4 + shadcn/ui + Prisma/SQLite; instalirano bcryptjs, jose, katex, server-only
- Parsiranje Excela (scripts/parse_excel_bank.py): BosanskiJezik → 150 pitanja, engleski jezik → 75; teme+nivoi dodijeljeni po BOS-STAT/ENG-STAT rasporedima (književnost/jezik/pravopis/kultura/medijska ↔ vokabular/gramatika/čitanje; 40/40/20 nivoi); engleski passage razdvojen na "QUESTION:" markeru
- Prisma šema: User, Question (correctIndex server-only), QuizSession (questionIdsJson, currentIndex, status), QuizAnswer; db:push + seed 492 pitanja (267 mat iz pitanja.json + 150 + 75); matematika nivoi po 40/40/20 redoslijedu; slike u public/quiz-media/ (87 fajlova)
- Zaštita od skrejpanja: correctIndex NIKAD u payloadu prije odgovora; pitanja jedno po jedno kroz sesiju (current/answer endpointi sa currentIndex validacijom); učenje: otkrivanje tek nakon odgovora; test: bez ikakvog otkrivanja do finish-a; rate limit (60/min po korisniku na kviz, 10/min po IP na auth); JWT httpOnly cookie (jose HS256, AUTH_SECRET u .env); bcrypt hash lozinki; zaštita od duplog odgovaranja
- API: auth/register|login|logout|me, quiz/start (raspored pitanja 4/4/2 ili 3/4/3 po nivoima za test; proporcionalno za učenje; opcioni topic filter), current, answer, finish (kompletan pregled nakon završetka), history, meta (samo brojevi)
- UI (SPA u page.tsx, samo / ruta): Landing (hero sa gradijentima, kartice predmeta, kartice modova), AuthView (prijava/registracija tabovi), Dashboard (kartice predmeta + setup dialog: mod/tema/broj pitanja + historija), QuizPlayer (progress bar, passage box "Tekst za čitanje", KaTeX formule, tastatura 1-4/A-D+Enter, feedback banner + rješenje kartica u modu učenja, exit dialog), Results (animirani score ring, poruka po postotku, accordion pregled — promašeni auto-otvoreni, rješenja + slike), StatsView (prosjeci po predmetu + tabela testova)
- Dizajn: Sora + Inter fontovi, krem/smaragdna paleta (bez indigo/plave), jantar akcent, subjekt boje (violet/emerald/amber), svijetla+tamna tema (next-themes), framer-motion animacije, sticky footer, responzivno mobile-first
- Bugfix: turbopack držao stari globals.css cache → restart dev servera + rm -rf .next
- Browser verifikacija (agent-browser): registracija → dashboard → učenje matematike (KaTeX 15/25 frakcije, rješenje 15:5/25:5=3/5, feedback tačno/netačno) → rezultati (2/10, pregled, promašeni auto-otvoreni) → test engleskog 10 pitanja → statistika → mobile iPhone 14 (dashboard+kviz) → tamna tema → čitanje passage box → logout/login; API: 401 bez prijave, 0 curenja odgovora u payloadima; lint čist; dev.log bez grešaka

Stage Summary:
- Aplikacija radi na portu 3000 (SPA): 492 pitanja u SQLite (db/custom.db), seed skripta scripts/seed.ts za reset
- Ključne odluke: Excel "Matematika" sheet ignorisan (nepotpun, 69/150 redova) — matematika iz JSON-a (267 pitanja + rješenja + slike); test = 10 pitanja po oficijalnoj strukturi ispita iz STAT sheetova
- Sigurnosna arhitektura: tačni odgovori napuštaju server samo (a) u modu učenja za već odgovoreno pitanje, (b) u pregledu nakon završetka sesije — masovno skrejpanje nemoguće bez sesije + rate limita

---
Task ID: 3
Agent: main (Z.ai)
Task: Pripremiti aplikaciju za preuzimanje + hosting vodič (korisnik pita: kako skinuti, kako hostovati, koja baza, gdje se šta čuva).

Work Log:
- Seed skripta učinjena prenosivom: paths /home/z/my-project/... → relativno data/ (scripts/seed.ts), dodata path uvoz
- Kreiran data/ folder: matematika.json (267) + bosanski.json (150) + engleski.json (75) — prekopirano iz download/ i work/quiz/bank/
- Verifikacija: bun scripts/seed.ts → 492/492 (BOSANSKI=150, ENGLESKI=75, MATEMATIKA=267)
- Kreiran .env.example (DATABASE_URL + AUTH_SECRET uputstvo), db/.gitkeep
- Napisan VODIC.md (bosanski): tabela "gdje se šta čuva", lokalno pokretanje, hosting opcije A-D (VPS+Nginx+pm2+certbot sa kompletnim konfiguracijama, Railway volume, Render, demo), napomena da Vercel ne ide sa SQLite, zaštita od skrejpanja, dodavanje pitanja, struktura projekta
- README.md prepravljen (upućuje na VODIC.md)
- ZIP: download/kviz-matura-aplikacija.zip (2.4 MB, 228 fajlova) — bez node_modules/.next/.env/custom.db/logova; sadrži src, prisma, public/quiz-media (87 slika), data, scripts/seed.ts, VODIC, README, .env.example, konfiguracija

Stage Summary:
- Korisnik može preuzeti kviz-matura-aplikacija.zip; pokretanje: npm install → cp .env.example .env → db:push → seed → dev/start
- Baza: SQLite u db/custom.db; backup = kopija tog fajla
