/* Scene by Scene: the story shelf, and the one catalog behind the
   Stories page.

   HOW THIS IS ORGANIZED
   A "story" is one retelling of one passage. A passage can have more than
   one retelling: different ages (8+, 12+ and adult) and different ways of
   reading (the lens). Retellings of the same passage share a `family`.

   TO PUBLISH A NEW STORY
   1. Save the finished Markdown (starting at "# The Story") as
      data/stories/<slug>.md. End each retelling paragraph with its verses,
      like {v: 5:3} or {v: 4:24, 5:1}. Paragraphs without a tag use the
      verses of their scene from the Map of the Story table.
   2. Add an entry below with status "early". Early editions show with a
      "New" badge, and search engines are told not to index them.
   3. When the pastor review is done, change status to "live".
   4. Give it a `memorize` line so the Memorize step has something to teach.

   NAMING RULE
   The title is the name people already know and search for ("The
   Beatitudes", "The Prodigal Son"). Use the wording most Bibles print as
   the section heading: [who] + [what happened] ("Jesus Walks on Water").
   When the story centers on one well-known person, use the name
   ("Nicodemus"). The subtitle says it in plain words.

   SEARCH TERMS
   Put every other name people use in `also` ("Jonah and the whale",
   "Good Friday"). Site search, the Stories filter, and the page data for
   search engines all read it. `also` is never shown as the title. */

import fs from "node:fs";
import path from "node:path";
import { PARABLES, PARABLE_THEMES, NEEDS, pullRange } from "./bible";

export const SHOW_EARLY_EDITIONS = true;

/** Joins the last two words of a headline with a no-break space, so a
    headline never ends with one word alone on the last line. */
export function nw(s: string, max = 16) {
  const m = s.match(/(\S+)\s+(\S+)\s*$/);
  // Only join short pairs, so the joined words still fit a small phone.
  if (!m || m[1].length + m[2].length > max) return s;
  return s.replace(/\s+(\S+)\s*$/, "\u00A0$1");
}

export type Lens = "story" | "literal" | "technical" | "philosopher";
export type Level = "12+ and adult" | "8+";
export type Status = "live" | "early" | "planned";
export type Kind = "Story" | "Teaching" | "Poetry and Prayer";

export const LENSES: Record<Lens, { name: string; line: string }> = {
  story: { name: "Story", line: "What happened, in order, one scene at a time." },
  literal: { name: "Literal", line: "Says exactly what the text says, and flags every figure of speech." },
  technical: { name: "How it worked", line: "Maps, numbers, timelines, and how things worked back then." },
  philosopher: { name: "Big questions", line: "The ideas under the story, and the questions it leaves you with." },
};

export interface Passage { book: string; chapter: number; toChapter?: number }
export interface Memorize { ref: string; text: string; gaps: [string, string]; decoys: [string, string]; part?: boolean }

export interface StoryEntry {
  slug: string;
  family: string;
  title: string;
  subtitle: string;     // plain words, one line
  /** Other names people search for (search, Stories filter, and page data). Never shown as the title. */
  also?: string[];
  ref: string;
  kind: Kind;
  lens: Lens;
  level: Level;
  desc: string;
  cover?: string;
  status: Status;
  passage: Passage;
  feel: string[];       // FEELINGS slugs
  parable?: string;
  contentNote?: string;
  memorize?: Memorize;
  act: number;          // Older 7-part number, no longer shown. Pages use the 4 timeline parts (lib/timeline.ts), worked out from the passage.
  order: number;        // place in Bible order across the whole Big Story
}

/* ---------- Older 7-part Big Story (kept so older code still builds) ----------
   The site now uses the 4 parts of the Bible timeline in lib/timeline.ts.
   Parts are eras, not dates. Scholars disagree about exact dates, and
   readers only need to know where a story fits and what comes next. */
export const ACTS = [
  { n: 1, name: "Beginnings", books: "Genesis 1 to 11", href: "/bsb/genesis/1/", line: "God makes the world and people. People turn away. God keeps a promise." },
  { n: 2, name: "Promise and Rescue", books: "Genesis 12 to Deuteronomy", href: "/bsb/genesis/12/", line: "God chooses one family to bless the world, then rescues them from slavery." },
  { n: 3, name: "Kings and Prophets", books: "Joshua to Malachi", href: "/bsb/joshua/1/", line: "Israel gets kings. Prophets keep calling people back to God." },
  { n: 4, name: "Jesus Comes", books: "Matthew 1 to 4 and Luke 1 to 4", href: "/bsb/luke/1/", line: "God keeps the promise. Jesus is born." },
  { n: 5, name: "Jesus Teaches and Heals", books: "The Gospels", href: "/bsb/mark/1/", line: "Jesus teaches, heals, and welcomes people others left out." },
  { n: 6, name: "The Cross and the Empty Tomb", books: "The end of each Gospel", href: "/bsb/luke/22/", line: "Jesus dies on the cross and rises again." },
  { n: 7, name: "The Church Begins", books: "Acts to Revelation", href: "/bsb/acts/1/", line: "The Holy Spirit comes, and the good news spreads." },
];

