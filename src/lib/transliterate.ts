/**
 * Best-effort, fully offline English → Telugu phonetic transliteration.
 * Rule-based (no ML, no network call — see the Phase 6a plan decision:
 * both realistic npm options were rejected, one for calling an external
 * API with customer data, the other for being undocumented/untyped).
 *
 * This is a *suggestion* only. Telugu is largely phonetic so common
 * names/words come out reasonably well (Ramesh → రమేష్, Lakshmi →
 * లక్ష్మి), but plain English spelling is genuinely ambiguous for a
 * few cases this table does not try to resolve (Sanskrit-origin
 * conjuncts like vocalic-R "ri" in Krishna, retroflex vs dental
 * consonants). Callers must always let the user accept, edit, or
 * ignore the result — never treat it as guaranteed-correct.
 */

// Ordered longest-key-first within each group so matching is greedy.
const CONSONANTS: [string, string][] = [
  ["ksh", "క్ష"],
  ["chh", "ఛ"],
  ["shh", "ష"],
  ["ph", "ఫ"],
  ["bh", "భ"],
  ["th", "థ"],
  ["dh", "ధ"],
  ["gh", "ఘ"],
  ["kh", "ఖ"],
  ["ch", "చ"],
  ["jh", "ఝ"],
  ["ng", "ఙ"],
  ["ny", "ఞ"],
  ["sh", "శ"],
  ["k", "క"],
  ["g", "గ"],
  ["c", "క"],
  ["j", "జ"],
  ["t", "త"],
  ["d", "ద"],
  ["n", "న"],
  ["p", "ప"],
  ["b", "బ"],
  ["m", "మ"],
  ["y", "య"],
  ["r", "ర"],
  ["l", "ల"],
  ["v", "వ"],
  ["w", "వ"],
  ["s", "స"],
  ["h", "హ"],
  ["f", "ఫ"],
  ["z", "జ"],
  ["x", "క్స"],
];

// [roman, matra-for-mid-word, independent-vowel-for-word-start]
const VOWELS: [string, string, string][] = [
  ["au", "ౌ", "ఔ"],
  ["ow", "ౌ", "ఔ"],
  ["ai", "ై", "ఐ"],
  ["aa", "ా", "ఆ"],
  ["ee", "ీ", "ఈ"],
  ["ii", "ీ", "ఈ"],
  ["oo", "ూ", "ఊ"],
  ["uu", "ూ", "ఊ"],
  // Bare mid-word "e"/"o" default to the long vowel — the common case
  // for Telugu names romanized with a single letter (Ramesh, Mohan).
  ["e", "ే", "ఏ"],
  ["o", "ో", "ఓ"],
  ["a", "", "అ"],
  ["i", "ి", "ఇ"],
  ["u", "ు", "ఉ"],
];

function matchLongest(
  text: string,
  index: number,
  table: readonly (readonly [string, ...string[]])[]
): (readonly [string, ...string[]]) | null {
  for (const entry of table) {
    const key = entry[0];
    if (text.startsWith(key, index)) return entry;
  }
  return null;
}

/**
 * Word-medial bare "n"/"m" immediately followed by a *different*
 * consonant conventionally renders as anusvara (ం) in everyday Telugu
 * spelling, not as an explicit nasal+virama+consonant conjunct —
 * e.g. Sanjay → సంజయ్ (not సన్జయ్), Anjali → అంజలి, Ranjith → రంజిత్.
 * Doubled n/m (gemination, as in "amma") is deliberately excluded by
 * the "different consonant" check, so అమ్మ keeps its explicit మ్మ.
 */
function isAnusvaraCase(
  lower: string,
  ckey: string,
  vowelIndex: number,
  table: readonly (readonly [string, ...string[]])[]
): boolean {
  if (ckey !== "n" && ckey !== "m") return false;
  if (vowelIndex >= lower.length) return false;
  const nextVowel = matchLongest(lower, vowelIndex, VOWELS);
  if (nextVowel) return false;
  const nextConsonant = matchLongest(lower, vowelIndex, table);
  return !!nextConsonant && nextConsonant[0] !== ckey;
}

