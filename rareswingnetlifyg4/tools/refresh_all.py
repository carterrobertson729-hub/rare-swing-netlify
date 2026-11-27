# Daily refresh for Rare Swing: brings the answer lists up to date from MLB's official data (statsapi.mlb.com).
# usage: python3 refresh_all.py INDIR OUTDIR     (INDIR holds rosters.js overrides.js seasons.js famous.js data.js extra.js extra2.js)
# It only ADDS: new players on 40-man rosters, this season's team rosters, new award winners, Hall of Famers, milestone
# reachers, no-hitters, draft picks, champions and managers, and newly seen players born abroad. Never removes anything.
import sys, os, re, json, unicodedata, urllib.request, time, datetime, concurrent.futures as cf
INDIR, OUTDIR = sys.argv[1:3]
os.makedirs(OUTDIR, exist_ok=True)
B = 'https://statsapi.mlb.com/api/v1'
def get(u, tries=4):
    for i in range(tries):
        try: return json.load(urllib.request.urlopen(u, timeout=120))
        except Exception:
            if i == tries - 1: return None
            time.sleep(2 * (i + 1))
def norm(s):
    s = unicodedata.normalize('NFD', s); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    s = re.sub(r"[.'’]", '', s); s = re.sub(r'[^a-z0-9]+', ' ', s).strip()
    return ' '.join(t for t in s.split(' ') if t and t not in ('jr', 'sr', 'ii', 'iii', 'iv'))
def read(n): return open(os.path.join(INDIR, n), encoding='utf-8').read()
def jget(src, name, tail=r';\n'):
    m = re.search(r'const ' + name + r' = (\{.*?\}|\[.*?\])' + tail, src, re.S)
    return m, json.loads(m.group(1))
Y = datetime.date.today().year
# ---- current files
ros_src = read('rosters.js'); m_ros, ROS = jget(ros_src, 'ROSTERS')
ovr_src = read('overrides.js'); m_ovr, OVR = jget(ovr_src, 'QUESTION_OVERRIDES')
sea_src = read('seasons.js'); m_sp, SP = jget(sea_src, 'SEASON_PLAYERS'); m_se, SE = jget(sea_src, 'SEASONS')
fam = json.loads(re.search(r'const FAME = (\{.*?\});', read('famous.js'), re.S).group(1))
dat_src = read('data.js')
ex1_src = read('extra.js'); m_e1, EX1 = jget(ex1_src, 'EXTRA_Q')
ex2_src = read('extra2.js'); m_e2, EX2 = jget(ex2_src, 'EXTRA_Q2')
glob = {}
for raw in ROS.values():
    for it in raw.split(';'):
        nm, _, t = it.split('=')[0].rpartition(':')
        k = norm(nm)
        if k and (k not in glob or int(t) < glob[k]): glob[k] = int(t)
def tier_for(name, default):
    k = norm(name)
    if fam.get(k, 0) >= 1600: return 1
    return glob.get(k, default)
report = {}
def note(what, names):
    if names: report.setdefault(what, []).extend(names)
# ---- MLB data
teams = get(f'{B}/teams?sportId=1&season={Y}')['teams']
tid = {t['abbreviation']: t['id'] for t in teams}
def awards(aid, y): return [r for r in (get(f'{B}/awards/{aid}/recipients?season={y}') or {}).get('awards', []) if r.get('player')]
# ============ 1. 40-man rosters ============
def r40(t): return t['abbreviation'], [x['person']['fullName'] for x in (get(f"{B}/teams/{t['id']}/roster?rosterType=40Man") or {}).get('roster', [])]
with cf.ThreadPoolExecutor(6) as ex: R40 = dict(ex.map(r40, teams))
for abbr, names in R40.items():
    if abbr not in ROS: continue
    have = {norm(i.split('=')[0].rpartition(':')[0]) for i in ROS[abbr].split(';')}
    new = [n for n in names if norm(n) not in have and not have.add(norm(n))]
    if new:
        ROS[abbr] += ';' + ';'.join(f'{n}:{tier_for(n, 5)}' for n in new); note('40-man roster additions', [f'{n} ({abbr})' for n in new])
