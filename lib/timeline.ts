/* The Bible timeline: the whole Bible story in time order, in 4 parts.

   This is the one system the whole site uses to say where something fits:
   the /timeline/ page, the Big Story on the Stories page, and the
   "where this story fits" strip on every story page.

   HOW STORIES FIND THEIR PLACE
   A story's part is worked out from its passage (book and chapter) by
   eraOfPassage() below. A new story needs no extra setting here.

   REVIEW NOTES (September 2026)
   Content reviewed as a student, a first-time visitor, a neurodivergent
   reader, a UX designer, and an ELCA theologian (see
   theological-review-log.md in the project). Dates are approximate.
   Where scholars disagree, the era says so in its notes. */

export interface TimelinePart {
  n: number; id: string; name: string; years: string;
  from: number; to: number;
  books: string; href: string; line: string;
}
export interface BookRef { label: string; slug?: string; ch?: number; trans?: string }
export interface Era {
  id: string; part: number; start: number; end: number;
  gap?: boolean; mark?: boolean;
  dur: string; shortDate: string; date: string; title: string; short: string;
  what: string; notes: string[];
  events: [string, string][]; people: [string, string][]; places: [string, string][];
  back: string; books: BookRef[]; idea: string;
}

/* The drawing scale, in years. Negative years are BC. */
export const TL_MIN = -2250;
export const TL_MAX = 180;
export function tlX(year: number) { return ((year - TL_MIN) / (TL_MAX - TL_MIN)) * 100; }

export const PARTS: TimelinePart[] = [
  { n: 1, id: "the-promise", name: "The Promise", years: "Dates unknown to 1880 BC", from: -2000, to: -1880,
    books: "Genesis", href: "/bsb/genesis/1/",
    line: "God makes a good world, then promises to bless every nation through one family." },
  { n: 2, id: "a-people-rescued", name: "A People Rescued", years: "1880 to 930 BC", from: -1880, to: -930,
    books: "Exodus to 1 Kings 11", href: "/bsb/exodus/1/",
    line: "God sets his people free, gives them his law, and gives them a king." },
  { n: 3, id: "exile-and-hope", name: "Exile and Hope", years: "930 to 6 BC", from: -930, to: -6,
    books: "1 Kings 12 to Malachi", href: "/bsb/1-kings/12/",
    line: "The kingdom splits and falls. The prophets promise a new king." },
  { n: 4, id: "the-king-arrives", name: "The King Arrives", years: "6 BC to AD 100", from: -6, to: 100,
    books: "Matthew to Revelation", href: "/bsb/matthew/1/",
    line: "Jesus dies and rises. The Holy Spirit comes, and the good news spreads." },
];

const b = (label: string, slug?: string, ch = 1, trans?: string): BookRef => ({ label, slug, ch, trans });