function transliterateWord(word: string, table: readonly [string, string][]): string {
  const lower = word.toLowerCase();
  let out = "";
  let i = 0;

  while (i < lower.length) {
    const consonant = matchLongest(lower, i, table);

    if (consonant) {
      const [ckey, cbase] = consonant;
      const vowelIndex = i + ckey.length;

      if (isAnusvaraCase(lower, ckey, vowelIndex, table)) {
        out += "ం";
        i = vowelIndex;
        continue;
      }

      const vowel = matchLongest(lower, vowelIndex, VOWELS);

      if (vowel) {
        const [vkey, matra] = vowel;
        out += cbase + matra; // matra === "" for inherent "a"
        i = vowelIndex + vkey.length;
      } else {
        // No vowel follows: word-final consonant, or a conjunct with
        // the next consonant — either way, attach virama.
        out += cbase + "్";
        i = vowelIndex;
      }
      continue;
    }

    const vowel = matchLongest(lower, i, VOWELS);
    if (vowel) {
      const [vkey, , independent] = vowel;
      out += independent;
      i += vkey.length;
      continue;
    }

    // Unrecognized character (digit, punctuation, etc.) — pass through
    // rather than dropping it silently.
    out += word[i];
    i += 1;
  }

  return out;
}

/** A known-good dictionary spelling beats a phonetic guess whenever
 * one exists — checked per word, so a multi-word name like "Ramesh
 * Kumar" gets both halves right (రమేష్ కుమార్) even though only the
 * combined "వేంకటేష్‌కుమార్"-style keys below are single words. */
function transliterateWordWithDictionary(
  word: string,
  table: readonly [string, string][]
): string {
  const dictionaryHit = KNOWN_NAMES[word.toLowerCase()];
  if (dictionaryHit) return dictionaryHit;
  return transliterateWord(word, table);
}

/** Suggests a Telugu rendering of `englishText`. Never called
 * automatically on every keystroke by itself — the caller decides
 * when to invoke it (e.g. on blur) and always presents it as an
 * editable suggestion, never an auto-applied value. */
export function suggestTelugu(englishText: string): string {
  return englishText
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => transliterateWordWithDictionary(word, CONSONANTS))
    .join(" ");
}

/**
 * A small curated dictionary of common Indian first names/words with
 * their standard Telugu spelling — the phonetic engine above is
 * genuinely ambiguous for these (e.g. "sh" could be శ or ష, a
 * word-final consonant may or may not carry virama), so a known-good
 * lookup beats a guess for the names people actually type most.
 * Keyed lowercase; only whole-word exact matches are used.
 */