# ============ 2. this season's roster for each team (the "Name a player on the {year} ..." data) ============
stats_y = {}
for grp in ('hitting', 'pitching'):
    d = get(f'{B}/stats?stats=season&season={Y}&group={grp}&gameType=R&playerPool=ALL&sportId=1&limit=5000')
    for s in ((d or {}).get('stats') or [{}])[0].get('splits', []):
        st = s['stat']; r = stats_y.setdefault(s['player']['id'], {'name': s['player']['fullName']})
        if grp == 'hitting': r.update(hr=int(st.get('homeRuns') or 0), sb=int(st.get('stolenBases') or 0))
        else: r.update(w=int(st.get('wins') or 0))
sp_index = {norm(e.rpartition(':')[0]): i for i, e in enumerate(SP)}
def sp_id(name):
    k = norm(name)
    if k not in sp_index: SP.append(f'{name}:{tier_for(name, 5)}'); sp_index[k] = len(SP) - 1
    return sp_index[k]
if stats_y:
    for t in teams:
        ab = t['abbreviation']
        if ab not in ROS: continue
        ids = {sp_id(x['person']['fullName']) for x in (get(f"{B}/teams/{t['id']}/roster?rosterType=fullSeason&season={Y}") or {}).get('roster', []) if x['person']['id'] in stats_y}
        key = f'{ab}-{Y}'; old = SE.get(key, '|'); nm, _, oi = old.partition('|'); cur = {int(x) for x in oi.split(',') if x}
        if ids - cur and len(ids | cur) >= 18:
            SE[key] = nm + '|' + ','.join(map(str, sorted(ids | cur))); note(f'{Y} season rosters', [f'{len(ids - cur)} more on {ab}'])
# ============ 3. add names to question lists ============
def add(text, names, default=4):
    if text not in OVR: return
    have = {norm(i.split('=')[0].rpartition(':')[0]) for i in OVR[text].split(';')}
    new = []
    for n in names:
        k = norm(n)
        if k and k not in have: have.add(k); new.append(n)
    if new:
        OVR[text] += ';' + ';'.join(f'{n}:{tier_for(n, default)}' for n in new); note(text, new)