export const ERAS: Era[] = [
  { id: "the-beginning", part: 1, start: TL_MIN, end: -2000, dur: "Dates unknown",
    shortDate: "Dates unknown", date: "Before written history", title: "The Beginning", short: "Adam, Eve, Noah",
    what: "God makes the world and calls it very good. The first people turn away from God, and things break. God does not give up on them.",
    notes: [
      "The Bible gives no dates for this part. That is why it sits in the faded start of the line.",
      "The flood story is hard to read. Christians have struggled with it for a long time.",
    ],
    events: [["", "God creates the world and the first people."], ["", "Adam and Eve turn away from God."], ["", "Cain kills his brother Abel."], ["", "A great flood. God saves Noah and his family in the ark."], ["", "People build the tower of Babel."]],
    people: [["Adam and Eve", "The first man and woman."], ["Cain and Abel", "Their sons."], ["Noah", "The man God saves from the flood, with his family."]],
    places: [["Eden", "The garden where the first people lived. The Bible places it near the Tigris and Euphrates rivers."], ["Ararat", "The mountains where the ark comes to rest, in today’s Turkey."], ["Babel", "A city in Mesopotamia, in today’s Iraq."]],
    back: "Other ancient writings from Mesopotamia also tell stories of a great flood.",
    books: [b("Genesis 1–11", "genesis", 1)],
    idea: "God makes a good world and promises to fix what goes wrong." },
  { id: "the-ancestors", part: 1, start: -2000, end: -1880, dur: "about 120 years",
    shortDate: "2000–1880 BC", date: "About 2000 to 1880 BC", title: "The Ancestors", short: "Abraham, Sarah, Jacob",
    what: "God tells Abraham to leave home and go to a new land. God promises that his family will become a great nation, and that every nation will be blessed through it.",
    notes: [],
    events: [["About 2000 BC", "God calls Abraham to leave Ur."], ["", "Abraham and Sarah have a son, Isaac, in their old age."], ["", "God gives Isaac’s son Jacob a new name: Israel. His 12 sons’ families become the people of Israel."], ["", "Joseph is sold as a slave but becomes a leader in Egypt."], ["About 1880 BC", "Jacob’s family moves to Egypt to survive a long time without food."]],
    people: [["Abraham", "The man God chooses to begin a new family."], ["Sarah", "Abraham’s wife. She has a son when she is very old."], ["Isaac", "Their son."], ["Jacob", "Isaac’s son. God later names him Israel."], ["Joseph", "Jacob’s son, sold by his brothers, later a leader in Egypt."]],
    places: [["Ur", "A city in today’s southern Iraq, where Abraham starts out."], ["Canaan", "The land along the eastern Mediterranean coast that God promises to Abraham."], ["Egypt", "The powerful kingdom along the Nile River, to the southwest."]],
    back: "The pyramids at Giza were already about 500 years old.",
    books: [b("Genesis 12–50", "genesis", 12), b("Job (its time is unknown, and many place it here)", "job", 1)],
    idea: "God promises to bless the whole world through one family." },
  { id: "years-in-egypt", part: 2, gap: true, start: -1880, end: -1450, dur: "about 430 years",
    shortDate: "1880–1450 BC", date: "About 1880 to 1450 BC", title: "430 Years in Egypt", short: "The family becomes a nation",
    what: "Jacob’s family grows into a nation of thousands. A new king of Egypt is afraid of them and makes them slaves. They cry out to God.",
    notes: ["The Bible covers these years in only a few pages. The number 430 comes from Exodus 12:40."],
    events: [["", "Joseph dies in Egypt."], ["", "A new king who did not know Joseph makes the Israelites slaves."], ["", "Moses is born and raised in the king’s palace."], ["", "Moses runs away to the desert of Midian."]],
    people: [["The Israelites", "Jacob’s descendants, now a large people."], ["Shiphrah and Puah", "Two midwives who refuse the king’s order to kill baby boys."], ["Moses", "An Israelite baby raised by the king’s daughter."]],
    places: [["Goshen", "A region in northern Egypt, near the Nile delta, where the Israelites live."], ["Midian", "A desert region east of Egypt, where Moses hides."]],
    back: "Egypt was the strongest kingdom in the region. Its kings were called pharaohs.",
    books: [b("Exodus 1–2", "exodus", 1)],
    idea: "God hears his people, even in the long years when he seems silent." },
  { id: "out-of-egypt", part: 2, mark: true, start: -1450, end: -1200, dur: "about 250 years",
    shortDate: "1450–1200 BC", date: "About 1450 to 1200 BC", title: "Out of Egypt", short: "Moses, Miriam, Joshua",
    what: "God sends Moses to lead Israel out of slavery. In the desert, God gives them his law. After 40 years, Joshua leads them into the land God promised.",
    notes: [
      "Scholars disagree about this date. Some place the escape from Egypt closer to 1250 BC.",
      "The conquest of Canaan includes violent stories that are hard to read. Christians have struggled with them for a long time.",
    ],
    events: [["About 1450 BC", "Ten plagues strike Egypt. God’s people eat the first Passover meal. Jesus later shares this meal on the night before he dies."], ["", "Israel crosses the Red Sea."], ["", "At Mount Sinai, God gives the Ten Commandments."], ["", "Israel wanders in the desert for 40 years."], ["About 1400 BC", "Joshua leads Israel into Canaan. The walls of Jericho fall."]],
    people: [["Moses", "The leader God sends to free Israel."], ["Aaron", "Moses’s brother, Israel’s first priest."], ["Miriam", "Moses’s sister, who leads the people in song."], ["Joshua", "Moses’s helper, who leads Israel into Canaan."]],
    places: [["Red Sea", "The sea Israel crosses as they leave Egypt."], ["Mount Sinai", "A mountain in the Sinai desert, between Egypt and Canaan."], ["Jericho", "An old walled city near the Jordan River."]],
    back: "Egypt’s empire was at its height. Pharaohs built huge temples and cities.",
    books: [b("Exodus 3–40", "exodus", 3), b("Leviticus", "leviticus"), b("Numbers", "numbers"), b("Deuteronomy", "deuteronomy"), b("Joshua", "joshua")],
    idea: "God sets his people free first, then gives them his law." },
  { id: "the-judges", part: 2, start: -1200, end: -1050, dur: "about 150 years",
    shortDate: "1200–1050 BC", date: "About 1200 to 1050 BC", title: "The Judges", short: "Deborah, Gideon, Samson",
    what: "Israel forgets God. Enemies attack. The people cry out, and God sends a leader to rescue them. Then they forget again. This pattern repeats many times.",
    notes: ["In this part of the Bible, a judge is a leader God sends to rescue Israel. It does not mean a judge in a courtroom."],
    events: [["", "Deborah leads Israel to victory."], ["", "Gideon wins a battle with only 300 men."], ["", "Samson fights the Philistines."], ["", "Ruth, a foreigner, moves to Bethlehem and joins Israel."], ["About 1050 BC", "Samuel, the last judge, leads Israel."]],
    people: [["Deborah", "A judge and prophet who leads Israel."], ["Gideon", "A fearful farmer God makes into a leader."], ["Samson", "A very strong judge with many weaknesses."], ["Ruth", "A woman from Moab, great-grandmother of King David."], ["Samuel", "The last judge, who later anoints Israel’s first kings."]],
    places: [["Canaan", "The land where the tribes of Israel now live."], ["Bethlehem", "A small town south of Jerusalem, where Ruth settles."]],
    back: "Other peoples lived in the land too, including the Philistines along the coast.",
    books: [b("Judges", "judges"), b("Ruth", "ruth"), b("1 Samuel 1–7", "1-samuel", 1)],
    idea: "God keeps rescuing his people, even when they forget him." },
  { id: "the-first-kings", part: 2, start: -1050, end: -930, dur: "about 120 years",
    shortDate: "1050–930 BC", date: "About 1050 to 930 BC", title: "The First Kings", short: "Saul, David, Solomon",
    what: "Israel asks for a king like other nations have. Saul is the first king. Then God chooses David, a young shepherd, and promises that a king from his family will rule forever. David’s son Solomon builds the temple.",
    notes: [],
    events: [["About 1050 BC", "Saul becomes Israel’s first king."], ["", "David defeats the giant Goliath."], ["About 1010 BC", "David becomes king. Jerusalem becomes the capital."], ["", "God promises David that a king from his family will rule forever (2 Samuel 7)."], ["About 960 BC", "Solomon builds the first temple in Jerusalem."]],
    people: [["Saul", "Israel’s first king. A head taller than anyone in Israel."], ["David", "The youngest of Jesse’s eight sons, from Bethlehem. A shepherd God chose to be king. He also sinned badly, and God forgave him (Psalm 51)."], ["Goliath", "A giant Philistine soldier."], ["Solomon", "David’s son, known for his wisdom."]],
    places: [["Valley of Elah", "The valley west of Bethlehem where David fights Goliath."], ["Jerusalem", "A hill city that David makes the capital."]],
    back: "Egypt and Assyria were weak in this period, so small kingdoms like Israel could grow.",
    books: [b("1 Samuel 8–31", "1-samuel", 8), b("2 Samuel", "2-samuel"), b("1 Kings 1–11", "1-kings"), b("1 Chronicles", "1-chronicles"), b("2 Chronicles 1–9", "2-chronicles"), b("Psalms", "psalms"), b("Proverbs", "proverbs"), b("Ecclesiastes", "ecclesiastes"), b("Song of Songs", "song-of-solomon")],
    idea: "God chooses a shepherd boy to be king." },
  { id: "the-kingdom-splits", part: 3, start: -930, end: -586, dur: "about 340 years",
    shortDate: "930–586 BC", date: "About 930 to 586 BC", title: "The Kingdom Splits", short: "Elijah, Jonah, Isaiah",
    what: "After Solomon dies, the kingdom splits in two. God sends prophets, messengers who speak for him. They warn that turning away from God leads to ruin. Both kingdoms are later destroyed. The prophets also promise a new king and a new covenant (Jeremiah 31).",
    notes: ["In this part, “Israel” means only the northern kingdom. Earlier it meant Jacob, and then all of his descendants."],
    events: [["930 BC", "The kingdom splits: Israel in the north, Judah in the south."], ["About 860 BC", "Elijah challenges the prophets of Baal on Mount Carmel."], ["", "Jonah is sent to Nineveh."], ["722 BC", "Assyria destroys Israel, the northern kingdom."], ["701 BC", "Assyria attacks Jerusalem but fails to take it."], ["586 BC", "Babylon destroys Jerusalem and the temple."]],
    people: [["Elijah", "A prophet who stands up to wicked King Ahab."], ["Elisha", "Elijah’s student, who takes his place."], ["Jonah", "A prophet who runs from God, then warns Nineveh."], ["Amos and Hosea", "Prophets to the northern kingdom."], ["Isaiah", "A prophet in Jerusalem who speaks of a coming king."], ["Jeremiah", "A prophet who warns Jerusalem before it falls."]],
    places: [["Israel (north)", "The northern kingdom, with its capital at Samaria."], ["Judah (south)", "The southern kingdom, with its capital at Jerusalem."], ["Nineveh", "The capital of Assyria, in today’s northern Iraq."]],
    back: "Assyria, based in today’s northern Iraq, became the strongest empire in the world. By tradition, Rome was founded in 753 BC.",
    books: [b("1 Kings 12–22", "1-kings", 12), b("2 Kings", "2-kings"), b("2 Chronicles 10–36", "2-chronicles", 10), b("Isaiah", "isaiah"), b("Jeremiah", "jeremiah"), b("Hosea", "hosea"), b("Joel", "joel"), b("Amos", "amos"), b("Jonah", "jonah"), b("Micah", "micah"), b("Nahum", "nahum"), b("Habakkuk", "habakkuk"), b("Zephaniah", "zephaniah")],
    idea: "God keeps sending messengers to call his people back." },
  { id: "exile-and-return", part: 3, mark: true, start: -586, end: -430, dur: "about 160 years",
    shortDate: "586–430 BC", date: "About 586 to 430 BC", title: "Exile and Return", short: "Daniel, Esther, Nehemiah",
    what: "Babylon takes many of Judah’s people far from home. This is called the exile. About 50 years later, some go back to rebuild Jerusalem. Many others stay where they are.",
    notes: [],
    events: [["586 BC", "Many of Judah’s people are taken to Babylon."], ["", "Daniel serves God in Babylon."], ["539 BC", "Persia conquers Babylon."], ["538 BC", "King Cyrus of Persia lets the people go home."], ["516 BC", "The second temple is finished in Jerusalem."], ["About 479 BC", "Esther becomes queen of Persia."], ["About 445 BC", "Nehemiah rebuilds Jerusalem’s walls."]],
    people: [["Ezekiel", "A prophet among the exiles in Babylon."], ["Daniel", "A young exile who stays faithful in Babylon."], ["Esther", "A Jewish queen of Persia who saves her people."], ["Ezra", "A teacher of God’s law who returns to Jerusalem."], ["Nehemiah", "A leader who rebuilds Jerusalem’s walls."]],
    places: [["Babylon", "A great city in today’s Iraq."], ["Persia", "An empire based in today’s Iran."], ["Jerusalem", "The city the returning exiles rebuild."]],
    back: "Babylon, then Persia, ruled the region. In Greece, the Parthenon in Athens was finished in 432 BC.",
    books: [b("Lamentations", "lamentations"), b("Ezekiel", "ezekiel"), b("Daniel", "daniel"), b("Obadiah", "obadiah"), b("Ezra", "ezra"), b("Nehemiah", "nehemiah"), b("Esther", "esther"), b("Haggai", "haggai"), b("Zechariah", "zechariah"), b("Malachi", "malachi")],
    idea: "God stays with his people, even far from home." },
  { id: "between-the-testaments", part: 3, gap: true, start: -430, end: -6, dur: "about 400 years",
    shortDate: "430–6 BC", date: "About 430 to 6 BC", title: "400 Years Between the Testaments", short: "Persia, Greece, Rome",
    what: "The Old Testament ends here. Empires rise and fall around God’s people. They wait for the king God promised.",
    notes: ["No Old Testament books were written in these years. Luther’s Bible printed the Apocrypha, books from this time, as useful and good to read, but not equal to Scripture. Catholic and Orthodox Christians include some of these books in their Bibles."],
    events: [["332 BC", "Alexander the Great conquers the region."], ["167 BC", "The Maccabees lead a revolt against a Greek king."], ["164 BC", "The temple is cleaned and rededicated. Jewish people remember this at Hanukkah."], ["63 BC", "Rome takes Jerusalem."], ["37 BC", "Herod the Great becomes king under Rome."]],
    people: [["Alexander the Great", "A Greek king who conquers a huge empire."], ["Judas Maccabeus", "A Jewish leader of the revolt."], ["Herod the Great", "A king under Rome who rebuilds the temple."]],
    places: [["Jerusalem", "Still the center of Jewish life and worship."], ["Rome", "The city that comes to rule the whole region."]],
    back: "Greek language and culture spread across the region. That is why the New Testament was later written in Greek.",
    books: [b("No Old Testament books"), b("Apocrypha: 1 and 2 Maccabees and others (King James Version)", "1-maccabees", 1, "kjv")],
    idea: "God is still at work, even when no new word comes." },
  { id: "jesus", part: 4, mark: true, start: -6, end: 30, dur: "about 35 years",
    shortDate: "6 BC–AD 30", date: "About 6 BC to AD 30", title: "Jesus", short: "Mary, Jesus, Peter",
    what: "Jesus is born into David’s family, in David’s town of Bethlehem. He teaches, heals the sick, and eats with people others avoid. He dies on a cross in Jerusalem. On the third day, God raises him from the dead. Christians believe he died for the sins of the world and rose to give new life.",
    notes: ["Why is Jesus born in “6 BC”? Our calendar was worked out about 500 years later, and the math was off by a few years."],
    events: [["About 6 to 4 BC", "Jesus is born in Bethlehem."], ["About AD 27", "John baptizes Jesus. Jesus begins to teach."], ["", "Jesus teaches in parables and heals many people."], ["About AD 30 (some say 33)", "Jesus is crucified in Jerusalem."], ["", "On the third day, God raises Jesus from the dead."]],
    people: [["Mary", "Jesus’s mother."], ["Joseph", "Mary’s husband, who raises Jesus."], ["John the Baptist", "A prophet who prepares the way for Jesus."], ["Jesus", "The one the Gospels present as the promised Messiah and the Son of God."], ["Peter", "A fisherman who becomes a leading follower of Jesus."], ["Mary Magdalene", "A follower of Jesus and the first to see him risen."]],
    places: [["Bethlehem", "David’s hometown, where Jesus is born."], ["Nazareth", "Jesus’s hometown, in Galilee."], ["Galilee", "A region in the north, around a large lake."], ["Jerusalem", "Where Jesus dies and rises."]],
    back: "Rome ruled the region. Roman governors like Pontius Pilate ruled Judea.",
    books: [b("Matthew", "matthew"), b("Mark", "mark"), b("Luke", "luke"), b("John", "john")],
    idea: "In Jesus, God comes to us. He dies and rises to forgive and save us." },
  { id: "the-church-begins", part: 4, start: 30, end: 100, dur: "about 70 years",
    shortDate: "AD 30–100", date: "About AD 30 to 100", title: "The Church Begins", short: "Peter, Paul, Lydia",
    what: "God’s Holy Spirit comes to Jesus’s followers. They tell the good news about Jesus, first in Jerusalem, then across the Roman Empire. Paul and others write letters to the new churches.",
    notes: ["The Jewish people’s story continues too. Paul wrote that God’s gifts and his call are irrevocable (Romans 11:29)."],
    events: [["About AD 30", "At Pentecost, a Jewish harvest festival, the Holy Spirit comes."], ["", "About 3,000 people are baptized. Believers gather to pray and break bread (Acts 2:41–42)."], ["About AD 34", "Saul, later called Paul, meets Jesus on the road to Damascus."], ["About AD 46 to 57", "Paul travels and starts churches around the Mediterranean."], ["AD 70", "Rome destroys the temple in Jerusalem."], ["About AD 95", "Revelation is written, by early tradition."]],
    people: [["Peter", "A leader of the first church in Jerusalem."], ["Paul", "Once an enemy of the church, then its greatest traveler and letter writer."], ["Lydia", "A businesswoman who hosts one of the first churches in Europe."], ["Priscilla", "A teacher who works with Paul."], ["Timothy", "Paul’s young helper."]],
    places: [["Jerusalem", "Where the church begins."], ["Antioch", "A city in today’s Turkey, where followers were first called Christians."], ["Rome", "The capital of the Roman Empire."]],
    back: "Roman roads and a shared Greek language helped the message travel fast.",
    books: [b("Acts", "acts"), b("Romans", "romans"), b("1 Corinthians", "1-corinthians"), b("2 Corinthians", "2-corinthians"), b("Galatians", "galatians"), b("Ephesians", "ephesians"), b("Philippians", "philippians"), b("Colossians", "colossians"), b("1 Thessalonians", "1-thessalonians"), b("2 Thessalonians", "2-thessalonians"), b("1 Timothy", "1-timothy"), b("2 Timothy", "2-timothy"), b("Titus", "titus"), b("Philemon", "philemon"), b("Hebrews", "hebrews"), b("James", "james"), b("1 Peter", "1-peter"), b("2 Peter", "2-peter"), b("1 John", "1-john"), b("2 John", "2-john"), b("3 John", "3-john"), b("Jude", "jude"), b("Revelation", "revelation")],
    idea: "God sends his Spirit, and the good news spreads to every nation." },
];