const KNOWN_NAMES: Record<string, string> = {
  ramesh: "రమేష్",
  suresh: "సురేష్",
  mahesh: "మహేష్",
  rajesh: "రాజేష్",
  naresh: "నరేష్",
  dinesh: "దినేష్",
  ganesh: "గణేష్",
  umesh: "ఉమేష్",
  mukesh: "ముఖేష్",
  lokesh: "లోకేష్",
  kumar: "కుమార్",
  krishna: "కృష్ణ",
  prasad: "ప్రసాద్",
  prakash: "ప్రకాష్",
  venkat: "వెంకట్",
  venkatesh: "వెంకటేష్",
  srinivas: "శ్రీనివాస్",
  ravi: "రవి",
  ravikumar: "రవికుమార్",
  kiran: "కిరణ్",
  anil: "అనిల్",
  sunil: "సునీల్",
  vijay: "విజయ్",
  vijaykumar: "విజయ్‌కుమార్",
  ashok: "అశోక్",
  raju: "రాజు",
  babu: "బాబు",
  rao: "రావు",
  reddy: "రెడ్డి",
  naidu: "నాయుడు",
  sharma: "శర్మ",
  murthy: "మూర్తి",
  chandra: "చంద్ర",
  satish: "సతీష్",
  santosh: "సంతోష్",
  manoj: "మనోజ్",
  arun: "అరుణ్",
  gopal: "గోపాల్",
  gopi: "గోపి",
  balaji: "బాలాజీ",
  siva: "శివ",
  shiva: "శివ",
  sai: "సాయి",
  raghu: "రఘు",
  raghava: "రాఘవ",
  narayana: "నారాయణ",
  narayan: "నారాయణ్",
  lakshmi: "లక్ష్మి",
  padma: "పద్మ",
  sita: "సీత",
  radha: "రాధ",
  kavitha: "కవిత",
  anjali: "అంజలి",
  priya: "ప్రియ",
  divya: "దివ్య",
  swathi: "స్వాతి",
  sowmya: "సౌమ్య",
  deepika: "దీపిక",
  sridevi: "శ్రీదేవి",
  saritha: "సరిత",
  sunitha: "సునీత",
  vani: "వాణి",
  usha: "ఉష",
  geetha: "గీత",
  jyothi: "జ్యోతి",
  rani: "రాణి",
  devi: "దేవి",

  // More male names
  surya: "సూర్య",
  ramana: "రమణ",
  ramanaiah: "రమణయ్య",
  subbarao: "సుబ్బారావు",
  venkataramana: "వెంకటరమణ",
  venkateswarlu: "వెంకటేశ్వర్లు",
  venkateswara: "వెంకటేశ్వర",
  rajendra: "రాజేంద్ర",
  rajendraprasad: "రాజేంద్రప్రసాద్",
  narasimha: "నరసింహ",
  narasimharao: "నరసింహారావు",
  yadagiri: "యాదగిరి",
  hanumantha: "హనుమంత",
  hanumanth: "హనుమంత్",
  hanuman: "హనుమాన్",
  appalaraju: "అప్పలరాజు",
  sambasiva: "సాంబశివ",
  sambaiah: "సాంబయ్య",
  sambayya: "సాంబయ్య",
  veerabhadra: "వీరభద్ర",
  yellaiah: "ఎల్లయ్య",
  pullaiah: "పుల్లయ్య",
  chinnaiah: "చిన్నయ్య",
  rambabu: "రాంబాబు",
  prabhakar: "ప్రభాకర్",
  prabhu: "ప్రభు",
  srikanth: "శ్రీకాంత్",
  sreekanth: "శ్రీకాంత్",
  vamsi: "వంశీ",
  vamshi: "వంశీ",
  teja: "తేజ",
  tejeswar: "తేజేశ్వర్",
  karthik: "కార్తీక్",
  karthikeya: "కార్తికేయ",
  nagaraju: "నాగరాజు",
  naga: "నాగ",
  nagesh: "నాగేష్",
  nageswara: "నాగేశ్వర",
  surendra: "సురేంద్ర",
  mahendra: "మహేంద్ర",
  narendra: "నరేంద్ర",
  devendra: "దేవేంద్ర",
  jagadish: "జగదీష్",
  jagan: "జగన్",
  jaganmohan: "జగన్మోహన్",
  mohan: "మోహన్",
  mohanrao: "మోహన్‌రావు",
  srinu: "శ్రీను",
  seenu: "సీను",
  chinna: "చిన్న",
  pedda: "పెద్ద",
  bhaskar: "భాస్కర్",
  bhasker: "భాస్కర్",
  eshwar: "ఈశ్వర్",
  ishwar: "ఈశ్వర్",
  ramakrishna: "రామకృష్ణ",
  ramarao: "రామారావు",
  ramamurthy: "రామమూర్తి",
  ranga: "రంగ",
  rangarao: "రంగారావు",
  ravikanth: "రవికాంత్",
  ravindra: "రవీంద్ర",
  raviteja: "రవితేజ",
  pavan: "పవన్",
  pavankumar: "పవన్‌కుమార్",
  sagar: "సాగర్",
  srikar: "శ్రీకర్",
  veerraju: "వీర్రాజు",
  veeraraju: "వీరరాజు",
  veera: "వీర",
  yugandhar: "యుగంధర్",
  laxman: "లక్ష్మణ్",
  lakshman: "లక్ష్మణ్",
  bharath: "భరత్",
  bharat: "భరత్",
  vinod: "వినోద్",
  vinodkumar: "వినోద్‌కుమార్",
  ajay: "అజయ్",
  amit: "అమిత్",
  rakesh: "రాకేష్",
  ranjith: "రంజిత్",
  ranjit: "రంజిత్",
  sanjay: "సంజయ్",
  vamshikrishna: "వంశీకృష్ణ",
  varun: "వరుణ్",
  varma: "వర్మ",
  appa: "అప్ప",
  appalanaidu: "అప్పలనాయుడు",
  koteswara: "కోటేశ్వర",
  koteswararao: "కోటేశ్వరరావు",
  chandrasekhar: "చంద్రశేఖర్",
  chandramouli: "చంద్రమౌళి",
  syam: "శ్యామ్",
  shyam: "శ్యామ్",
  vishnu: "విష్ణు",
  vishnuvardhan: "విష్ణువర్ధన్",
  ramu: "రాము",
  ramulu: "రాములు",
  varaprasad: "వరప్రసాద్",
  durgaprasad: "దుర్గాప్రసాద్",
  simhachalam: "సింహాచలం",
  appalanarasimha: "అప్పలనరసింహ",
  satyanarayana: "సత్యనారాయణ",
  satyam: "సత్యం",
  varaha: "వరాహ",
  gowtham: "గౌతమ్",
  gautam: "గౌతమ్",
  abhishek: "అభిషేక్",
  akhil: "అఖిల్",
  ashwin: "అశ్విన్",
  chaitanya: "చైతన్య",
  charan: "చరణ్",
  darsh: "దర్శ్",
  eswar: "ఈశ్వర్",
  harsha: "హర్ష",
  harish: "హరీష్",
  jaswanth: "జశ్వంత్",
  kalyan: "కళ్యాణ్",
  madhu: "మధు",
  madhusudhan: "మధుసూదన్",
  nithin: "నితిన్",
  nithish: "నితీష్",
  omkar: "ఓంకార్",
  pranay: "ప్రణయ్",
  rahul: "రాహుల్",
  rohit: "రోహిత్",
  sandeep: "సందీప్",
  saketh: "సాకేత్",
  siddharth: "సిద్ధార్థ్",
  tarun: "తరుణ్",
  uday: "ఉదయ్",
  varshith: "వర్షిత్",
  yaswanth: "యశ్వంత్",

  // More female names
  anitha: "అనిత",
  aruna: "అరుణ",
  bhavani: "భవాని",
  chandrika: "చంద్రిక",
  gayatri: "గాయత్రి",
  hema: "హేమ",
  indira: "ఇందిర",
  jayasri: "జయశ్రీ",
  jaya: "జయ",
  kalpana: "కల్పన",
  kanaka: "కనక",
  komali: "కోమలి",
  lalitha: "లలిత",
  latha: "లత",
  madhavi: "మాధవి",
  manasa: "మానస",
  meena: "మీన",
  meenakshi: "మీనాక్షి",
  neelima: "నీలిమ",
  nirmala: "నిర్మల",
  padmavathi: "పద్మావతి",
  parvathi: "పార్వతి",
  pushpa: "పుష్ప",
  ramya: "రమ్య",
  rashmi: "రష్మి",
  revathi: "రేవతి",
  sarala: "సరళ",
  saroja: "సరోజ",
  savitri: "సావిత్రి",
  shanthi: "శాంతి",
  santhi: "శాంతి",
  shailaja: "శైలజ",
  sirisha: "సిరిష",
  soujanya: "సౌజన్య",
  sravanthi: "శ్రావంతి",
  srilatha: "శ్రీలత",
  sujatha: "సుజాత",
  suma: "సుమ",
  sumathi: "సుమతి",
  sunanda: "సునంద",
  suvarna: "సువర్ణ",
  swapna: "స్వప్న",
  swarna: "స్వర్ణ",
  tulasi: "తులసి",
  tulasamma: "తులసమ్మ",
  varalakshmi: "వరలక్ష్మి",
  vasantha: "వసంత",
  vijayalakshmi: "విజయలక్ష్మి",
  yamuna: "యమున",

  // Common surnames / titles (appended after a first name)
  garu: "గారు",
  naik: "నాయక్",
  goud: "గౌడ్",
  yadav: "యాదవ్",
  setty: "శెట్టి",
  chetty: "చెట్టి",
  patel: "పటేల్",
  singh: "సింగ్",

  // Grains, pulses & millets
  bajra: "సజ్జలు",
  jowar: "జొన్నలు",
  ragi: "రాగులు",
  maize: "మొక్కజొన్న",
  corn: "మొక్కజొన్న",
  rice: "బియ్యం",
  wheat: "గోధుమలు",
  urad: "మినుములు",
  uraddal: "మినపప్పు",
  moong: "పెసలు",
  moongdal: "పెసరపప్పు",
  toor: "కంది",
  toordal: "కందిపప్పు",
  chana: "శనగలు",
  chanadal: "శనగపప్పు",
  horsegram: "ఉలవలు",
  ulavalu: "ఉలవలు",
  korra: "కొర్రలు",
  korralu: "కొర్రలు",
  sama: "సామలు",
  samalu: "సామలు",
  arika: "అరికెలు",
  arikelu: "అరికెలు",
  varigelu: "వరిగెలు",
  bengal: "బెంగాల్",
  groundnut: "వేరుశనగ",
  peanut: "వేరుశనగ",
  sesame: "నువ్వులు",
  gingelly: "నువ్వులు",
  mustard: "ఆవాలు",
  cumin: "జీలకర్ర",
  fenugreek: "మెంతులు",
  jaggery: "బెల్లం",
  flour: "పిండి",
  salt: "ఉప్పు",
  sugar: "చక్కెర",

  // Vegetables
  onion: "ఉల్లిపాయ",
  garlic: "వెల్లుల్లి",
  potato: "బంగాళదుంప",
  tomato: "టమాటా",
  carrot: "క్యారెట్",
  brinjal: "వంకాయ",
  eggplant: "వంకాయ",
  cabbage: "కాబేజీ",
  cauliflower: "కాలిఫ్లవర్",
  beans: "బీన్స్",
  beetroot: "బీట్‌రూట్",
  okra: "బెండకాయ",
  ladiesfinger: "బెండకాయ",
  cucumber: "దోసకాయ",
  pumpkin: "గుమ్మడికాయ",
  bottlegourd: "సొరకాయ",
  ridgegourd: "బీరకాయ",
  bittergourd: "కాకరకాయ",
  drumstick: "మునగకాయ",
  ginger: "అల్లం",
  chilli: "మిర్చి",
  chili: "మిర్చి",
  greenchilli: "పచ్చిమిర్చి",
  lemon: "నిమ్మకాయ",
  coriander: "కొత్తిమీర",
  mint: "పుదీనా",
  curryleaves: "కరివేపాకు",
  capsicum: "క్యాప్సికమ్",
  spinach: "పాలకూర",
  radish: "ముల్లంగి",

  // Business / common item words
  box: "పెట్టె",
  packet: "ప్యాకెట్",
  bottle: "సీసా",
  bag: "సంచి",
  plastic: "ప్లాస్టిక్",
  cake: "కేక్",
  oil: "నూనె",
  coconut: "కొబ్బరి",
};