for y in (Y - 1, Y):
    pos = {}
    add('Name a Cy Young Award winner', [r['player']['nameFirstLast'] for a in ('ALCY', 'NLCY') for r in awards(a, y)])
    add('Name a player who has won an MVP award since 2010', [r['player']['nameFirstLast'] for a in ('ALMVP', 'NLMVP') for r in awards(a, y)])
    add('Name a Rookie of the Year winner since 2010', [r['player']['nameFirstLast'] for a in ('ALROY', 'NLROY') for r in awards(a, y)])
    add('Name a player who won a World Series MVP', [r['player']['nameFirstLast'] for r in awards('WSMVP', y)])
    add('Name a Home Run Derby winner', [r['player']['nameFirstLast'] for r in awards('HRDERBYWIN', y)])
    add('Name an All-Star Game MVP', [r['player']['nameFirstLast'] for r in awards('ASMVP', y)])
    gg = [r['player'] for a in ('ALGG', 'NLGG') for r in awards(a, y)]
    for text, posset in (('Name a shortstop who has won a Gold Glove', ('SS',)), ('Name a first baseman who has won a Gold Glove', ('1B',)), ('Name a second baseman who has won a Gold Glove', ('2B',)), ('Name a third baseman who has won a Gold Glove', ('3B',)), ('Name a catcher who has won a Gold Glove', ('C',)), ('Name a pitcher who has won a Gold Glove', ('P',)), ('Name an outfielder who has won a Gold Glove', ('LF', 'CF', 'RF', 'OF'))):
        add(text, [p['nameFirstLast'] for p in gg if (p.get('primaryPosition') or {}).get('abbreviation') in posset])
    hof = awards('MLBHOF', y)
    P = {'P': 'pitcher', 'C': 'catcher', '1B': 'first baseman', '2B': 'second baseman', '3B': 'third baseman', 'SS': 'shortstop', 'LF': 'outfielder', 'CF': 'outfielder', 'RF': 'outfielder', 'OF': 'outfielder'}
    for r in hof:
        pp = (r['player'].get('primaryPosition') or {}).get('abbreviation')
        if pp in P and r['player']['nameFirstLast'] != 'Jim Leyland': add(f'Name a Hall of Fame {P[pp]}', [r['player']['nameFirstLast']], 2)
    d = get(f'{B}/draft/{y}?limit=1')
    try: add('Name a player picked first overall in the MLB Draft', [d['drafts']['rounds'][0]['picks'][0]['person']['fullName']])
    except Exception: pass
    for lg in (103, 104):
        d = get(f'{B}/stats?stats=season&season={y}&group=hitting&gameType=R&playerPool=QUALIFIED&sportId=1&leagueIds={lg}&sortStat=battingAverage&order=desc&limit=1')
        try: add('Name a player who has won a batting title since 2000', [d['stats'][0]['splits'][0]['player']['fullName']])
        except Exception: pass
    s = get(f'{B}/schedule?sportId=1&season={y}&gameType=W'); games = [g for dt in (s or {}).get('dates', []) for g in dt['games'] if g['status']['abstractGameState'] == 'Final']
    if games and games[-1]['status'].get('detailedState') == 'Final':
        last = games[-1]; w = last['teams']['home'] if last['teams']['home'].get('isWinner') else last['teams']['away']
        c = get(f"{B}/teams/{w['team']['id']}/coaches?season={y}")
        mgr = next((r['person']['fullName'] for r in (c or {}).get('roster', []) if r.get('jobId') == 'MNGR'), None)
        if mgr: add('Name a manager who has won a World Series', [mgr.replace(' Jr.', '')], 3)
        # a first-time champion becomes a valid answer on the "team that has won the World Series" question
        nm = w['team']['name']
        mm = re.search(re.escape(nm) + r':0(=[^;"]*)?', dat_src)
        if mm: dat_src = dat_src[:mm.start()] + nm + ':3' + (mm.group(1) or '') + dat_src[mm.end():]; note('World Series winners', [nm])
# season-stat milestone lists
mx = list(stats_y.values())
add('Name a player who hit 50 or more home runs in a season', [r['name'] for r in mx if r.get('hr', 0) >= 50], 3)
add('Name a player with a 40-home-run, 40-steal season', [r['name'] for r in mx if r.get('hr', 0) >= 40 and r.get('sb', 0) >= 40], 3)
add('Name a player with a 30-homer, 30-steal season', [r['name'] for r in mx if r.get('hr', 0) >= 30 and r.get('sb', 0) >= 30], 3)
add('Name a pitcher who has won 20 games in a season since 2000', [r['name'] for r in mx if r.get('w', 0) >= 20], 3)
# career milestones: the top of MLB's career leaderboards
for text, grp, sort, key, thr in (('Name a player with 500 or more career home runs', 'hitting', 'homeRuns', 'homeRuns', 500), ('Name a player with 3,000 career hits', 'hitting', 'hits', 'hits', 3000), ('Name a pitcher with 300 career wins', 'pitching', 'wins', 'wins', 300), ('Name a pitcher with 3,000 career strikeouts', 'pitching', 'strikeOuts', 'strikeOuts', 3000), ('Name a closer with 300 or more career saves', 'pitching', 'saves', 'saves', 300)):
    d = get(f'{B}/stats?stats=career&group={grp}&sortStat={sort}&order=desc&playerPool=ALL&sportId=1&limit=80')
    try: add(text, [s['player']['fullName'].replace(' Jr.', '') if s['player']['fullName'].startswith('Nolan Ryan') else s['player']['fullName'] for s in d['stats'][0]['splits'] if int(s['stat'][key]) >= thr], 2)
    except Exception: pass