export const STORIES: StoryEntry[] = [
  {
    slug: "the-beatitudes", family: "the-beatitudes", also: ["Blessed are", "Blessed are the poor in spirit", "Blessed are the meek", "Blessed are the peacemakers", "Blessed are those who mourn", "Sermon on the Mount", "Matthew 5"],
    act: 5, order: 121,
    title: "The Beatitudes", subtitle: "Jesus's \"Blessed are...\" sayings",
    ref: "Matthew 4:23 to 5:12",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "A crowd of sick and hurting people. Jesus tells them where God's favor rests.",
    status: "early",
    passage: { book: "matthew", chapter: 4, toChapter: 5 },
    feel: ["sad", "not-enough", "lonely"],
    memorize: { ref: "Matthew 5:4", text: "Blessed are those who mourn, for they will be comforted.", gaps: ["mourn", "comforted"], decoys: ["pray", "rewarded"] },
  },
  {
    slug: "david-and-goliath", family: "david-and-goliath", also: ["Goliath", "The giant", "Shepherd boy", "Sling and five stones", "The battle is the Lord's"],
    act: 3, order: 80,
    title: "David and Goliath", subtitle: "A shepherd boy faces a giant",
    ref: "1 Samuel 17",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A shepherd nobody expected. A giant everyone feared.",
    status: "early",
    passage: { book: "1-samuel", chapter: 17 },
    feel: ["afraid", "not-enough"],
    contentNote: "This story includes a battle. David kills Goliath and cuts off his head.",
    memorize: { ref: "1 Samuel 17:47", text: "The battle is the LORD's.", gaps: ["battle", "LORD's"], decoys: ["army", "king's"], part: true },
  },
  { slug: "sermon-on-the-mount", family: "sermon-on-the-mount", also: ["Matthew 5 to 7", "Salt and light", "The Lord's Prayer", "The Golden Rule", "Do not worry", "Love your enemies", "The narrow gate"], title: "The Sermon on the Mount", subtitle: "Jesus's longest teaching", ref: "Matthew 5 to 7", kind: "Teaching", lens: "story", level: "12+ and adult", desc: "Jesus's longest teaching, one section at a time.", status: "planned", passage: { book: "matthew", chapter: 5, toChapter: 7 }, feel: ["unsure"], act: 5, order: 120 },
  {
    slug: "jonah", family: "jonah", also: ["Jonah and the whale", "Jonah and the big fish", "Jonah and the fish", "The great fish", "Nineveh"],
    act: 3, order: 90,
    title: "Jonah", subtitle: "The prophet who ran away",
    ref: "Jonah 1 to 4",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A prophet who ran. A city God refused to give up on.",
    status: "early",
    passage: { book: "jonah", chapter: 1, toChapter: 4 },
    feel: ["angry", "guilty", "afraid"],
    contentNote: "This story includes a violent storm, and Jonah saying he wants to die.",
    memorize: { ref: "Jonah 2:9", text: "Salvation is from the LORD!", gaps: ["Salvation", "LORD!"], decoys: ["Mercy", "king!"], part: true },
  },
  {
    slug: "noahs-ark", family: "noahs-ark",
    also: ["Noah and the flood", "The flood", "Noah's flood", "The rainbow promise", "Two by two", "Noah and the dove", "The great flood", "Noah", "The ark", "Animals two by two"],
    act: 1, order: 20,
    title: "Noah's Ark", subtitle: "The flood and the promise",
    ref: "Genesis 6 to 9",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The world is full of violence. God keeps Noah safe and makes a promise.",
    status: "early",
    passage: { book: "genesis", chapter: 6, toChapter: 9 },
    feel: ["afraid", "sad", "unsure", "thankful"],
    contentNote: "God sends a flood, and people and animals die.",
    memorize: { ref: "Genesis 9:13", text: "I have set My rainbow in the clouds, and it will be a sign of the covenant between Me and the earth.", gaps: ["rainbow", "covenant"], decoys: ["ark", "promise"] },
  },
  {
    slug: "good-samaritan", family: "good-samaritan", also: ["Samaritan", "Who is my neighbor?", "Love your neighbor", "The Jericho road", "The man on the Jericho road"],
    act: 5, order: 140,
    title: "The Good Samaritan", subtitle: "Who is my neighbor?",
    ref: "Luke 10:25-37",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "You've heard \"be kind.\" That's not the main point.",
    status: "early",
    passage: { book: "luke", chapter: 10 }, parable: "good-samaritan",
    feel: ["lonely", "unsure", "angry"],
    contentNote: "In this story, robbers beat a man and leave him hurt by the road.",
    memorize: { ref: "Luke 10:27", text: "Love your neighbor as yourself.", gaps: ["neighbor", "yourself."], decoys: ["family", "friends."], part: true },
  },
  {
    slug: "zacchaeus", family: "zacchaeus", also: ["Zacchaeus the tax collector", "The man in the tree", "Sycamore tree", "Wee little man", "Seek and save the lost"],
    act: 5, order: 150,
    title: "Zacchaeus", subtitle: "The man in the tree",
    ref: "Luke 19:1-10",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A tax collector climbed a tree. Everything changed.",
    status: "early",
    passage: { book: "luke", chapter: 19 },
    feel: ["lonely", "guilty", "not-enough"],
    memorize: { ref: "Luke 19:10", text: "For the Son of Man came to seek and to save the lost.", gaps: ["seek", "lost."], decoys: ["judge", "poor."] },
  },
  {
    slug: "joseph-and-his-brothers", family: "joseph-and-his-brothers",
    also: ["Coat of many colors", "Joseph's coat", "Joseph in Egypt", "Joseph and Potiphar's wife", "Joseph's dreams", "Joseph forgives his brothers", "Genesis 50:20", "Joseph", "From the pit to the palace"],
    act: 2, order: 40,
    title: "Joseph and His Brothers", subtitle: "From the pit to the palace",
    ref: "Genesis 37 to 50",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "His brothers sold him. God turned it into rescue.",
    status: "early",
    passage: { book: "genesis", chapter: 37, toChapter: 50 },
    feel: ["angry", "lonely", "guilty", "sad"],
    contentNote: "This story includes a young man sold into slavery by his brothers, a woman pressuring him for sex and then lying about him, and years in prison.",
    memorize: { ref: "Genesis 50:20", text: "As for you, what you intended against me for evil, God intended for good", gaps: ["evil,", "good"], decoys: ["harm,", "you"], part: true },
  },
  {
    slug: "the-birth-of-jesus", family: "the-birth-of-jesus", also: ["The Christmas story", "Christmas", "Nativity", "Jesus is born", "The manger", "Shepherds and angels", "No room at the inn", "Luke 2"],
    act: 4, order: 100,
    title: "The Birth of Jesus", subtitle: "The first Christmas",
    ref: "Luke 2:1-21",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A king born in a feeding box. The news goes first to shepherds.",
    status: "early",
    passage: { book: "luke", chapter: 2 },
    feel: ["afraid", "lonely", "not-enough", "thankful"],
    memorize: { ref: "Luke 2:10", text: "I bring you good news of great joy that will be for all the people.", gaps: ["joy", "people."], decoys: ["peace", "kings."], part: true },
  },
  {
    slug: "creation-and-the-fall", family: "creation-and-the-fall", also: ["Adam and Eve", "Garden of Eden", "The creation story", "In the beginning", "Seven days of creation", "The Fall", "The serpent", "Forbidden fruit"],
    act: 1, order: 10,
    title: "Creation and the Fall", subtitle: "How it all began, and what went wrong",
    ref: "Genesis 1 to 3",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "God makes a good world. People stop trusting him. God comes looking.",
    status: "early",
    passage: { book: "genesis", chapter: 1, toChapter: 3 },
    feel: ["guilty", "not-enough", "unsure"],
    contentNote: "This story mentions being naked, pain in childbirth, and death.",
    memorize: { ref: "Genesis 1:31", text: "And God looked upon all that He had made, and indeed, it was very good.", gaps: ["made,", "good."], decoys: ["said,", "new."], part: true },
  },
  { slug: "hagar", family: "hagar", also: ["El Roi", "The God who sees me", "Ishmael", "Sarah and Hagar"], act: 2, order: 30, title: "Hagar", subtitle: "The God who sees me", ref: "Genesis 16", kind: "Story", lens: "story", level: "12+ and adult", desc: "A runaway servant in the desert. God finds her there.", status: "planned", passage: { book: "genesis", chapter: 16 }, feel: ["lonely"] },
  {
    slug: "moses-and-the-exodus", family: "moses-and-the-exodus", also: ["Moses", "The Exodus", "The burning bush", "The ten plagues", "Passover", "Let my people go", "Parting of the Red Sea", "Crossing the Red Sea", "Pharaoh"],
    act: 2, order: 50,
    title: "Moses and the Exodus", subtitle: "God sets his people free",
    ref: "Exodus 3 to 14",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A man with excuses. A king who won't listen. A sea that opens.",
    status: "early",
    passage: { book: "exodus", chapter: 3, toChapter: 14 },
    feel: ["not-enough", "afraid", "anxious"],
    contentNote: "This story includes slavery, plagues, the death of Egypt's firstborn sons, and an army drowning. It is told plainly, without graphic detail.",
    memorize: { ref: "Exodus 14:14", text: "The LORD will fight for you; you need only to be still.", gaps: ["fight", "still."], decoys: ["care", "strong."] },
  },
  {
    slug: "the-ten-commandments", family: "the-ten-commandments",
    also: ["Ten Commandments", "Exodus 20", "Decalogue", "the Law", "Mount Sinai", "Moses and the tablets", "the ten words", "Sinai", "God's law", "The Decalogue"],
    act: 2, order: 60,
    title: "The Ten Commandments", subtitle: "God's ten words for a free people",
    ref: "Exodus 20",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "The mountain shakes with thunder. God frees his people first, then speaks.",
    status: "early",
    passage: { book: "exodus", chapter: 19, toChapter: 20 },
    feel: ["afraid", "guilty", "not-enough"],
    contentNote: "This passage names murder and adultery, and it describes a frightening storm and warnings of death. The notes also talk about being hurt at home.",
    memorize: { ref: "Exodus 20:2", text: "I am the LORD your God, who brought you out of the land of Egypt, out of the house of slavery.", gaps: ["brought", "slavery."], decoys: ["called", "sorrow."] },
  },
  { slug: "god-calls-samuel", family: "god-calls-samuel", also: ["Samuel", "The call of Samuel", "Speak, for your servant is listening", "Eli and Samuel", "Samuel in the temple"], act: 3, order: 70, title: "God Calls Samuel", subtitle: "A boy hears his name at night", ref: "1 Samuel 3", kind: "Story", lens: "story", level: "12+ and adult", desc: "A boy hears his name in the dark. It isn't who he thinks.", status: "planned", passage: { book: "1-samuel", chapter: 3 }, feel: ["unsure", "not-enough"] },
  {
    slug: "psalm-23", family: "psalm-23",
    also: ["The Lord is my shepherd", "Valley of the shadow of death", "The shepherd psalm", "Green pastures", "Still waters", "Funeral psalm", "My cup overflows"],
    act: 3, order: 85,
    title: "Psalm 23", subtitle: "The Lord is my shepherd",
    ref: "Psalm 23",
    kind: "Poetry and Prayer", lens: "story", level: "12+ and adult",
    desc: "A shepherd sings about his own Shepherd. God stays with him in the darkest valley.",
    status: "early",
    passage: { book: "psalms", chapter: 23 },
    feel: ["afraid", "sad", "anxious"],
    contentNote: "This psalm talks about death and is often read at funerals.",
    memorize: { ref: "Psalm 23:1", text: "The LORD is my shepherd; I shall not want.", gaps: ["shepherd;", "want."], decoys: ["king;", "fall."], part: true },
  },
  { slug: "the-baptism-of-jesus", family: "the-baptism-of-jesus", also: ["Jesus is baptized", "John the Baptist", "The Jordan River", "This is my beloved Son", "The dove"], act: 4, order: 110, title: "The Baptism of Jesus", subtitle: "A voice from heaven", ref: "Matthew 3:13-17", kind: "Story", lens: "story", level: "12+ and adult", desc: "Jesus steps into the river. God speaks.", status: "planned", passage: { book: "matthew", chapter: 3 }, feel: ["not-enough"] },
  {
    slug: "jesus-calms-the-storm", family: "jesus-calms-the-storm", also: ["Jesus stills the storm", "Peace, be still", "Storm on the sea", "Sea of Galilee", "Even the wind and the sea obey him"],
    act: 5, order: 130,
    title: "Jesus Calms the Storm", subtitle: "Waves, a sleeping Jesus, and a question",
    ref: "Mark 4:35-41",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The boat is sinking. Jesus is asleep.",
    status: "early",
    passage: { book: "mark", chapter: 4 },
    feel: ["anxious", "afraid", "unsure"],
    memorize: { ref: "Mark 4:41", text: "Who is this, that even the wind and the sea obey Him?", gaps: ["wind", "obey"], decoys: ["rain", "follow"], part: true },
  },
  {
    slug: "the-last-supper", family: "the-last-supper",
    also: ["Lord's Supper", "Holy Communion", "Eucharist", "Upper Room", "Maundy Thursday", "Passover meal", "This is my body", "Peter's denial foretold", "The Lord's Supper", "Communion", "Bread and wine"],
    act: 6, order: 160,
    title: "The Last Supper", subtitle: "Jesus's last meal with his friends",
    ref: "Luke 22:7-34",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Jesus shares one last meal with his friends. He gives them bread and a cup, \"for you.\"",
    status: "early",
    passage: { book: "luke", chapter: 22 },
    feel: ["lonely", "sad", "guilty"],
    contentNote: "This story talks about betrayal and about Jesus's coming suffering and death.",
    memorize: { ref: "Luke 22:19", text: "This is My body, given for you; do this in remembrance of Me.", gaps: ["body,", "remembrance"], decoys: ["blood,", "honor"], part: true },
  },
  {
    slug: "the-empty-tomb", family: "the-empty-tomb", also: ["The Crucifixion", "Jesus on the cross", "Good Friday", "Easter", "The Resurrection", "He is risen", "Jesus dies", "Jesus rises", "The thief on the cross", "Father, forgive them"],
    act: 6, order: 170,
    title: "The Empty Tomb", subtitle: "The cross, and Easter morning",
    ref: "Luke 23:26 to 24:12",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Friday ends in darkness. Sunday morning, the stone is rolled away.",
    status: "early",
    passage: { book: "luke", chapter: 23, toChapter: 24 },
    feel: ["sad", "unsure", "guilty", "afraid"],
    contentNote: "This story tells how Jesus was put to death on a cross. It is told plainly, without graphic detail.",
    memorize: { ref: "Luke 24:6", text: "He is not here; He has risen!", gaps: ["here;", "risen!"], decoys: ["gone;", "sleeping!"], part: true },
  },
  { slug: "jesus-restores-peter", family: "jesus-restores-peter", also: ["Peter is forgiven", "Do you love me?", "Feed my sheep", "Breakfast on the beach", "John 21"], act: 6, order: 180, title: "Jesus Restores Peter", subtitle: "Three questions by the sea", ref: "John 21:1-19", kind: "Story", lens: "story", level: "12+ and adult", desc: "Peter said he never knew Jesus. Jesus makes him breakfast.", status: "planned", passage: { book: "john", chapter: 21 }, feel: ["guilty", "not-enough"] },
  {
    slug: "pentecost", family: "pentecost", also: ["The Holy Spirit comes", "Tongues of fire", "Acts 2", "Birthday of the church", "Peter's sermon", "Speaking in tongues"],
    act: 7, order: 190,
    title: "Pentecost", subtitle: "The Holy Spirit comes",
    ref: "Acts 2",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Wind, fire, and a crowd that hears in its own language.",
    status: "early",
    passage: { book: "acts", chapter: 2 },
    feel: ["lonely", "guilty", "unsure"],
    memorize: { ref: "Acts 2:21", text: "And everyone who calls on the name of the Lord will be saved.", gaps: ["everyone", "saved."], decoys: ["someone", "safe."], part: true },
  },
  { slug: "saul-on-the-road-to-damascus", family: "saul-on-the-road-to-damascus", also: ["Paul on the road", "The road to Damascus", "Damascus road", "The conversion of Paul", "Saul becomes Paul", "Acts 9"], act: 7, order: 200, title: "Saul on the Road to Damascus", subtitle: "An enemy of the church meets Jesus", ref: "Acts 9:1-19", kind: "Story", lens: "story", level: "12+ and adult", desc: "He hunted Christians. Then a light stopped him on the road.", status: "planned", passage: { book: "acts", chapter: 9 }, feel: ["guilty", "angry"] },
  {
    slug: "ruth-and-naomi", family: "ruth-and-naomi",
    also: ["Book of Ruth", "Where you go I will go", "Ruth and Boaz", "Naomi", "Call me Mara", "Kinsman redeemer", "Ruth the Moabite", "Boaz", "Ruth"],
    act: 3, order: 65,
    title: "Ruth and Naomi", subtitle: "Where you go, I will go",
    ref: "Ruth 1 to 4",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Naomi loses everything. Ruth refuses to leave her.",
    status: "early",
    passage: { book: "ruth", chapter: 1, toChapter: 4 },
    feel: ["sad", "lonely"],
    contentNote: "This story begins with the deaths of Naomi's husband and both of her sons.",
    memorize: { ref: "Ruth 1:16", text: "your people will be my people, and your God will be my God.", gaps: ["people,", "God."], decoys: ["family,", "home."], part: true },
  },
  {
    slug: "the-fiery-furnace", family: "the-fiery-furnace",
    also: ["Shadrach Meshach and Abednego", "Three Hebrew children", "Hananiah Mishael and Azariah", "Nebuchadnezzar golden statue", "Fourth man in the fire", "Even if He does not", "Daniel's three friends", "Shadrach, Meshach, and Abednego", "Shadrach Meshach Abednego", "The furnace"],
    act: 3, order: 92,
    title: "The Fiery Furnace", subtitle: "Three friends who would not bow",
    ref: "Daniel 3",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The king says bow or burn. Three friends will not bow.",
    status: "early",
    passage: { book: "daniel", chapter: 3 },
    feel: ["afraid", "anxious", "lonely", "unsure"],
    contentNote: "This story includes a threat to burn people alive and the deaths of the soldiers who threw the three friends into the fire.",
    memorize: { ref: "Daniel 3:17", text: "He is able to deliver us from the blazing fiery furnace and from your hand, O king.", gaps: ["able", "deliver"], decoys: ["ready", "protect"], part: true },
  },
  {
    slug: "daniel-in-the-lions-den", family: "daniel-in-the-lions-den",
    also: ["Daniel and the lions", "Lions' den", "Daniel 6", "King Darius", "Daniel prays", "Den of lions", "Dare to be a Daniel", "Daniel", "Lions den"],
    act: 3, order: 94,
    title: "Daniel in the Lions' Den", subtitle: "Praying when it is against the law",
    ref: "Daniel 6",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Praying is against the law. Daniel prays anyway.",
    status: "early",
    passage: { book: "daniel", chapter: 6 },
    feel: ["afraid", "anxious", "thankful"],
    contentNote: "This story includes a man thrown to lions, and near the end, whole families killed by lions at a king's command.",
    memorize: { ref: "Daniel 6:22", text: "My God sent His angel and shut the mouths of the lions.", gaps: ["angel", "lions."], decoys: ["prophet", "bears."], part: true },
  },
  {
    slug: "the-wise-men", family: "the-wise-men",
    also: ["The Magi", "Three Kings", "The Three Wise Men", "Epiphany", "Escape to Egypt", "Flight into Egypt", "Herod and the babies", "Holy Innocents", "Star of Bethlehem", "Gold, frankincense, and myrrh"],
    act: 4, order: 102,
    title: "The Wise Men", subtitle: "Following a star to a king",
    ref: "Matthew 2",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Strangers follow a star. A jealous king is watching.",
    status: "early",
    passage: { book: "matthew", chapter: 2 },
    feel: ["afraid", "sad", "lonely", "unsure"],
    contentNote: "King Herod orders the killing of young boys in Bethlehem. It is told plainly, without graphic detail.",
    memorize: { ref: "Matthew 2:10", text: "When they saw the star, they rejoiced with great delight.", gaps: ["star,", "delight."], decoys: ["king,", "wonder."] },
  },
  {
    slug: "water-into-wine", family: "water-into-wine",
    also: ["Wedding at Cana", "Marriage at Cana", "Jesus turns water into wine", "Cana miracle", "First miracle of Jesus", "Water to wine", "Six stone jars", "The wedding at Cana", "Cana", "Jesus's first miracle", "Turning water into wine"],
    act: 5, order: 112,
    title: "Water into Wine", subtitle: "Jesus's first sign, at a wedding",
    ref: "John 2:1-11",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The wedding runs out of wine. Jesus fills six jars.",
    status: "early",
    passage: { book: "john", chapter: 2 },
    feel: ["thankful", "not-enough", "unsure"],
    memorize: { ref: "John 2:11", text: "He thus revealed His glory, and His disciples believed in Him.", gaps: ["glory,", "believed"], decoys: ["power,", "followed"], part: true },
  },
  {
    slug: "nicodemus", family: "nicodemus",
    also: ["John 3:16", "Born again", "Born from above", "Nicodemus and Jesus", "Jesus and Nicodemus", "God so loved the world", "The bronze snake", "Born of water and the Spirit", "For God so loved the world"],
    act: 5, order: 114,
    title: "Nicodemus", subtitle: "A night visit and John 3:16",
    ref: "John 3:1-21",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A teacher comes to Jesus at night. Jesus talks about a new birth.",
    status: "early",
    passage: { book: "john", chapter: 3 },
    feel: ["unsure", "not-enough", "guilty", "thankful"],
    contentNote: "This story mentions deadly snakebites and Jesus's burial.",
    memorize: { ref: "John 3:16", text: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.", gaps: ["loved", "life."], decoys: ["judged", "rest."] },
  },
  {
    slug: "the-woman-at-the-well", family: "the-woman-at-the-well",
    also: ["Samaritan woman", "Woman of Samaria", "Jacob's well", "Living water", "Photini", "Jesus and the Samaritan woman", "Woman at the well John 4", "The Samaritan woman"],
    act: 5, order: 116,
    title: "The Woman at the Well", subtitle: "Jesus asks a stranger for a drink",
    ref: "John 4:1-42",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Jesus is tired and thirsty. A Samaritan woman comes to the well.",
    status: "early",
    passage: { book: "john", chapter: 4 },
    feel: ["lonely", "not-enough", "guilty"],
    memorize: { ref: "John 4:24", text: "God is Spirit, and His worshipers must worship Him in spirit and in truth.", gaps: ["Spirit,", "truth."], decoys: ["Light,", "power."] },
  },
  {
    slug: "the-lords-prayer", family: "the-lords-prayer",
    also: ["Our Father", "The Our Father", "Pater Noster", "The Model Prayer", "How to pray", "Sermon on the Mount prayer", "Luke 11:2-4", "Lord's Prayer"],
    act: 5, order: 122,
    title: "The Lord's Prayer", subtitle: "How Jesus taught us to pray",
    ref: "Matthew 6:5-15",
    kind: "Poetry and Prayer", lens: "story", level: "12+ and adult",
    desc: "Jesus teaches his friends to pray. It starts with \"Our Father.\"",
    status: "early",
    passage: { book: "matthew", chapter: 6 },
    feel: ["anxious", "unsure", "guilty"],
    memorize: { ref: "Matthew 6:11", text: "Give us this day our daily bread.", gaps: ["daily", "bread."], decoys: ["holy", "food."] },
  },
  {
    slug: "the-sower", family: "the-sower",
    also: ["Parable of the Sower", "Parable of the Soils", "The Four Soils", "Seeds and soil", "Good soil", "Farmer and the seed", "Mark 4"],
    act: 5, order: 125,
    title: "The Sower", subtitle: "Seeds, soil, and a surprising harvest",
    ref: "Mark 4:1-20",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "A farmer throws seed everywhere. Some of it grows a huge crop.",
    status: "early",
    passage: { book: "mark", chapter: 4 }, parable: "sower",
    feel: ["unsure", "not-enough"],
    memorize: { ref: "Isaiah 55:11", text: "so My word that proceeds from My mouth will not return to Me empty, but it will accomplish what I please", gaps: ["return", "accomplish"], decoys: ["come", "finish"], part: true },
  },
  {
    slug: "jesus-feeds-the-5000", family: "jesus-feeds-the-5000",
    also: ["Feeding the five thousand", "Feeding of the 5000", "Loaves and fishes", "Five loaves and two fish", "Boy with the loaves and fish", "Bread of life", "Miracle of the loaves", "Feeding the 5000", "Feeding of the five thousand", "Boy's lunch"],
    act: 5, order: 132,
    title: "Jesus Feeds the 5,000", subtitle: "Five loaves, two fish, and a crowd",
    ref: "John 6:1-15",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The crowd is huge. The lunch is tiny.",
    status: "early",
    passage: { book: "john", chapter: 6 },
    feel: ["not-enough", "anxious", "thankful"],
    memorize: { ref: "John 6:35", text: "I am the bread of life. Whoever comes to Me will never hunger", gaps: ["bread", "hunger"], decoys: ["light", "thirst"], part: true },
  },
  {
    slug: "jesus-walks-on-water", family: "jesus-walks-on-water",
    also: ["Peter walks on water", "Walking on water", "Jesus walks on the sea", "Peter sinks", "Lord, save me", "You of little faith", "Get out of the boat", "Take courage, it is I"],
    act: 5, order: 134,
    title: "Jesus Walks on Water", subtitle: "Peter steps out of the boat",
    ref: "Matthew 14:22-33",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Jesus walks on the sea at night. Peter starts to sink.",
    status: "early",
    passage: { book: "matthew", chapter: 14 },
    feel: ["afraid", "anxious", "unsure"],
    memorize: { ref: "Matthew 14:27", text: "Take courage! It is I. Do not be afraid.", gaps: ["courage!", "afraid."], decoys: ["heart!", "alone."], part: true },
  },
  {
    slug: "the-prodigal-son", family: "the-prodigal-son",
    also: ["The Lost Son", "The Running Father", "The Waiting Father", "The Two Sons", "The Loving Father", "Parable of the Prodigal Son", "The Older Brother"],
    act: 5, order: 145,
    title: "The Prodigal Son", subtitle: "A lost son and a running father",
    ref: "Luke 15:11-32",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "A son wastes it all and comes home. His father runs to meet him.",
    status: "early",
    passage: { book: "luke", chapter: 15 }, parable: "prodigal-son",
    feel: ["guilty", "lonely", "angry", "not-enough"],
    contentNote: "The older brother says his brother spent money on prostitutes, and the story includes hunger and a famine.",
    memorize: { ref: "Luke 15:20", text: "But while he was still in the distance, his father saw him and was filled with compassion. He ran to his son, embraced him, and kissed him.", gaps: ["compassion.", "ran"], decoys: ["anger.", "walked"], part: true },
  },
  {
    slug: "jesus-raises-lazarus", family: "jesus-raises-lazarus",
    also: ["Lazarus", "Raising of Lazarus", "Jesus wept", "Martha and Mary", "I am the resurrection and the life", "Lazarus come forth", "Bethany", "Shortest verse in the Bible", "Mary and Martha"],
    act: 5, order: 148,
    title: "Jesus Raises Lazarus", subtitle: "Jesus weeps, then calls a friend out",
    ref: "John 11:1-44",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Jesus's friend has died. Jesus cries, then calls him out of the tomb.",
    status: "early",
    passage: { book: "john", chapter: 11 },
    feel: ["sad", "lonely", "unsure"],
    contentNote: "This story is about the death of a close friend and his family's grief.",
    memorize: { ref: "John 11:25", text: "I am the resurrection and the life.", gaps: ["resurrection", "life."], decoys: ["promise", "light."], part: true },
  },
  {
    slug: "gethsemane", family: "gethsemane",
    also: ["Garden of Gethsemane", "Jesus prays in the garden", "Agony in the garden", "Judas betrays Jesus", "Judas kiss", "Arrest of Jesus", "Not my will but yours", "Peter cuts off an ear", "The Garden of Gethsemane", "Not my will", "Judas", "The betrayal", "The kiss", "Jesus is arrested", "Thirty pieces of silver"],
    act: 6, order: 162,
    title: "Gethsemane", subtitle: "Jesus prays, and Judas betrays him",
    ref: "Matthew 26:36-56",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Jesus is overwhelmed with sorrow. His friends fall asleep.",
    status: "early",
    passage: { book: "matthew", chapter: 26 },
    feel: ["anxious", "lonely", "afraid", "sad"],
    contentNote: "This story includes an arrest and a sword wound.",
    memorize: { ref: "Matthew 26:39", text: "Yet not as I will, but as You will.", gaps: ["not", "will."], decoys: ["now", "way."], part: true },
  },
  {
    slug: "peter-denies-jesus", family: "peter-denies-jesus",
    also: ["Peter's denial", "Peter denies Christ", "the rooster crows", "Peter weeps bitterly", "I do not know Him", "Peter in the courtyard", "denial of Peter", "I don't know him"],
    act: 6, order: 164,
    title: "Peter Denies Jesus", subtitle: "Three times, and a rooster crows",
    ref: "Luke 22:54-62",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Peter says he does not know Jesus. Then the rooster crows.",
    status: "early",
    passage: { book: "luke", chapter: 22 },
    feel: ["guilty", "afraid", "not-enough"],
    contentNote: "This story takes place on the night Jesus was arrested, the night before he was killed.",
    memorize: { ref: "Luke 22:32", text: "But I have prayed for you, Simon, that your faith will not fail.", gaps: ["prayed", "fail."], decoys: ["hoped", "fall."], part: true },
  },
];

/* ---------- Shelves ----------
   Inside each part of the Big Story, stories sit on shelves named the way
   people know them ("Miracles of Jesus", "Holy Week and Easter"). A shelf
   only shows when it has a story ready to read. */
export const SHELVES: { id: string; name: string }[] = [
  { id: "beginnings", name: "Beginnings" },
  { id: "ancestors", name: "The Ancestors" },
  { id: "moses", name: "Moses and the Wilderness" },
  { id: "kings", name: "Judges and Kings" },
  { id: "psalms", name: "Psalms and Prayers" },
  { id: "prophets", name: "The Prophets" },
  { id: "exile", name: "Exile and Return" },
  { id: "born", name: "Jesus Is Born" },
  { id: "miracles", name: "Miracles of Jesus" },
  { id: "meets", name: "Jesus Meets People" },
  { id: "teaches", name: "Jesus Teaches" },
  { id: "holy-week", name: "Holy Week and Easter" },
  { id: "church", name: "The Church Begins" },
];
const SHELF_OF: Record<string, string> = {
  "creation-and-the-fall": "beginnings", "noahs-ark": "beginnings",
  "hagar": "ancestors", "joseph-and-his-brothers": "ancestors",
  "moses-and-the-exodus": "moses", "the-ten-commandments": "moses",
  "ruth-and-naomi": "kings", "god-calls-samuel": "kings", "david-and-goliath": "kings",
  "psalm-23": "psalms",
  "jonah": "prophets",
  "the-fiery-furnace": "exile", "daniel-in-the-lions-den": "exile",
  "the-birth-of-jesus": "born", "the-wise-men": "born", "the-baptism-of-jesus": "born",
  "water-into-wine": "miracles", "jesus-calms-the-storm": "miracles", "jesus-feeds-the-5000": "miracles",
  "jesus-walks-on-water": "miracles", "jesus-raises-lazarus": "miracles",
  "nicodemus": "meets", "the-woman-at-the-well": "meets", "zacchaeus": "meets",
  "the-beatitudes": "teaches", "sermon-on-the-mount": "teaches", "the-lords-prayer": "teaches",
  "the-sower": "teaches", "good-samaritan": "teaches", "the-prodigal-son": "teaches",
  "the-last-supper": "holy-week", "gethsemane": "holy-week", "peter-denies-jesus": "holy-week",
  "the-empty-tomb": "holy-week", "jesus-restores-peter": "holy-week",
  "pentecost": "church", "saul-on-the-road-to-damascus": "church",
};
const SHELF_BY_ACT = ["", "beginnings", "ancestors", "kings", "born", "teaches", "holy-week", "church"];
export function shelfOf(s: StoryEntry) { return SHELF_OF[s.slug] || SHELF_BY_ACT[s.act] || "teaches"; }

/* ---------- helpers: every page asks these questions the same way ---------- */

/** All stories in Bible order. */
export function inBibleOrder() { return [...STORIES].sort((a, b) => a.order - b.order); }
export function actOf(s: StoryEntry) { return ACTS[s.act - 1]; }
/** The story just before and just after this one in the Big Story. */
export function bibleNeighbors(s: StoryEntry) {
  const all = inBibleOrder();
  const i = all.findIndex((x) => x.slug === s.slug);
  return { before: i > 0 ? all[i - 1] : null, after: i < all.length - 1 ? all[i + 1] : null };
}
/** The next story you can read now, in Bible order (wraps to the start). */
export function nextReadableInBible(s: StoryEntry) {
  const all = inBibleOrder().filter((x) => isReadable(x) && x.slug !== s.slug);
  return all.find((x) => x.order > s.order) || all[0] || null;
}
/** Another readable story that shares a feeling with this one. */
export function sameFeeling(s: StoryEntry, not: string[] = []) {
  const others = STORIES.filter((x) => isReadable(x) && x.slug !== s.slug && !not.includes(x.slug));
  let best: StoryEntry | null = null, score = 0;
  for (const o of others) {
    const n = o.feel.filter((f) => s.feel.includes(f)).length;
    if (n > score) { best = o; score = n; }
  }
  return best ? { story: best, feel: best.feel.find((f) => s.feel.includes(f))! } : null;
}

export function storyBySlug(slug: string) { return STORIES.find((s) => s.slug === slug) || null; }
export function isBuilt(s: StoryEntry) { return s.status !== "planned"; }
export function isReadable(s: StoryEntry) { return s.status === "live" || (s.status === "early" && SHOW_EARLY_EDITIONS); }
export function isIndexed(s: StoryEntry) { return s.status === "live"; }
export function readableStories() { return STORIES.filter(isReadable); }
export function plannedStories() { return STORIES.filter((s) => s.status === "planned"); }
export function siblings(s: StoryEntry) { return STORIES.filter((x) => x.family === s.family && x.slug !== s.slug && isReadable(x)); }
export function storyHref(s: StoryEntry) {
  if (isReadable(s)) return `/stories/${s.slug}/`;
  if (s.parable) return `/parables/${s.parable}/`;
  return `/bsb/${s.passage.book}/${s.passage.chapter}/`;
}
export function compareHref(s: StoryEntry, other = "bsb") {
  return `/compare/${s.passage.book}/${s.passage.chapter}/?a=story:${s.slug}&b=${other}`;
}
export function storiesForChapter(bookSlug: string, chapter: number) {
  return readableStories().filter(
    (s) => s.passage.book === bookSlug && chapter >= s.passage.chapter && chapter <= (s.passage.toChapter ?? s.passage.chapter)
  );
}
export function coverTone(kind: Kind) {
  return kind === "Teaching" ? "letters" : kind === "Poetry and Prayer" ? "poetry" : "narrative";
}
export function activeLenses(): Lens[] {
  const set = new Set(readableStories().map((s) => s.lens));
  return (Object.keys(LENSES) as Lens[]).filter((l) => set.has(l));
}
/* ---------- Reading time ----------
   Honest times: every word a reader will see in each step, at 150 words
   a minute (a careful pace for teens, English learners, and anyone who
   reads slowly). Drawers that start closed are not counted. */
const CLOSED_BOXES = new Set(["scene-card", "before-the-story", "map-of-the-story", "from-luther", "in-church"]);
const WPM = 150;
function slugifyBox(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export function stepWords(slug: string): { story: number; meaning: number; foryou: number } | null {
  const file = path.join(process.cwd(), "data", "stories", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const out = { story: 0, meaning: 0, foryou: 0 } as Record<string, number>;
  const zoneStep: Record<string, string> = { "the-story": "story", "understand-it": "meaning", "why-it-matters": "foryou" };
  let step = "story", box = "";
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (/^# /.test(line)) { step = zoneStep[slugifyBox(line.slice(2))] || step; box = ""; continue; }
    if (/^## /.test(line)) { box = slugifyBox(line.slice(3).replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "").replace(/[:"'].*$/, "")); continue; }
    if (CLOSED_BOXES.has(box) || /^\|[-| ]+\|?$/.test(line)) continue;
    const clean = line.replace(/\{v:[^}]*\}/g, "").replace(/::/g, " ").replace(/[|>#*\-]/g, " ");
    out[step] += clean.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  }
  return out as any;
}
const toMin = (w: number) => Math.max(1, Math.round(w / WPM));
export function stepMinutes(slug: string) {
  const w = stepWords(slug);
  if (!w) return null;
  const story = toMin(w.story), meaning = toMin(w.meaning), foryou = toMin(w.foryou), memorize = 2;
  return { story, meaning, foryou, memorize, total: story + meaning + foryou + memorize };
}
/** Word count of the Story step, for the listen and break markers. */
export function storyWords(slug: string) { return stepWords(slug)?.story || 0; }
/** Minutes for all four steps. */
export function storyMinutes(slug: string) { return stepMinutes(slug)?.total ?? null; }
/** The readable story just before this one in Bible order (no wrap). */
export function prevReadable(s: StoryEntry) {
  const all = inBibleOrder().filter((x) => isReadable(x) && x.order < s.order);
  return all.length ? all[all.length - 1] : null;
}
/** The readable story just after this one in Bible order (no wrap). */
export function nextReadable(s: StoryEntry) {
  return inBibleOrder().find((x) => isReadable(x) && x.order > s.order) || null;
}

/* ---------- Feelings ----------
   Words a teenager or an English learner would use. Every feeling must
   lead to at least one thing that is ready to read today. */
export const FEELINGS: { slug: string; label: string }[] = [
  { slug: "anxious", label: "Anxious" },
  { slug: "afraid", label: "Afraid" },
  { slug: "lonely", label: "Lonely" },
  { slug: "sad", label: "Sad or grieving" },
  { slug: "angry", label: "Angry" },
  { slug: "guilty", label: "Guilty" },
  { slug: "not-enough", label: "Not good enough" },
  { slug: "unsure", label: "Unsure about God" },
  { slug: "thankful", label: "Thankful" },
];

const NEED_FEEL: Record<string, string[]> = {
  fear: ["afraid", "anxious"], grief: ["sad"], strength: ["anxious", "not-enough"], guilt: ["guilty"],
  forgiveness: ["angry"], wisdom: ["unsure"], alone: ["lonely"], "racing-mind": ["anxious"],
  doubt: ["unsure"], angry: ["angry"], celebrate: ["thankful"], "new-baby": ["thankful"],
  gratitude: ["thankful"], "thinking-of-you": ["sad", "lonely"],
};
const THEME_FEEL: Record<string, string[]> = {
  "lost-and-found": ["lonely", "not-enough"], forgiveness: ["guilty", "angry"], neighbor: ["lonely"],
  kingdom: ["unsure"], prayer: ["anxious"], money: [], watchfulness: ["unsure"],
  reversal: ["not-enough"], foundations: ["unsure"],
};

/* ---------- The catalog: everything the Stories page lists ---------- */
export type CatKind = "Story" | "Teaching" | "Prayer" | "Parable" | "Verses";
export type CatStatus = "Ready" | "New";
export interface CatItem {
  id: string; kind: CatKind; title: string; subtitle: string; ref: string; desc: string;
  minutes: number | null; size: string; status: CatStatus; feel: string[]; href: string;
  note?: string; inside: { name: string; line: string }[];
  also?: string[];
  shelf?: string;
  act?: number; order?: number;
}

export const KIND_HELP: Record<CatKind, string> = {
  Story: "Something that happened",
  Teaching: "Something Jesus or God taught",
  Prayer: "A psalm or a prayer",
  Parable: "A short story Jesus told",
  Verses: "A few verses about one feeling",
};

const SBS_INSIDE = [
  { name: "1. Story:", line: "what happened, in short scenes, with each verse beside it." },
  { name: "2. Meaning:", line: "hard words and key lines, explained." },
  { name: "3. For you:", line: "tap an answer and see what it means for your life. No typing, no grades." },
  { name: "4. Memorize:", line: "one line to learn by heart." },
];

function wordsIn(verses: { t: string }[]) { return verses.reduce((n, v) => n + v.t.split(/\s+/).length, 0); }

export function catalog(): CatItem[] {
  const items: CatItem[] = [];
  for (const s of STORIES) {
    const ready = isReadable(s);
    /* Only stories you can read today. Nothing on the site says "coming soon":
       a story that isn't written yet is still found by site search, which
       opens its Bible passage (lib/search-terms.ts). */
    if (!ready) continue;
    const min = ready ? storyMinutes(s.slug) : null;
    items.push({
      id: `story-${s.slug}`, kind: s.kind === "Teaching" ? "Teaching" : s.kind === "Poetry and Prayer" ? "Prayer" : "Story", shelf: shelfOf(s),
      title: s.title, subtitle: s.subtitle, ref: s.ref, desc: s.desc,
      minutes: min, size: "", status: s.status === "early" ? "New" : "Ready",
      feel: s.feel, href: storyHref(s), note: s.contentNote, act: s.act, order: s.order, also: s.also,
      inside: SBS_INSIDE,
    });
  }
  for (const p of PARABLES as any[]) {
    if (STORIES.some((s) => s.parable === p.slug && isReadable(s))) continue;
    const [book, ch, sv, ev] = p.ref;
    const verses = pullRange("bsb", book, ch, sv, ev);
    const min = Math.max(2, Math.round(wordsIn(verses) / 180) + 1);
    const theme = (PARABLE_THEMES as any[]).find((t) => t.slug === p.theme);
    items.push({
      id: `parable-${p.slug}`, kind: "Parable", title: p.title,
      subtitle: theme ? theme.label : "A parable of Jesus",
      ref: `${book} ${ch}:${sv}-${ev}`, desc: p.cover || p.line,
      minutes: min, size: `${verses.length} verses`, status: "Ready",
      feel: THEME_FEEL[p.theme] || [], href: `/parables/${p.slug}/`, also: p.also || [],
      inside: [
        { name: "The point:", line: "the surprising part, in one or two sentences." },
        { name: "The parable", line: "in the Bible's own words." },
        { name: "Other Gospels", line: "that tell it too, when there are any." },
      ],
    });
  }
  for (const n of NEEDS as any[]) {
    items.push({
      id: `verses-${n.slug}`, kind: "Verses", title: n.short, subtitle: "Verses for how you feel",
      ref: `${n.passages.length} passages`, desc: n.card, minutes: 3, size: "",
      status: "Ready", feel: NEED_FEEL[n.slug] || [], href: `/read/${n.slug}/`,
      inside: [
        { name: `${n.passages.length} short passages,`, line: "each with one line about why it helps." },
        { name: "Send one", line: "to a friend with one tap." },
      ],
    });
  }
  return items;
}