/**
 * An alternate phonetic reading for the same word — swaps a small set
 * of genuinely ambiguous sounds (sibilants, aspirates) that romanized
 * Telugu names commonly go either way on, so the second suggestion is
 * a real alternative rather than the same guess repeated.
 */
const ALT_CONSONANTS: [string, string][] = [
  ["ksh", "క్ష"],
  ["chh", "ఛ"],
  ["shh", "శ"],
  ["ph", "ఫ"],
  ["bh", "భ"],
  ["th", "థ"],
  ["dh", "ధ"],
  ["gh", "ఘ"],
  ["kh", "ఖ"],
  ["ch", "ఛ"], // primary table uses చ — offer the aspirated form as the alternate
  ["jh", "ఝ"],
  ["ng", "ఙ"],
  ["ny", "ఞ"],
  ["sh", "ష"], // primary table uses శ — offer retroflex as the alternate
  ["k", "క"],
  ["g", "గ"],
  ["c", "క"],
  ["j", "జ"],
  ["t", "ట"], // primary table uses త (dental) — offer retroflex ట as the alternate
  ["d", "డ"],
  ["n", "న"],
  ["p", "ప"],
  ["b", "బ"],
  ["m", "మ"],
  ["y", "య"],
  ["r", "ర"],
  ["l", "ల"],
  ["v", "వ"],
  ["w", "వ"],
  ["s", "స"],
  ["h", "హ"],
  ["f", "ఫ"],
  ["z", "జ"],
  ["x", "క్స"],
];

function suggestTeluguAlt(englishText: string): string {
  return englishText
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => transliterateWordWithDictionary(word, ALT_CONSONANTS))
    .join(" ");
}

/**
 * Up to three distinct Telugu suggestions for `englishText`, most
 * likely first — a known-name dictionary hit (when available), the
 * primary phonetic guess, and an alternate phonetic reading. The
 * caller always treats every entry as an editable suggestion, never
 * auto-applied, and the user can also type their own Telugu value
 * regardless of what's offered here.
 */
export function suggestTeluguVariants(englishText: string): string[] {
  const trimmed = englishText.trim();
  if (!trimmed) return [];

  const key = trimmed.toLowerCase().replace(/\s+/g, "");
  const dictionaryHit = KNOWN_NAMES[key];

  const primary = suggestTelugu(trimmed);
  const alternate = suggestTeluguAlt(trimmed);

  const results: string[] = [];
  if (dictionaryHit) results.push(dictionaryHit);
  if (!results.includes(primary)) results.push(primary);
  if (!results.includes(alternate)) results.push(alternate);

  return results.slice(0, 3);
}