export const TL_CONTINUES = "The story continues. Christians live in it today, waiting for God to make all things new (Revelation 21:5).";

export function eraById(id: string) { return ERAS.find((e) => e.id === id) || null; }
export function partOfEra(e: Era) { return PARTS[e.part - 1]; }
/** Where the "you are here" dot sits for an era, in percent of the line. */
export function eraCenter(e: Era) { return e.id === "the-beginning" ? tlX(-2130) : (tlX(e.start) + tlX(e.end)) / 2; }
export function bookHref(r: BookRef) { return r.slug ? `/${r.trans || "bsb"}/${r.slug}/${r.ch || 1}/` : null; }

/* Which era a passage belongs to. Book slugs match the Full Bible. */
const WHOLE: Record<string, string> = {
  leviticus: "out-of-egypt", numbers: "out-of-egypt", deuteronomy: "out-of-egypt", joshua: "out-of-egypt",
  judges: "the-judges", ruth: "the-judges",
  "2-samuel": "the-first-kings", "1-chronicles": "the-first-kings", psalms: "the-first-kings",
  proverbs: "the-first-kings", ecclesiastes: "the-first-kings", "song-of-solomon": "the-first-kings",
  job: "the-ancestors",
  "2-kings": "the-kingdom-splits", isaiah: "the-kingdom-splits", jeremiah: "the-kingdom-splits",
  hosea: "the-kingdom-splits", joel: "the-kingdom-splits", amos: "the-kingdom-splits", jonah: "the-kingdom-splits",
  micah: "the-kingdom-splits", nahum: "the-kingdom-splits", habakkuk: "the-kingdom-splits", zephaniah: "the-kingdom-splits",
  lamentations: "exile-and-return", ezekiel: "exile-and-return", daniel: "exile-and-return", obadiah: "exile-and-return",
  ezra: "exile-and-return", nehemiah: "exile-and-return", esther: "exile-and-return", haggai: "exile-and-return",
  zechariah: "exile-and-return", malachi: "exile-and-return",
  "1-maccabees": "between-the-testaments", "2-maccabees": "between-the-testaments",
  matthew: "jesus", mark: "jesus", luke: "jesus", john: "jesus",
};
const CHURCH = ["acts", "romans", "1-corinthians", "2-corinthians", "galatians", "ephesians", "philippians", "colossians",
  "1-thessalonians", "2-thessalonians", "1-timothy", "2-timothy", "titus", "philemon", "hebrews", "james",
  "1-peter", "2-peter", "1-john", "2-john", "3-john", "jude", "revelation"];
