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
  {
    slug: "jonah", family: "jonah", also: ["Jonah", "Jonah and the big fish", "Jonah and the fish", "The great fish", "Nineveh", "The prophet who ran away"],
    act: 3, order: 90,
    title: "Jonah and the Whale", subtitle: "The prophet who ran away",
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
    desc: "An expert asks, \"Who is my neighbor?\" Jesus answers with a story about an unexpected helper.",
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
    desc: "A tax collector climbs a tree to see Jesus. Jesus calls him by name.",
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
    desc: "His brothers sold him. God turned their evil into rescue.",
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
  {
    slug: "hagar", family: "hagar",
    also: ["Hagar and Ishmael", "Hajar", "The God who sees me", "El Roi", "Beer-lahai-roi", "Sarah and Hagar", "Ishmael", "Genesis 16:13"],
    act: 2, order: 30,
    title: "Hagar", subtitle: "The God who sees me",
    ref: "Genesis 16 and 21",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Hagar is used, then sent away. God finds her in the desert.",
    status: "early",
    passage: { book: "genesis", chapter: 16, toChapter: 21 },
    feel: ["lonely", "afraid", "not-enough"],
    contentNote: "This story includes slavery, a woman used to bear a child, harsh mistreatment, and a mother and child near death in the desert.",
    memorize: { ref: "Genesis 16:13", text: "You are the God who sees me", gaps: ["God", "sees"], decoys: ["One", "hears"], part: true },
  },
  {
    slug: "the-ten-commandments", family: "the-ten-commandments",
    also: ["Ten Commandments", "Exodus 20", "Decalogue", "the Law", "Mount Sinai", "Moses and the tablets", "the ten words", "Sinai", "God's law", "The Decalogue"],
    act: 2, order: 60,
    title: "The Ten Commandments", subtitle: "God's ten words for a free people",
    ref: "Exodus 19:16 to 20:21",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "The mountain shakes with thunder. God frees his people first, then speaks.",
    status: "early",
    passage: { book: "exodus", chapter: 19, toChapter: 20 },
    feel: ["afraid", "guilty", "not-enough"],
    contentNote: "This passage names murder and adultery, and it describes a frightening storm and warnings of death. The notes also talk about being hurt at home.",
    memorize: { ref: "Exodus 20:2", text: "I am the LORD your God, who brought you out of the land of Egypt, out of the house of slavery.", gaps: ["brought", "slavery."], decoys: ["called", "sorrow."] },
  },
  {
    slug: "god-calls-samuel", family: "god-calls-samuel",
    also: ["Samuel in the temple", "Speak, Lord, for your servant is listening", "Here I am", "Samuel and Eli", "The call of Samuel", "Boy Samuel", "Hannah's son Samuel", "Samuel", "Speak, for your servant is listening", "Eli and Samuel"],
    act: 3, order: 70,
    title: "God Calls Samuel", subtitle: "A boy hears his name in the night",
    ref: "1 Samuel 3",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Samuel hears his name in the night. He thinks it is Eli, but it is God.",
    status: "early",
    passage: { book: "1-samuel", chapter: 3 },
    feel: ["unsure", "not-enough", "lonely"],
    contentNote: "This story includes God's judgment on a family for serious wrongdoing.",
    memorize: { ref: "1 Samuel 3:10", text: "Speak, for Your servant is listening.", gaps: ["servant", "listening."], decoys: ["child", "waiting."], part: true },
  },
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
  {
    slug: "the-baptism-of-jesus", family: "the-baptism-of-jesus",
    also: ["Jesus is baptized", "Baptism of Our Lord", "John the Baptist", "The dove and the voice", "This is my beloved Son", "Jesus at the Jordan", "Theophany", "Repent, for the kingdom of heaven is near", "The Jordan River", "The dove"],
    act: 4, order: 110,
    title: "The Baptism of Jesus", subtitle: "A voice from heaven at the river",
    ref: "Matthew 3",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "John says he is not good enough. God speaks from heaven.",
    status: "early",
    passage: { book: "matthew", chapter: 3 },
    feel: ["not-enough", "unsure"],
    memorize: { ref: "Matthew 3:17", text: "This is My beloved Son, in whom I am well pleased!", gaps: ["beloved", "pleased!"], decoys: ["chosen", "delighted!"], part: true },
  },
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
    slug: "jesus-restores-peter", family: "jesus-restores-peter",
    also: ["Peter restored", "Do you love me", "Feed my sheep", "breakfast on the beach", "153 fish", "Peter's restoration", "Jesus appears by the Sea of Galilee", "Follow Me", "Peter is forgiven", "Do you love me?", "John 21"],
    act: 6, order: 180,
    title: "Jesus Restores Peter", subtitle: "Breakfast on the beach, and three questions",
    ref: "John 21:1-19",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Peter had denied Jesus three times. Jesus makes him breakfast.",
    status: "early",
    passage: { book: "john", chapter: 21 },
    feel: ["guilty", "not-enough", "lonely"],
    contentNote: "Jesus hints at how Peter will die, and the story looks back on Peter's worst failure.",
    memorize: { ref: "John 21:15", text: "Simon son of John, do you love Me more than these?", gaps: ["love", "these?"], decoys: ["follow", "those?"], part: true },
  },
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
  {
    slug: "saul-on-the-road-to-damascus", family: "saul-on-the-road-to-damascus",
    also: ["Conversion of Paul", "Paul's conversion", "Damascus road", "Road to Damascus", "Saul becomes Paul", "Scales fell from his eyes", "Ananias and Saul", "Paul escapes in a basket", "Paul on the road", "The road to Damascus", "The conversion of Paul", "Acts 9"],
    act: 7, order: 200,
    title: "Saul on the Road to Damascus", subtitle: "An enemy meets Jesus",
    ref: "Acts 9:1-31",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Saul is hunting Jesus's followers. Jesus stops him on the road.",
    status: "early",
    passage: { book: "acts", chapter: 9 },
    feel: ["guilty", "angry", "unsure"],
    contentNote: "The story begins after Stephen is stoned to death, and includes threats, prison, and a plot to kill Saul.",
    memorize: { ref: "Acts 9:5", text: "I am Jesus, whom you are persecuting", gaps: ["Jesus,", "persecuting"], decoys: ["Lord,", "following"], part: true },
  },
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
    desc: "Strangers follow a star. A troubled king is watching.",
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
    act: 5, order: 121.6,
    title: "The Lord's Prayer", subtitle: "How Jesus taught us to pray",
    ref: "Matthew 6:5-15",
    kind: "Poetry and Prayer", lens: "story", level: "12+ and adult",
    desc: "Jesus teaches his disciples to pray. It starts with \"Our Father.\"",
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
    title: "Jesus Raises Lazarus", subtitle: "Jesus weeps, then calls his friend out of the tomb",
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
    desc: "Jesus is overwhelmed with sorrow. His disciples fall asleep.",
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
  {
    slug: "jesus-before-pilate", family: "jesus-before-pilate",
    also: ["trial of Jesus", "Jesus and Pilate", "Pontius Pilate", "Barabbas", "Jesus before Herod", "Crucify him", "Jesus before the Sanhedrin", "King of the Jews", "The trial of Jesus"],
    act: 6, order: 166,
    title: "Jesus Before Pilate", subtitle: "A trial, a crowd, and Barabbas",
    ref: "Luke 22:63 to 23:25",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Pilate finds no crime. Barabbas goes free instead.",
    status: "early",
    passage: { book: "luke", chapter: 22, toChapter: 23 },
    feel: ["angry", "lonely", "unsure"],
    contentNote: "Jesus is mocked, beaten, and sentenced to death, told without graphic detail.",
    memorize: { ref: "Luke 23:22", text: "I have found in Him no offense worthy of death.", gaps: ["offense", "death."], decoys: ["crime", "prison."], part: true },
  },
  {
    slug: "the-crucifixion", family: "the-crucifixion",
    also: ["Good Friday", "Jesus on the cross", "Jesus dies", "Death of Jesus", "The thief on the cross", "Father, forgive them", "Calvary", "Golgotha"],
    act: 6, order: 170,
    title: "The Crucifixion", subtitle: "Jesus dies on the cross",
    ref: "Luke 23:26-56",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Jesus is nailed to a cross. He prays for the people hurting him.",
    status: "early",
    passage: { book: "luke", chapter: 23 },
    feel: ["sad", "guilty", "lonely", "afraid"],
    contentNote: "This story tells how Jesus was put to death on a cross. It is told plainly, without graphic detail.",
    memorize: { ref: "Luke 23:34", text: "Father, forgive them, for they do not know what they are doing.", gaps: ["forgive", "doing."], decoys: ["help", "saying."], part: true },
  },
  {
    slug: "the-resurrection", family: "the-resurrection",
    also: ["The Empty Tomb", "Easter", "Easter morning", "He is risen", "Jesus rises", "Resurrection of Jesus", "The women at the tomb", "Peter runs to the tomb"],
    act: 6, order: 172,
    title: "The Resurrection", subtitle: "Easter morning: the tomb is empty",
    ref: "Luke 24:1-12",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The women bring spices to the tomb. Jesus is not there.",
    status: "early",
    passage: { book: "luke", chapter: 24 },
    feel: ["sad", "unsure", "afraid", "thankful"],
    memorize: { ref: "Luke 24:6", text: "He is not here; He has risen!", gaps: ["here;", "risen!"], decoys: ["gone;", "sleeping!"], part: true },
  },
  {
    slug: "the-road-to-emmaus", family: "the-road-to-emmaus",
    also: ["Road to Emmaus", "Emmaus road", "Walk to Emmaus", "Cleopas", "Supper at Emmaus", "Breaking of the bread", "Did not our hearts burn within us", "Stay with us", "Emmaus", "Hearts burning"],
    act: 6, order: 174,
    title: "The Road to Emmaus", subtitle: "Two friends walk with a stranger",
    ref: "Luke 24:13-35",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Two friends walk away sad. A stranger walks with them.",
    status: "early",
    passage: { book: "luke", chapter: 24 },
    feel: ["sad", "unsure", "lonely"],
    contentNote: "The two friends talk about Jesus's death on the cross, and they are grieving.",
    memorize: { ref: "Luke 24:32", text: "Were not our hearts burning within us as He spoke with us on the road", gaps: ["hearts", "road"], decoys: ["minds", "mountain"], part: true },
  },
  {
    slug: "baby-moses", family: "baby-moses",
    also: ["Moses in the basket", "Moses in the bulrushes", "Baby in the basket", "Shiphrah and Puah", "Hebrew midwives", "Pharaoh's daughter", "Moses in Midian", "Exodus 2"],
    act: 2, order: 45,
    title: "Baby Moses", subtitle: "A basket in the river",
    ref: "Exodus 1 to 2",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A king orders baby boys killed. Brave women save one of them.",
    status: "early",
    passage: { book: "exodus", chapter: 1, toChapter: 2 },
    feel: ["afraid", "lonely", "not-enough"],
    contentNote: "This story includes a king's order to kill baby boys, and Moses killing a man.",
    memorize: { ref: "Exodus 2:24", text: "So God heard their groaning, and He remembered His covenant with Abraham, Isaac, and Jacob.", gaps: ["groaning,", "covenant"], decoys: ["prayers,", "people"] },
  },
  {
    slug: "the-burning-bush", family: "the-burning-bush",
    also: ["Moses and the burning bush", "I AM WHO I AM", "God's name", "Here I am", "Holy ground", "The call of Moses", "Moses and Aaron", "Mount Horeb", "Moses"],
    act: 2, order: 50,
    title: "The Burning Bush", subtitle: "God calls Moses and tells his name",
    ref: "Exodus 3 to 4",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A bush burns but does not burn up. God calls a shepherd who says, \"Send someone else.\"",
    status: "early",
    passage: { book: "exodus", chapter: 3, toChapter: 4 },
    feel: ["not-enough", "afraid", "unsure"],
    contentNote: "This story mentions slavery, a killing in Moses's past, God's warnings of death, and a circumcision. It is told plainly, without graphic detail.",
    memorize: { ref: "Exodus 3:14", text: "I AM WHO I AM. This is what you are to say to the Israelites: ‘I AM has sent me to you.’", gaps: ["WHO", "sent"], decoys: ["WHAT", "called"], part: true },
  },
  {
    slug: "the-ten-plagues", family: "the-ten-plagues",
    also: ["Let my people go", "The plagues of Egypt", "Moses and Pharaoh", "Pharaoh's hard heart", "Bricks without straw", "Frogs and locusts", "Who is the LORD?", "Pharaoh"],
    act: 2, order: 52,
    title: "The Ten Plagues", subtitle: "A king says no, and God keeps his word",
    ref: "Exodus 5 to 11",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Pharaoh says no to God. Disaster after disaster hits Egypt.",
    status: "early",
    passage: { book: "exodus", chapter: 5, toChapter: 11 },
    feel: ["anxious", "angry", "unsure"],
    contentNote: "This story includes slavery, beatings, disasters, sickness, and the death of animals. It ends with a warning that Egypt's firstborn sons will die.",
    memorize: { ref: "Exodus 6:7", text: "I will take you as My own people, and I will be your God.", gaps: ["people,", "God."], decoys: ["servants,", "king."], part: true },
  },
  {
    slug: "the-passover", family: "the-passover",
    also: ["Passover", "The first Passover", "The Passover lamb", "The death of the firstborn", "The tenth plague", "Blood on the doorposts", "The Exodus", "Leaving Egypt"],
    act: 2, order: 54,
    title: "The Passover", subtitle: "The night God passed over",
    ref: "Exodus 12:1-42",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Blood on the door. A meal eaten in a hurry. By morning, God's people are free.",
    status: "early",
    passage: { book: "exodus", chapter: 12, toChapter: 13 },
    feel: ["afraid", "sad", "thankful"],
    contentNote: "This story includes the death of Egypt's firstborn sons and animals. It is told plainly, without graphic detail.",
    memorize: { ref: "Exodus 12:13", text: "When I see the blood, I will pass over you.", gaps: ["blood,", "over"], decoys: ["door,", "near"], part: true },
  },
  {
    slug: "crossing-the-red-sea", family: "crossing-the-red-sea",
    also: ["Parting of the Red Sea", "The LORD will fight for you", "The Red Sea", "Sea of Reeds", "Song of Moses", "Miriam's song", "Pillar of cloud and fire", "The Exodus"],
    act: 2, order: 56,
    title: "Crossing the Red Sea", subtitle: "God makes a path through the sea",
    ref: "Exodus 13:17 to 15:21",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The sea in front. An army behind. God opens a way through.",
    status: "early",
    passage: { book: "exodus", chapter: 14, toChapter: 15 },
    feel: ["afraid", "anxious", "thankful"],
    contentNote: "This story includes an army chasing people and drowning in the sea. It is told plainly, without graphic detail.",
    memorize: { ref: "Exodus 14:14", text: "The LORD will fight for you; you need only to be still.", gaps: ["fight", "still."], decoys: ["care", "strong."] },
  },
  {
    slug: "salt-and-light", family: "salt-and-light",
    also: ["Salt of the earth", "Light of the world", "Let your light shine", "City on a hill", "Lamp under a basket", "Hide it under a bushel", "Jesus fulfills the Law", "Sermon on the Mount"],
    act: 5, order: 121.2,
    title: "Salt and Light", subtitle: "You are the salt of the earth",
    ref: "Matthew 5:13-20",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "Jesus tells his followers who they are. Then he says he came to fulfill God's law.",
    status: "early",
    passage: { book: "matthew", chapter: 5 },
    feel: ["not-enough", "unsure"],
    memorize: { ref: "Matthew 5:14", text: "You are the light of the world.", gaps: ["light", "world."], decoys: ["salt", "earth."], part: true },
  },
  {
    slug: "love-your-enemies", family: "love-your-enemies",
    also: ["Turn the other cheek", "Go the extra mile", "Eye for an eye", "Love your enemy", "Be perfect", "Sermon on the Mount", "Luke 6:27-36"],
    act: 5, order: 121.4,
    title: "Love Your Enemies", subtitle: "Turn the other cheek, go the extra mile",
    ref: "Matthew 5:38-48",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "Someone hurts you. Jesus says not to get even.",
    status: "early",
    passage: { book: "matthew", chapter: 5 },
    feel: ["angry", "guilty"],
    contentNote: "This teaching talks about being slapped, sued, and forced to serve, and about people who hurt us.",
    memorize: { ref: "Matthew 5:44", text: "But I tell you, love your enemies and pray for those who persecute you,", gaps: ["enemies", "pray"], decoys: ["neighbors", "wait"] },
  },
  {
    slug: "do-not-worry", family: "do-not-worry",
    also: ["Consider the lilies", "Birds of the air", "Seek first the kingdom", "Treasures in heaven", "You cannot serve God and money", "Do not be anxious", "Sermon on the Mount worry", "Matthew 6:33"],
    act: 5, order: 121.7,
    title: "Do Not Worry", subtitle: "The birds of the air and the lilies",
    ref: "Matthew 6:19-34",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "People worry about food and clothes. Jesus says, \"Look at the birds.\"",
    status: "early",
    passage: { book: "matthew", chapter: 6 },
    feel: ["anxious", "afraid", "not-enough"],
    memorize: { ref: "Matthew 6:32", text: "Your heavenly Father knows that you need them.", gaps: ["Father", "knows"], decoys: ["Lord", "sees"], part: true },
  },
  {
    slug: "ask-seek-knock", family: "ask-seek-knock",
    also: ["The Golden Rule", "Do unto others", "Judge not", "Do not judge", "Speck and the beam", "Speck and the log", "Pearls before swine", "Ask and it will be given"],
    act: 5, order: 121.8,
    title: "Ask, Seek, Knock", subtitle: "Your Father gives good gifts",
    ref: "Matthew 7:1-12",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "Jesus says, \"Do not judge.\" Then he says, \"Ask, and it will be given.\"",
    status: "early",
    passage: { book: "matthew", chapter: 7 },
    feel: ["unsure", "lonely", "angry"],
    memorize: { ref: "Matthew 7:7", text: "Ask, and it will be given to you; seek, and you will find; knock, and the door will be opened to you.", gaps: ["seek,", "knock,"], decoys: ["wait,", "hope,"] },
  },
  {
    slug: "the-wise-and-foolish-builders", family: "the-wise-and-foolish-builders",
    also: ["House on the rock", "Wise man and foolish man", "Wise man built his house upon the rock", "Two builders", "Narrow gate", "By their fruit", "Lord, Lord", "End of the Sermon on the Mount", "The narrow gate"],
    act: 5, order: 121.9,
    title: "The Wise and Foolish Builders", subtitle: "A house on the rock, a house on the sand",
    ref: "Matthew 7:13-29",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "The storm hits both houses. Only one stands.",
    status: "early",
    passage: { book: "matthew", chapter: 7 }, parable: "wise-and-foolish-builders",
    feel: ["afraid", "unsure", "not-enough"],
    memorize: { ref: "Matthew 7:24", text: "Everyone who hears these words of Mine and acts on them is like a wise man who built his house on the rock.", gaps: ["wise", "rock."], decoys: ["strong", "hill."], part: true },
  },
  {
    slug: "cain-and-abel", family: "cain-and-abel",
    also: ["Cain killed Abel", "The first murder", "Am I my brother's keeper", "My brother's keeper", "The mark of Cain", "Cain and Abel's offerings", "Abel's blood", "Am I my brother's keeper?", "The first brothers"],
    act: 1, order: 12,
    title: "Cain and Abel", subtitle: "Two brothers, and the first murder",
    ref: "Genesis 4:1-16",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Cain is angry, and he kills his brother. God warns him, then protects him.",
    status: "early",
    passage: { book: "genesis", chapter: 4 },
    feel: ["angry", "guilty", "lonely"],
    contentNote: "A brother kills his brother.",
    memorize: { ref: "Genesis 4:7", text: "sin is crouching at your door; it desires you, but you must master it.", gaps: ["crouching", "master"], decoys: ["knocking", "fear"], part: true },
  },
  {
    slug: "the-tower-of-babel", family: "the-tower-of-babel",
    also: ["Babel", "Tower of Babel", "Confusion of tongues", "Where languages came from", "Babylon tower", "Ziggurat", "Make a name for ourselves", "Many languages"],
    act: 1, order: 22,
    title: "The Tower of Babel", subtitle: "A tower to the heavens, and many languages",
    ref: "Genesis 11:1-9",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "People build a tower to the sky. God comes down.",
    status: "early",
    passage: { book: "genesis", chapter: 11 },
    feel: ["unsure", "lonely"],
    memorize: { ref: "Genesis 11:5", text: "Then the LORD came down to see the city and the tower that the sons of men were building.", gaps: ["down", "tower"], decoys: ["up", "temple"] },
  },
  {
    slug: "gods-promise-to-abraham", family: "gods-promise-to-abraham",
    also: ["The call of Abram", "Abraham and the stars", "Count the stars", "God's covenant with Abraham", "Abram leaves Haran", "Father Abraham", "Justified by faith", "Abraham believed God", "Abram", "Stars in the sky", "The covenant with Abraham"],
    act: 2, order: 25,
    title: "God's Promise to Abraham", subtitle: "Count the stars",
    ref: "Genesis 12 and 15",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Abram leaves home because God told him to. Later, God shows him the stars.",
    status: "early",
    passage: { book: "genesis", chapter: 12, toChapter: 15 },
    feel: ["unsure", "not-enough", "anxious"],
    memorize: { ref: "Genesis 15:6", text: "Abram believed the LORD, and it was credited to him as righteousness.", gaps: ["believed", "righteousness."], decoys: ["obeyed", "goodness."] },
  },
  {
    slug: "abraham-and-isaac", family: "abraham-and-isaac",
    also: ["The binding of Isaac", "The Akedah", "Abraham sacrifices Isaac", "Abraham's test", "The LORD will provide", "Jehovah Jireh", "The ram in the thicket", "God will provide", "Mount Moriah"],
    act: 2, order: 32,
    title: "Abraham and Isaac", subtitle: "God will provide the lamb",
    ref: "Genesis 22:1-19",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "God tests Abraham. God stops him and provides a ram.",
    status: "early",
    passage: { book: "genesis", chapter: 22 },
    feel: ["afraid", "unsure"],
    contentNote: "A father is told to offer his son as a sacrifice, but God stops him and the son is not harmed.",
    memorize: { ref: "Genesis 22:8", text: "God Himself will provide the lamb for the burnt offering, my son.", gaps: ["provide", "lamb"], decoys: ["find", "ram"], part: true },
  },
  {
    slug: "jacob-and-esau", family: "jacob-and-esau",
    also: ["Esau sells his birthright", "Bowl of stew", "Lentil stew", "The stolen blessing", "Isaac blesses Jacob", "Jacob I loved, Esau I hated", "Rebekah and her twins", "Jacob the deceiver", "The birthright", "Red stew", "Twins"],
    act: 2, order: 35,
    title: "Jacob and Esau", subtitle: "Twin brothers, a stolen blessing",
    ref: "Genesis 25 and 27",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Jacob tricks his blind father. His brother Esau plans to kill him.",
    status: "early",
    passage: { book: "genesis", chapter: 25, toChapter: 27 },
    feel: ["angry", "guilty", "lonely"],
    contentNote: "This story includes lies inside a family and a brother who plans to kill his brother.",
    memorize: { ref: "Genesis 28:15", text: "Look, I am with you, and I will watch over you wherever you go", gaps: ["with", "wherever"], decoys: ["near", "whenever"], part: true },
  },
  {
    slug: "the-walls-of-jericho", family: "the-walls-of-jericho",
    also: ["Joshua and the battle of Jericho", "Joshua fit the battle of Jericho", "Rahab and the spies", "Rahab", "The scarlet cord", "The fall of Jericho", "Jericho walls fall down", "Joshua and Jericho", "Battle of Jericho", "The walls came tumbling down"],
    act: 3, order: 62,
    title: "The Walls of Jericho", subtitle: "Trumpets, a shout, and falling walls",
    ref: "Joshua 2 and 6",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Rahab hides two spies. The walls of Jericho fall.",
    status: "early",
    passage: { book: "joshua", chapter: 2, toChapter: 6 },
    feel: ["afraid", "unsure"],
    contentNote: "Israel destroys Jericho, and the Bible says they killed everyone in the city except Rahab's family.",
    memorize: { ref: "Joshua 2:11", text: "the LORD your God is God in the heavens above and on the earth below.", gaps: ["heavens", "below."], decoys: ["mountains", "beneath."], part: true },
  },
  {
    slug: "samson-and-delilah", family: "samson-and-delilah",
    also: ["Samson", "Delilah", "Samson's hair", "Samson and the pillars", "Samson the strong man", "The temple of Dagon", "Nazirite vow"],
    act: 3, order: 64,
    title: "Samson and Delilah", subtitle: "A strong man with a secret",
    ref: "Judges 16",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Samson tells Delilah his secret. He loses everything, but God still hears him.",
    status: "early",
    passage: { book: "judges", chapter: 13, toChapter: 16 },
    feel: ["guilty", "angry", "lonely"],
    contentNote: "This story includes violence, betrayal, a man being blinded, and Samson choosing a death that kills him and many other people. If you are thinking about ending your life, call or text 988 in the U.S., or find a free helpline at findahelpline.com.",
    memorize: { ref: "Judges 16:28", text: "O Lord GOD, please remember me.", gaps: ["remember", "me."], decoys: ["forgive", "us."], part: true },
  },
  {
    slug: "elijah-on-mount-carmel", family: "elijah-on-mount-carmel",
    also: ["Elijah and the prophets of Baal", "Fire from heaven", "Still small voice", "Gentle whisper", "Elijah under the broom tree", "Elijah and Jezebel", "Mount Carmel", "How long will you waver", "Elijah", "Prophets of Baal", "Elijah Hears a Gentle Whisper", "Elijah in the cave"],
    act: 3, order: 88,
    title: "Elijah on Mount Carmel", subtitle: "Fire from heaven, and a still, small voice",
    ref: "1 Kings 18:17 to 19:18",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Fire falls on the mountain. Then God comes quietly to a tired prophet.",
    status: "early",
    passage: { book: "1-kings", chapter: 18, toChapter: 19 },
    feel: ["afraid", "lonely", "sad", "anxious"],
    contentNote: "This story includes people cutting themselves, the killing of the prophets of Baal, and a man who asks to die. It is told plainly, without graphic detail.",
    memorize: { ref: "1 Kings 19:12", text: "And after the fire came a still, small voice.", gaps: ["still,", "voice."], decoys: ["loud,", "wind."], part: true },
  },
  {
    slug: "esther", family: "esther",
    also: ["Queen Esther", "Book of Esther", "For such a time as this", "If I perish, I perish", "Mordecai", "Haman", "Purim", "King Xerxes"],
    act: 3, order: 96,
    title: "Esther", subtitle: "For such a time as this",
    ref: "Esther 2 to 8",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A plan to destroy a whole people. A queen who is afraid.",
    status: "early",
    passage: { book: "esther", chapter: 2, toChapter: 8 },
    feel: ["afraid", "not-enough"],
    contentNote: "This story includes a plan to kill a whole people, men hanged on gallows, and a brief mention of the killing in chapter 9.",
    memorize: { ref: "Esther 4:14", text: "who knows if perhaps you have come to the kingdom for such a time as this?", gaps: ["kingdom", "this?"], decoys: ["palace", "now?"], part: true },
  },
  {
    slug: "the-angel-visits-mary", family: "the-angel-visits-mary",
    also: ["The Annunciation", "Gabriel and Mary", "Mary and Elizabeth", "The Visitation", "The Magnificat", "Mary's Song", "Nothing is impossible with God", "Hail Mary", "Gabriel", "Mary, mother of Jesus", "My soul magnifies the Lord"],
    act: 4, order: 98,
    title: "The Angel Visits Mary", subtitle: "No word from God will ever fail",
    ref: "Luke 1:26-56",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "An angel brings Mary surprising news. She sings about a God who lifts the lowly.",
    status: "early",
    passage: { book: "luke", chapter: 1 },
    feel: ["afraid", "not-enough", "thankful"],
    memorize: { ref: "Luke 1:37", text: "For no word from God will ever fail.", gaps: ["word", "fail."], decoys: ["promise", "end."] },
  },
  {
    slug: "josephs-dream", family: "josephs-dream",
    also: ["Joseph and the Angel", "Immanuel", "God with Us", "Joseph's Choice", "The Annunciation to Joseph", "Saint Joseph", "Advent 4"],
    act: 4, order: 99,
    title: "Joseph's Dream", subtitle: "Joseph chooses to stay",
    ref: "Matthew 1:18-25",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Joseph plans to leave quietly. An angel says, \"Do not be afraid.\"",
    status: "early",
    passage: { book: "matthew", chapter: 1 },
    feel: ["unsure", "afraid"],
    memorize: { ref: "Matthew 1:21", text: "You are to give Him the name Jesus, because He will save His people from their sins.", gaps: ["Jesus,", "sins."], decoys: ["Joseph,", "enemies."], part: true },
  },
  {
    slug: "jesus-calls-the-fishermen", family: "jesus-calls-the-fishermen",
    also: ["Calling of the disciples", "Fishers of men", "The miraculous catch of fish", "Simon Peter called", "Go away from me, Lord", "Catch men", "Launch out into the deep", "Lake of Gennesaret", "The big catch of fish", "Miraculous catch of fish", "Simon Peter", "Andrew", "James and John"],
    act: 5, order: 111,
    title: "Jesus Calls the Fishermen", subtitle: "Nets full of fish, and a new job",
    ref: "Luke 5:1-11",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "They fished all night and caught nothing. Jesus says to try again.",
    status: "early",
    passage: { book: "luke", chapter: 5 },
    feel: ["not-enough", "guilty", "unsure"],
    memorize: { ref: "Luke 5:5", text: "But because You say so, I will let down the nets.", gaps: ["say", "nets."], decoys: ["ask", "boats."], part: true },
  },
  {
    slug: "jesus-heals-the-paralyzed-man", family: "jesus-heals-the-paralyzed-man",
    also: ["Healing of the paralytic", "Jesus heals the paralytic", "Through the roof", "Four friends lower a man through the roof", "Man lowered through the roof", "Paralyzed man and his friends", "Your sins are forgiven", "Four friends", "The paralytic", "Lowered through the roof"],
    act: 5, order: 117,
    title: "Jesus Heals the Paralyzed Man", subtitle: "Four men and a hole in the roof",
    ref: "Mark 2:1-12",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The house is full. Four men open the roof.",
    status: "early",
    passage: { book: "mark", chapter: 2 },
    feel: ["not-enough", "lonely", "guilty"],
    memorize: { ref: "Mark 2:5", text: "Son, your sins are forgiven.", gaps: ["sins", "forgiven."], decoys: ["debts", "forgotten."], part: true },
  },
  {
    slug: "jairus-daughter", family: "jairus-daughter",
    also: ["Jairus", "Talitha koum", "Talitha cumi", "Woman with the issue of blood", "Woman who touched Jesus's cloak", "Little girl, get up", "Your faith has healed you", "Jesus raises a girl from the dead", "The Woman Who Touched Jesus's Cloak", "Hem of his garment"],
    act: 5, order: 131,
    title: "Jairus's Daughter", subtitle: "A girl, a woman, and a touch of faith",
    ref: "Mark 5:21-43",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "A father's little girl is dying. On the way, a sick woman touches Jesus.",
    status: "early",
    passage: { book: "mark", chapter: 5 },
    feel: ["afraid", "sad", "lonely", "not-enough"],
    contentNote: "This story tells of a long illness and a child's death, and Jesus raises her to life.",
    memorize: { ref: "Mark 5:36", text: "Do not be afraid; just believe.", gaps: ["afraid;", "believe."], decoys: ["alone;", "pray."], part: true },
  },
  {
    slug: "the-lost-sheep-and-the-lost-coin", family: "the-lost-sheep-and-the-lost-coin",
    also: ["The Lost Sheep", "The Lost Coin", "Parable of the lost sheep", "Parable of the lost coin", "The ninety-nine", "Leaving the ninety-nine", "The woman and the lost coin", "Joy in heaven"],
    act: 5, order: 144,
    title: "The Lost Sheep and the Lost Coin", subtitle: "What was lost is found",
    ref: "Luke 15:1-10",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "One sheep and one coin are lost. Someone searches until both are found.",
    status: "early",
    passage: { book: "luke", chapter: 15 }, parable: "lost-sheep",
    feel: ["lonely", "not-enough", "guilty"],
    memorize: { ref: "Luke 15:10", text: "There is joy in the presence of God's angels over one sinner who repents.", gaps: ["joy", "repents."], decoys: ["peace", "returns."], part: true },
  },
  {
    slug: "palm-sunday", family: "palm-sunday",
    also: ["Triumphal Entry", "Jesus enters Jerusalem", "Hosanna", "Jesus rides a donkey", "Cleansing of the temple", "Jesus clears the temple", "Money changers", "Passion Sunday", "The Triumphal Entry", "Cleansing the temple", "Turning over the tables", "Den of robbers"],
    act: 6, order: 155,
    title: "Palm Sunday", subtitle: "A king rides in on a donkey",
    ref: "Matthew 21:1-17",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "The crowd shouts, \"Hosanna!\" Then Jesus turns over tables in the temple.",
    status: "early",
    passage: { book: "matthew", chapter: 21 },
    feel: ["thankful", "angry", "unsure"],
    memorize: { ref: "Matthew 21:5", text: "See, your King comes to you, gentle and riding on a donkey", gaps: ["King", "gentle"], decoys: ["Lord", "mighty"], part: true },
  },
  {
    slug: "the-talents", family: "the-talents",
    also: ["Parable of the talents", "Five talents", "Buried talent", "Well done, good and faithful servant", "Parable of the bags of gold", "Enter into the joy of your master", "Hiding your talent", "Matthew 25:21"],
    act: 5, order: 157,
    title: "The Talents", subtitle: "Three servants and their master's money",
    ref: "Matthew 25:14-30",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "A master trusts three servants with his money. One is afraid and buries it.",
    status: "early",
    passage: { book: "matthew", chapter: 25 }, parable: "talents",
    feel: ["afraid", "not-enough", "anxious"],
    contentNote: "This parable ends with a hard picture of a servant thrown out into the darkness.",
    memorize: { ref: "Matthew 25:21", text: "Well done, good and faithful servant!", gaps: ["faithful", "servant!"], decoys: ["successful", "worker!"], part: true },
  },
  {
    slug: "the-sheep-and-the-goats", family: "the-sheep-and-the-goats",
    also: ["The least of these", "Final judgment", "Last Judgment", "I was hungry and you fed me", "Parable of the sheep and goats", "Christ the King Sunday", "Matthew 25:40", "Whatever you did for the least of these"],
    act: 5, order: 158,
    title: "The Sheep and the Goats", subtitle: "When did we see you hungry?",
    ref: "Matthew 25:31-46",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "The King gathers all the nations. He says, \"You did it for Me.\"",
    status: "early",
    passage: { book: "matthew", chapter: 25 }, parable: "sheep-and-goats",
    feel: ["guilty", "not-enough", "unsure"],
    contentNote: "This teaching speaks of God's final judgment, eternal fire, and eternal punishment.",
    memorize: { ref: "Matthew 25:40", text: "Whatever you did for one of the least of these brothers of Mine, you did for Me.", gaps: ["least", "Me."], decoys: ["best", "God."], part: true },
  },
  {
    slug: "mary-magdalene-sees-jesus", family: "mary-magdalene-sees-jesus",
    also: ["Mary Magdalene", "Noli me tangere", "Do not cling to me", "Touch me not", "Rabboni", "Jesus appears to Mary", "Easter morning in John", "The gardener", "Apostle to the apostles", "Mary Magdalene at the tomb", "Easter morning"],
    act: 6, order: 173,
    title: "Mary Magdalene Sees Jesus", subtitle: "She thought he was the gardener",
    ref: "John 20:1-18",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Mary cries outside the empty tomb. Then someone says her name.",
    status: "early",
    passage: { book: "john", chapter: 20 },
    feel: ["sad", "lonely", "thankful"],
    contentNote: "This story includes deep grief after a death.",
    memorize: { ref: "John 20:18", text: "I have seen the Lord!", gaps: ["seen", "Lord!"], decoys: ["found", "gardener!"], part: true },
  },
  {
    slug: "doubting-thomas", family: "doubting-thomas",
    also: ["Thomas", "Didymus", "My Lord and my God", "Jesus appears to the disciples", "Put your finger here", "Second Sunday of Easter", "Blessed are those who have not seen", "Doubt and faith", "Unless I see"],
    act: 6, order: 176,
    title: "Doubting Thomas", subtitle: "Unless I see, I will not believe",
    ref: "John 20:19-31",
    kind: "Story", lens: "story", level: "12+ and adult",
    desc: "Thomas missed seeing Jesus alive. A week later, Jesus comes back for him.",
    status: "early",
    passage: { book: "john", chapter: 20 },
    feel: ["unsure", "lonely", "afraid"],
    contentNote: "This story mentions the wounds from Jesus's crucifixion.",
    memorize: { ref: "John 20:29", text: "blessed are those who have not seen and yet have believed.", gaps: ["seen", "believed."], decoys: ["heard", "obeyed."], part: true },
  },
  {
    slug: "the-love-chapter", family: "the-love-chapter",
    also: ["1 Corinthians 13", "Love is patient", "Love is kind", "Wedding reading", "Faith, hope, and love", "Through a glass darkly", "Charity", "The greatest of these is love"],
    act: 7, order: 210,
    title: "The Love Chapter", subtitle: "Love is patient, love is kind",
    ref: "1 Corinthians 13",
    kind: "Teaching", lens: "story", level: "12+ and adult",
    desc: "A church is divided and arguing about spiritual gifts. Paul shows them a better way.",
    status: "early",
    passage: { book: "1-corinthians", chapter: 13 },
    feel: ["lonely", "not-enough", "thankful"],
    contentNote: "This page talks about staying safe when someone hurts you.",
    memorize: { ref: "1 Corinthians 13:4", text: "Love is patient, love is kind.", gaps: ["patient,", "kind."], decoys: ["proud,", "loud."], part: true },
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
  { id: "letters", name: "The Letters" },
];
const SHELF_OF: Record<string, string> = {
  "cain-and-abel": "beginnings",
  "the-tower-of-babel": "beginnings",
  "gods-promise-to-abraham": "ancestors",
  "abraham-and-isaac": "ancestors",
  "jacob-and-esau": "ancestors",
  "the-walls-of-jericho": "kings",
  "samson-and-delilah": "kings",
  "elijah-on-mount-carmel": "prophets",
  "esther": "exile",
  "the-angel-visits-mary": "born",
  "josephs-dream": "born",
  "jesus-calls-the-fishermen": "meets",
  "jesus-heals-the-paralyzed-man": "miracles",
  "jairus-daughter": "miracles",
  "the-lost-sheep-and-the-lost-coin": "teaches",
  "palm-sunday": "holy-week",
  "the-talents": "teaches",
  "the-sheep-and-the-goats": "teaches",
  "mary-magdalene-sees-jesus": "holy-week",
  "doubting-thomas": "holy-week",
  "the-love-chapter": "letters",
  "creation-and-the-fall": "beginnings", "noahs-ark": "beginnings",
  "hagar": "ancestors", "joseph-and-his-brothers": "ancestors",
  "baby-moses": "moses", "the-burning-bush": "moses", "the-ten-plagues": "moses", "the-passover": "moses",
  "crossing-the-red-sea": "moses", "the-ten-commandments": "moses",
  "ruth-and-naomi": "kings", "god-calls-samuel": "kings", "david-and-goliath": "kings",
  "psalm-23": "psalms",
  "jonah": "prophets",
  "the-fiery-furnace": "exile", "daniel-in-the-lions-den": "exile",
  "the-birth-of-jesus": "born", "the-wise-men": "born", "the-baptism-of-jesus": "born",
  "water-into-wine": "miracles", "jesus-calms-the-storm": "miracles", "jesus-feeds-the-5000": "miracles",
  "jesus-walks-on-water": "miracles", "jesus-raises-lazarus": "miracles",
  "nicodemus": "meets", "the-woman-at-the-well": "meets", "zacchaeus": "meets",
  "the-beatitudes": "teaches", "salt-and-light": "teaches", "love-your-enemies": "teaches", "the-lords-prayer": "teaches",
  "do-not-worry": "teaches", "ask-seek-knock": "teaches", "the-wise-and-foolish-builders": "teaches",
  "the-sower": "teaches", "good-samaritan": "teaches", "the-prodigal-son": "teaches",
  "the-last-supper": "holy-week", "gethsemane": "holy-week", "peter-denies-jesus": "holy-week",
  "jesus-before-pilate": "holy-week", "the-crucifixion": "holy-week", "the-resurrection": "holy-week",
  "the-road-to-emmaus": "holy-week", "jesus-restores-peter": "holy-week",
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