# no-hitters this season
sch = get(f'{B}/schedule?sportId=1&season={Y}&gameType=R&hydrate=linescore')
nh = []
for dt in (sch or {}).get('dates', []):
    for g in dt['games']:
        if g['status']['abstractGameState'] != 'Final': continue
        ls = g.get('linescore', {}); inn = len(ls.get('innings', []))
        for side, other in (('home', 'away'), ('away', 'home')):
            if inn >= 9 and ls.get('teams', {}).get(other, {}).get('hits') == 0: nh.append((g['gamePk'], side))
for pk, side in nh:
    b = get(f'{B}/game/{pk}/boxscore')
    if b: t = b['teams'][side]; add('Name a pitcher who has thrown a no-hitter since 2010', [t['players'][f'ID{p}']['person']['fullName'] for p in t['pitchers']], 3)
# players born abroad who are new to the lists
CT = {'Name a player born in the Dominican Republic': 'Dominican Republic', 'Name a player born in Japan who played in MLB': 'Japan', 'Name a player born in Cuba': 'Cuba', 'Name a player born in Venezuela': 'Venezuela', 'Name a player born in Puerto Rico': 'Puerto Rico', 'Name a player born in Mexico': 'Mexico', 'Name a player born in Canada': 'Canada', 'Name a player born in South Korea': 'South Korea'}
known = set()
for t in CT:
    if t in OVR: known |= {norm(i.split('=')[0].rpartition(':')[0]) for i in OVR[t].split(';')}
cand = {}
for abbr, names in R40.items():
    for n in names: cand[norm(n)] = n
ids = []
for t in teams:
    for x in (get(f"{B}/teams/{t['id']}/roster?rosterType=40Man") or {}).get('roster', []):
        if norm(x['person']['fullName']) not in known: ids.append(x['person']['id'])
ids = sorted(set(ids)); born = {}
for i in range(0, len(ids), 150):
    for p in (get(f"{B}/people?personIds={','.join(map(str, ids[i:i + 150]))}") or {}).get('people', []):
        born.setdefault(p.get('birthCountry'), []).append(p['fullName'])
for text, country in CT.items(): add(text, born.get(country, []) + (born.get('CAN', []) if country == 'Canada' else []) + (born.get('D.R.', []) if country == 'Dominican Republic' else []) + (born.get('P.R.', []) if country == 'Puerto Rico' else []), 5)

# ============ 4. the extra question files (extra.js and extra2.js) ============
QIDX = {}
for lst in (EX1, EX2):
    for e in lst: QIDX[e[0]] = e
def q_names(text): return {norm(i.split('=')[0].rpartition(':')[0]) for i in QIDX[text][2].split(';')} if text in QIDX and not QIDX[text][2].startswith('@') else set()
def qadd(text, names, default=5, create=None):
    """add names to a question (create it in file EX1/EX2 when `create` = (file list, difficulty, minimum names) and it has enough names)"""
    names = [n for n in dict.fromkeys(names) if norm(n)]
    if text in QIDX:
        e = QIDX[text]
        if e[2].startswith('@'): return
        have = q_names(text); new = []
        for n in names:
            if norm(n) not in have: have.add(norm(n)); new.append(n)
        if new: e[2] += ';' + ';'.join(f'{n}:{tier_for(n, default)}' for n in new); note('extra questions: ' + text[:60], new)
    elif create and len({norm(n) for n in names}) >= create[2]:
        e = [text, create[1], ';'.join(f'{n}:{tier_for(n, default)}' for n in names)]; create[0].append(e); QIDX[text] = e; note('new question: ' + text[:70], [f'{len(names)} answers'])