const APOCRYPHA = ["1-esdras", "2-esdras", "tobit", "judith", "esther-greek", "wisdom-of-solomon", "sirach", "baruch",
  "the-song-of-the-three-holy-children", "susanna", "bel-and-the-dragon", "prayer-of-manasseh"];
/** The era a passage belongs to, or null for a book the timeline does not place. */
export function eraOfPassage(p: { book: string; chapter: number }): Era | null {
  const { book, chapter: c } = p;
  let id: string | undefined = WHOLE[book];
  if (!id) {
    if (book === "genesis") id = c <= 11 ? "the-beginning" : "the-ancestors";
    else if (book === "exodus") id = c <= 2 ? "years-in-egypt" : "out-of-egypt";
    else if (book === "1-samuel") id = c <= 7 ? "the-judges" : "the-first-kings";
    else if (book === "1-kings") id = c <= 11 ? "the-first-kings" : "the-kingdom-splits";
    else if (book === "2-chronicles") id = c <= 9 ? "the-first-kings" : "the-kingdom-splits";
    else if (CHURCH.includes(book)) id = "the-church-begins";
    else if (APOCRYPHA.includes(book)) id = "between-the-testaments";
  }
  return id ? eraById(id) : null;
}
export function partOfPassage(p: { book: string; chapter: number }) { const e = eraOfPassage(p); return e ? partOfEra(e) : null; }