yrs = (Y - 1, Y)
# people facts (birthplace, debut, height) for everyone on a 40-man roster or who played this season
pid_set = set(stats_y.keys())
for t in teams:
    for x in (get(f"{B}/teams/{t['id']}/roster?rosterType=40Man") or {}).get('roster', []): pid_set.add(x['person']['id'])
people_rows = []
ids2 = sorted(pid_set)
for i in range(0, len(ids2), 150):
    for p in (get(f"{B}/people?personIds={','.join(map(str, ids2[i:i + 150]))}") or {}).get('people', []):
        people_rows.append({'name': p['fullName'], 'city': p.get('birthCity'), 'state': p.get('birthStateProvince'), 'country': p.get('birthCountry'), 'height': p.get('height'), 'debut': p.get('mlbDebutDate')})
STATE_NAMES = {t.rpartition('born in ')[2] for t in QIDX if t.startswith('Name a player born in ') and ',' not in t}
for p in people_rows:
    if p['country'] == 'USA' and p['state'] and f"Name a player born in {p['state']}" in QIDX: qadd(f"Name a player born in {p['state']}", [p['name']])
    elif p['country'] and p['country'] != 'USA': qadd('Name a player born in ' + p['country'].replace('Curacao', 'Curaçao'), [p['name']])
    if p['city'] and (p['state'] or p['country']):
        place = p['state'] if p['country'] == 'USA' and p['state'] else p['country']
        qadd(f"Name a player born in {p['city']}, {place}", [p['name']])
    if (p['debut'] or '')[:4].isdigit(): pass
bydebut = {}
for p in people_rows:
    if (p['debut'] or '')[:4].isdigit(): bydebut.setdefault(int(p['debut'][:4]), []).append(p['name'])
for y, names in bydebut.items():
    if y >= 1950: qadd(f'Name a player who made his MLB debut in {y}', names, 5, (EX2, 'hard', 40))
def inches(h):
    m = re.match(r"(\d+)'\s*(\d+)", h or ''); return int(m.group(1)) * 12 + int(m.group(2)) if m else None
qadd('Name a player who is 6 feet 6 inches or taller', [p['name'] for p in people_rows if (inches(p['height']) or 0) >= 78])
qadd('Name a player who is 5 feet 8 inches or shorter', [p['name'] for p in people_rows if 0 < (inches(p['height']) or 99) <= 68])
# awards by team: any award winner who is on a team's list belongs on that team's award question (this also catches trades and signings)
team_text_name = {}
for t in teams:
    team_text_name[t['abbreviation']] = t.get('teamName') or t['name']
AW = (('a Hall of Famer', 'MLBHOF', ()), ('an MVP winner', None, ('ALMVP', 'NLMVP')), ('a Cy Young winner', None, ('ALCY', 'NLCY')), ('an All-Star', None, ('ALAS', 'NLAS')), ('a Gold Glove winner', None, ('ALGG', 'NLGG')), ('a Rookie of the Year', None, ('ALROY', 'NLROY')))
api_w = {}
for label, single, ids in AW:
    names = set()
    for y in yrs:
        for a in ([single] if single else ids): names |= {r['player']['nameFirstLast'] for r in awards(a, y)}
    api_w[label] = names
for label, single, ids in AW:
    team_qs = {ab: f'Name {label} who played for the ' for ab in ROS}
    texts = {tx: e for tx, e in QIDX.items() if tx.startswith(f'Name {label} who played for the ')}
    winners = set(api_w[label])
    for tx in texts: winners |= {n for n in (i.split('=')[0].rpartition(':')[0] for i in QIDX[tx][2].split(';'))}
    wn = {norm(n): n for n in winners}
    for tx in texts:
        ab = next((a for a, nm in sorted(team_text_name.items(), key=lambda kv: -len(kv[1])) if tx.endswith(nm) or nm in tx), None)
        if ab and ab in ROS:
            roster = {norm(i.split('=')[0].rpartition(':')[0]): i.split('=')[0].rpartition(':')[0] for i in ROS[ab].split(';')}
            qadd(tx, [roster[k] for k in wn if k in roster], 4)
# award decades and the rest of the by-year lists
DEC = (('an MVP winner', ('ALMVP', 'NLMVP')), ('a Cy Young winner', ('ALCY', 'NLCY')), ('a Rookie of the Year', ('ALROY', 'NLROY')))
for y in yrs:
    d0 = y // 10 * 10
    for label, ids in DEC: qadd(f'Name {label} from the {d0}s', [r['player']['nameFirstLast'] for a in ids for r in awards(a, y)], 4)
    qadd(f'Name a player who made an All-Star team in the {d0}s', [r['player']['nameFirstLast'] for a in ('ALAS', 'NLAS') for r in awards(a, y)], 4)
    asy = [r['player']['nameFirstLast'] for a in ('ALAS', 'NLAS') for r in awards(a, y)]
    qadd(f'Name a player who made the {y} All-Star team', asy, 4, (EX2, 'hard', 30))
    ss = [r['player'] for a in ('ALSS', 'NLSS') for r in awards(a, y)]
    qadd('Name a Silver Slugger winner', [p['nameFirstLast'] for p in ss], 4)
    for label, poss in (('catcher', ('C',)), ('first baseman', ('1B',)), ('second baseman', ('2B',)), ('third baseman', ('3B',)), ('shortstop', ('SS',)), ('outfielder', ('OF', 'LF', 'CF', 'RF'))):
        qadd(f'Name a {label} who has won a Silver Slugger', [p['nameFirstLast'] for p in ss if (p.get('primaryPosition') or {}).get('abbreviation') in poss], 4)
    dd = get(f'{B}/draft/{y}?round=1&limit=60'); rr = ((dd or {}).get('drafts') or {}).get('rounds') or []
    if rr: qadd(f'Name a player picked in the first round of the {y} MLB Draft', [p['person']['fullName'] for p in rr[0]['picks'] if p.get('person')], 5, (EX2, 'hard', 15))
# league leaders (a season counts once it has finished) and this season's great performances
for y in yrs:
    for text, grp, sort, field in (('Name a player who led his league in home runs', 'hitting', 'homeRuns', 'homeRuns'), ('Name a player who led his league in stolen bases', 'hitting', 'stolenBases', 'stolenBases'), ('Name a pitcher who led his league in strikeouts', 'pitching', 'strikeOuts', 'strikeOuts'), ('Name a pitcher who led his league in saves', 'pitching', 'saves', 'saves'), ('Name a pitcher who led his league in wins', 'pitching', 'wins', 'wins')):
        names = []
        for lg in (103, 104):
            d = get(f'{B}/stats?stats=season&season={y}&group={grp}&gameType=R&playerPool=ALL&sportId=1&leagueIds={lg}&sortStat={sort}&order=desc&limit=5')
            sp = ((d or {}).get('stats') or [{}])[0].get('splits', [])
            if sp: top = int(sp[0]['stat'][field]); names += [s['player']['fullName'] for s in sp if int(s['stat'][field]) == top]
        qadd(text, names, 3)
sy = {}
for y in yrs:
    rows = {}
    for grp in ('hitting', 'pitching'):
        d = get(f'{B}/stats?stats=season&season={y}&group={grp}&gameType=R&playerPool=ALL&sportId=1&limit=5000')
        for s in ((d or {}).get('stats') or [{}])[0].get('splits', []):
            st = s['stat']; r = rows.setdefault(s['player']['id'], {'name': s['player']['fullName']})
            if grp == 'hitting': r.update(hr=int(st.get('homeRuns') or 0), sb=int(st.get('stolenBases') or 0), ab=int(st.get('atBats') or 0), h=int(st.get('hits') or 0))
            else: r.update(w=int(st.get('wins') or 0), so=int(st.get('strikeOuts') or 0))
    sy[y] = list(rows.values())
for y, rr_ in sy.items():
    qadd(f'Name a player who hit 30 or more home runs in {y}', [r['name'] for r in rr_ if r.get('hr', 0) >= 30], 3, (EX2, 'medium', 12))
    qadd(f'Name a pitcher who won 15 or more games in {y}', [r['name'] for r in rr_ if r.get('w', 0) >= 15], 3, (EX2, 'medium', 8))
    qadd(f'Name a player who hit .300 or better in {y} (400 or more at-bats)', [r['name'] for r in rr_ if r.get('ab', 0) >= 400 and r.get('h', 0) / r['ab'] >= 0.300], 3, (EX2, 'medium', 12))
    qadd(f'Name a player who stole 30 or more bases in {y}', [r['name'] for r in rr_ if r.get('sb', 0) >= 30], 3, (EX2, 'medium', 10))
    qadd(f'Name a pitcher who struck out 200 or more batters in {y}', [r['name'] for r in rr_ if r.get('so', 0) >= 200], 3, (EX2, 'hard', 8))
# career milestones from MLB's career leaderboards
for text, grp, sort, key, thr, lim in (('Name a player with 300 or more career home runs', 'hitting', 'homeRuns', 'homeRuns', 300, 400), ('Name a player with 2,500 or more career hits', 'hitting', 'hits', 'hits', 2500, 300), ('Name a player with 400 or more career stolen bases', 'hitting', 'stolenBases', 'stolenBases', 400, 200), ('Name a pitcher with 200 or more career wins', 'pitching', 'wins', 'wins', 200, 300), ('Name a pitcher with 2,000 or more career strikeouts', 'pitching', 'strikeOuts', 'strikeOuts', 2000, 300), ('Name a pitcher with 200 or more career saves', 'pitching', 'saves', 'saves', 200, 150)):
    d = get(f'{B}/stats?stats=career&group={grp}&sortStat={sort}&order=desc&playerPool=ALL&sportId=1&limit={lim}')
    try: qadd(text, [s['player']['fullName'] for s in d['stats'][0]['splits'] if int(s['stat'][key]) >= thr], 2)
    except Exception: pass

# ============ write the files that changed ============
def dump(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':'))
outs = {
    'rosters.js': ros_src[:m_ros.start(1)] + dump(ROS) + ros_src[m_ros.end(1):],
    'overrides.js': ovr_src[:m_ovr.start(1)] + dump(OVR) + ovr_src[m_ovr.end(1):],
    'seasons.js': '/* Every team-season roster since 1990: SEASON_PLAYERS is the name table ("Name:rarity"), SEASONS maps "ABBR-year" to "team name|player numbers". */\nconst SEASON_PLAYERS = ' + dump(SP) + ';\nconst SEASONS = ' + dump(SE) + ';\n',
    'data.js': dat_src,
    'extra.js': ex1_src[:m_e1.start(1)] + dump(EX1) + ex1_src[m_e1.end(1):],
    'extra2.js': ex2_src[:m_e2.start(1)] + dump(EX2) + ex2_src[m_e2.end(1):],
}
orig = {n: read(n) for n in outs}
changed = []
for n, txt in outs.items():
    if n == 'seasons.js': same = (dump(SP), dump(SE)) == (dump(json.loads(re.search(r'const SEASON_PLAYERS = (\[.*?\]);\n', orig[n], re.S).group(1))), dump(json.loads(re.search(r'const SEASONS = (\{.*?\});\n', orig[n], re.S).group(1))))
    else: same = txt == orig[n]
    if not same: open(os.path.join(OUTDIR, n), 'w', encoding='utf-8').write(txt); changed.append(n)
print('CHANGED', changed)
for k, v in report.items(): print('-', k, ':', ', '.join(v[:12]) + (f' (+{len(v) - 12} more)' if len(v) > 12 else ''))
if not changed: print('NOTHING NEW')
