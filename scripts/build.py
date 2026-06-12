#!/usr/bin/env python3
"""
freescripture.org, build script
Generates the complete static site from KJV source JSON.
Outputs to /public/

Usage: python3 build.py
"""

import json
import os
import re
import shutil
from pathlib import Path
from html import escape

# ============================================================
# Paths
# ============================================================
ROOT = Path(__file__).resolve().parent.parent
SOURCE_KJV = ROOT / "source-kjv"
SOURCE_APOCRYPHA = ROOT / "content" / "apocrypha"
SOURCE_ASV = ROOT / "content" / "asv"
SOURCE_BBE = ROOT / "content" / "bbe"
SOURCE_WEB = ROOT / "content" / "web"
PUBLIC = ROOT / "public"
STATIC = ROOT / "static"

# ============================================================
# Translation registry — single source of truth for what's published
# ============================================================
# slug:           url segment (e.g. "kjv" → /kjv/)
# label:          short display name in UI ("King James Version")
# short:          very short label for switcher buttons ("KJV")
# year:           published year
# description:    one-line summary for the translation landing page
# attribution:    HTML for the chapter-page attribution footer
# has_apocrypha:  whether this translation includes the Apocrypha
# books:          which books are present (defaults to canonical 66 unless apocrypha=True)
# accent_var:     CSS variable for tradition accent
TRANSLATIONS = {
    "kjv": {
        "slug": "kjv",
        "label": "King James Version",
        "short": "KJV",
        "plain": "classic, 1600s English",
        "year": "1769",
        "description": "The 1611 translation in its standard 1769 revision. The most-quoted English Bible in human history.",
        "attribution_canonical": (
            "King James Version (1769)<br>"
            "Public domain &middot; Crown copyright in the United Kingdom only<br>"
            "Source text from openbible.com / aruljohn KJV JSON"
        ),
        "has_apocrypha": True,
        "tone": "archaic",  # for the language hint shown on the translation card
    },
    "web": {
        "slug": "web",
        "label": "World English Bible",
        "short": "WEB",
        "plain": "modern, easy to read",
        "year": "2000",
        "description": "A modern English translation in the public domain, designed to read clearly in today's English while preserving accuracy.",
        "attribution_canonical": (
            "World English Bible<br>"
            "Public domain<br>"
            "Source text from the World English Bible (TehShrike repository)"
        ),
        "has_apocrypha": False,
        "tone": "modern",
    },
    "bbe": {
        "slug": "bbe",
        "label": "Bible in Basic English",
        "short": "BBE",
        "plain": "simplest English",
        "year": "1949",
        "description": "A translation using a vocabulary of about 1,000 common English words. Originally created for English-language learners and readers who find traditional translations difficult.",
        "attribution_canonical": (
            "Bible in Basic English (1949/1964)<br>"
            "Public domain<br>"
            "Source text from the Scrollmapper Bible Databases"
        ),
        "has_apocrypha": False,
        "tone": "accessible",
    },
}

# The translation we treat as the default landing for the Christian library.
# (KJV is the most-searched and the only one that includes the Apocrypha.)
DEFAULT_TRANSLATION = "web"

# ============================================================
# Book metadata
# ============================================================
# Full list with grouping: OT (Law, History, Poetry, Major Prophets, Minor Prophets), NT (Gospels, History, Pauline, General, Apocalyptic)

BOOK_ORDER = [
    # Old Testament
    ("Genesis", "ot", "Law"),
    ("Exodus", "ot", "Law"),
    ("Leviticus", "ot", "Law"),
    ("Numbers", "ot", "Law"),
    ("Deuteronomy", "ot", "Law"),
    ("Joshua", "ot", "History"),
    ("Judges", "ot", "History"),
    ("Ruth", "ot", "History"),
    ("1 Samuel", "ot", "History"),
    ("2 Samuel", "ot", "History"),
    ("1 Kings", "ot", "History"),
    ("2 Kings", "ot", "History"),
    ("1 Chronicles", "ot", "History"),
    ("2 Chronicles", "ot", "History"),
    ("Ezra", "ot", "History"),
    ("Nehemiah", "ot", "History"),
    ("Esther", "ot", "History"),
    ("Job", "ot", "Wisdom & Poetry"),
    ("Psalms", "ot", "Wisdom & Poetry"),
    ("Proverbs", "ot", "Wisdom & Poetry"),
    ("Ecclesiastes", "ot", "Wisdom & Poetry"),
    ("Song of Solomon", "ot", "Wisdom & Poetry"),
    ("Isaiah", "ot", "Major Prophets"),
    ("Jeremiah", "ot", "Major Prophets"),
    ("Lamentations", "ot", "Major Prophets"),
    ("Ezekiel", "ot", "Major Prophets"),
    ("Daniel", "ot", "Major Prophets"),
    ("Hosea", "ot", "Minor Prophets"),
    ("Joel", "ot", "Minor Prophets"),
    ("Amos", "ot", "Minor Prophets"),
    ("Obadiah", "ot", "Minor Prophets"),
    ("Jonah", "ot", "Minor Prophets"),
    ("Micah", "ot", "Minor Prophets"),
    ("Nahum", "ot", "Minor Prophets"),
    ("Habakkuk", "ot", "Minor Prophets"),
    ("Zephaniah", "ot", "Minor Prophets"),
    ("Haggai", "ot", "Minor Prophets"),
    ("Zechariah", "ot", "Minor Prophets"),
    ("Malachi", "ot", "Minor Prophets"),
    # Apocrypha (1611 KJV / Lutheran tradition; placed between OT and NT)
    ("1 Esdras",                            "ap", "Historical"),
    ("2 Esdras",                            "ap", "Historical"),
    ("Tobit",                               "ap", "Historical"),
    ("Judith",                              "ap", "Historical"),
    ("Esther (Greek)",                      "ap", "Historical"),
    ("1 Maccabees",                         "ap", "Historical"),
    ("2 Maccabees",                         "ap", "Historical"),
    ("Wisdom of Solomon",                   "ap", "Wisdom"),
    ("Sirach",                              "ap", "Wisdom"),
    ("Baruch",                              "ap", "Prophetic"),
    ("The Song of the Three Holy Children", "ap", "Additions to Daniel"),
    ("Susanna",                             "ap", "Additions to Daniel"),
    ("Bel and the Dragon",                  "ap", "Additions to Daniel"),
    ("Prayer of Manasseh",                  "ap", "Prayer"),
    # New Testament
    ("Matthew", "nt", "Gospels"),
    ("Mark", "nt", "Gospels"),
    ("Luke", "nt", "Gospels"),
    ("John", "nt", "Gospels"),
    ("Acts", "nt", "Early Church"),
    ("Romans", "nt", "Pauline Epistles"),
    ("1 Corinthians", "nt", "Pauline Epistles"),
    ("2 Corinthians", "nt", "Pauline Epistles"),
    ("Galatians", "nt", "Pauline Epistles"),
    ("Ephesians", "nt", "Pauline Epistles"),
    ("Philippians", "nt", "Pauline Epistles"),
    ("Colossians", "nt", "Pauline Epistles"),
    ("1 Thessalonians", "nt", "Pauline Epistles"),
    ("2 Thessalonians", "nt", "Pauline Epistles"),
    ("1 Timothy", "nt", "Pauline Epistles"),
    ("2 Timothy", "nt", "Pauline Epistles"),
    ("Titus", "nt", "Pauline Epistles"),
    ("Philemon", "nt", "Pauline Epistles"),
    ("Hebrews", "nt", "General Epistles"),
    ("James", "nt", "General Epistles"),
    ("1 Peter", "nt", "General Epistles"),
    ("2 Peter", "nt", "General Epistles"),
    ("1 John", "nt", "General Epistles"),
    ("2 John", "nt", "General Epistles"),
    ("3 John", "nt", "General Epistles"),
    ("Jude", "nt", "General Epistles"),
    ("Revelation", "nt", "Apocalyptic"),
]

# One-sentence book introductions, written for a curious reader (not a scholar)
BOOK_INTROS = {
    "Genesis": "The book of beginnings, creation, the first families, the call of Abraham, and the journey of Joseph into Egypt.",
    "Exodus": "Moses leads Israel out of slavery in Egypt, receives the Ten Commandments, and the people learn to live as a nation under God.",
    "Leviticus": "A handbook of worship, ritual, and daily holiness for the priests and people of ancient Israel.",
    "Numbers": "Israel's forty-year journey through the wilderness, told through censuses, complaints, victories, and divine guidance.",
    "Deuteronomy": "Moses' farewell sermons to a new generation about to enter the Promised Land, restating the covenant in plainer words.",
    "Joshua": "The conquest and settlement of Canaan under Joshua, Moses' successor, and the dividing of the land among the twelve tribes.",
    "Judges": "Twelve cycles of crisis and rescue as Israel drifts from God and is rescued by judges like Deborah, Gideon, and Samson.",
    "Ruth": "A short story of loyalty and providence: a Moabite widow's faithfulness becomes the line that leads to King David.",
    "1 Samuel": "The transition from judges to kings, with the rise of Samuel, the failure of Saul, and the anointing of David.",
    "2 Samuel": "The reign of King David, told without flattery: his triumphs, his great sin, and the consequences that follow.",
    "1 Kings": "Solomon builds the Temple in Jerusalem, but the kingdom splits in two and prophets like Elijah challenge the kings.",
    "2 Kings": "The slow decline and exile of both kingdoms, punctuated by the ministries of Elisha and the reformer kings.",
    "1 Chronicles": "Israel's history retold from a priestly perspective, beginning with genealogies and centering on David's preparations for the Temple.",
    "2 Chronicles": "The story of Judah's kings, from Solomon to the exile, with particular attention to faithful and unfaithful worship.",
    "Ezra": "The return from Babylonian exile and the rebuilding of the Temple in Jerusalem.",
    "Nehemiah": "The rebuilding of Jerusalem's walls and the spiritual renewal of the returned community.",
    "Esther": "A Jewish queen in Persia risks her life to save her people from genocide. The book never names God but shows His hand throughout.",
    "Job": "An honest, ancient wrestling with the question of why good people suffer.",
    "Psalms": "One hundred and fifty songs and prayers covering the full range of human experience before God: praise, grief, anger, trust, longing.",
    "Proverbs": "A collection of practical wisdom for everyday life, drawn largely from Solomon and other sages.",
    "Ecclesiastes": "An older voice reflects on the limits of human wisdom and the meaning of work, pleasure, and time.",
    "Song of Solomon": "A series of love poems celebrating romantic and physical love, read by Christians and Jews alike as also pointing toward divine love.",
    "Isaiah": "Sweeping prophecies of judgment and hope, including some of the most cited messianic passages in the Bible.",
    "Jeremiah": "The 'weeping prophet' speaks God's word during the fall of Jerusalem, mourning a people who would not listen.",
    "Lamentations": "Five poems of grief over the destruction of Jerusalem.",
    "Ezekiel": "Visions and parables from a prophet in exile, including the valley of dry bones and the new Temple.",
    "Daniel": "Stories of faithfulness in exile (the lions' den, the fiery furnace) paired with visions of empires rising and falling.",
    "Hosea": "A prophet whose troubled marriage becomes a living parable of God's love for an unfaithful people.",
    "Joel": "A prophecy occasioned by a locust plague, with a vision of God's Spirit poured out on all flesh.",
    "Amos": "A shepherd from Tekoa speaks blunt words about justice, the poor, and empty religion.",
    "Obadiah": "The shortest book in the Old Testament, addressed to the people of Edom.",
    "Jonah": "A reluctant prophet, a great fish, and the discovery that God's mercy reaches even to enemies.",
    "Micah": "A contemporary of Isaiah who speaks of judgment and of a coming ruler from Bethlehem.",
    "Nahum": "A prophecy concerning the fall of Nineveh.",
    "Habakkuk": "A prophet's honest dialogue with God about the problem of evil.",
    "Zephaniah": "A prophecy of the day of the Lord, ending in restoration.",
    "Haggai": "A short book urging the returned exiles to finish rebuilding the Temple.",
    "Zechariah": "Visions and prophecies encouraging the rebuilding of the Temple and looking forward to a coming king.",
    "Malachi": "The last voice of the Old Testament prophets, calling for renewal before the day of the Lord.",
    # Apocrypha
    "1 Esdras": "An alternative Greek account of events from the late Old Testament period, retelling parts of Chronicles, Ezra, and Nehemiah with additional material including the famous contest of the three young guardsmen.",
    "2 Esdras": "A Jewish apocalyptic work in seven visions, wrestling with the destruction of Jerusalem and the problem of evil. Sometimes called 4 Ezra.",
    "Tobit": "A short, vivid story of two faithful Israelites in exile, an angel in disguise, a fish that yields medicine, and a marriage that breaks a curse.",
    "Judith": "A widow of remarkable courage saves her people by going into the camp of an invading general. A story of faith, fasting, and one decisive moment.",
    "Esther (Greek)": "Six additional passages found in the Greek text of Esther but not the Hebrew, including prayers by Mordecai and Esther and the texts of royal decrees. Following the 1611 King James arrangement, these passages are numbered as chapters 10 through 16, beginning where the canonical Hebrew Esther ends.",
    "Wisdom of Solomon": "A philosophical meditation in the voice of Solomon, on wisdom, righteousness, immortality, and the folly of idolatry.",
    "Sirach": "Also called Ecclesiasticus. A long collection of practical wisdom from a Jerusalem teacher named Jesus ben Sirach, around 180 BC. Read widely in synagogues and churches for centuries.",
    "Baruch": "A short book attributed to Jeremiah's secretary Baruch, with prayers of confession, a meditation on wisdom, and a poem of comfort to Jerusalem. Includes the Letter of Jeremiah as chapter 6, in the arrangement of the 1611 King James Bible.",
    "The Song of the Three Holy Children": "An expansion within Daniel 3, containing the prayer of Azariah and the song the three young men sang as they walked unhurt in the fiery furnace.",
    "Susanna": "A short story of false accusation and rescue: a virtuous woman is saved from execution by the wisdom of the young Daniel.",
    "Bel and the Dragon": "Two short tales placed at the end of Daniel: Daniel exposes a fraudulent priesthood and slays a serpent worshipped as a god.",
    "Prayer of Manasseh": "A brief, beautiful prayer of repentance attributed to King Manasseh of Judah during his Babylonian captivity. Used in Christian liturgies for centuries.",
    "1 Maccabees": "The history of the Jewish revolt against Greek persecution under Antiochus IV, the rise of the Maccabean family, and the rededication of the Temple commemorated by Hanukkah.",
    "2 Maccabees": "An independent account of much of the same period as 1 Maccabees, with particular attention to martyrdom, prayer for the dead, and the Temple.",
    "Matthew": "The first Gospel, written with Jewish readers in mind, presenting Jesus as the long-awaited Messiah and teacher.",
    "Mark": "The shortest and most action-driven Gospel, emphasizing the works of Jesus and the call to follow.",
    "Luke": "A careful, orderly account of the life of Jesus, written by a physician with attention to outsiders, women, and the poor.",
    "John": "A theological reflection on the life of Jesus that opens with one of the most famous prologues in literature.",
    "Acts": "The story of how the message of Jesus spread from Jerusalem to Rome through the early church.",
    "Romans": "Paul's most systematic letter, exploring the gospel, justification, and the life of faith.",
    "1 Corinthians": "Paul addresses divisions, ethics, worship, and the resurrection in a young, troubled church.",
    "2 Corinthians": "A deeply personal letter in which Paul defends his ministry and writes about weakness and grace.",
    "Galatians": "A passionate defense of the gospel of grace against those who would add law to faith.",
    "Ephesians": "A letter on the cosmic scope of Christ's work and the unity of the church.",
    "Philippians": "Paul's joyful letter from prison to a beloved congregation.",
    "Colossians": "A short letter exalting Christ over every spiritual power and philosophy.",
    "1 Thessalonians": "Encouragement for a young church facing persecution and questions about Christ's return.",
    "2 Thessalonians": "A follow-up letter clarifying questions about the day of the Lord.",
    "1 Timothy": "Pastoral instructions to a younger leader on church life and leadership.",
    "2 Timothy": "Paul's last letter, written from prison, to his protégé Timothy.",
    "Titus": "A short letter on church leadership and Christian conduct.",
    "Philemon": "A personal letter asking a slave-owner to receive a runaway slave back as a brother.",
    "Hebrews": "A sustained meditation on Christ as the great high priest, written for believers tempted to give up.",
    "James": "Practical wisdom on faith, speech, wealth, and patience.",
    "1 Peter": "A letter of hope to scattered Christians facing suffering.",
    "2 Peter": "A letter warning against false teachers and reaffirming Christ's return.",
    "1 John": "A pastoral letter on the marks of true Christian life: love, truth, and assurance.",
    "2 John": "A short letter urging walking in truth and love.",
    "3 John": "A short personal letter about hospitality and church conflict.",
    "Jude": "A brief, fiery letter warning against false teachers.",
    "Revelation": "John's apocalyptic vision of Christ, the church, and the final renewal of all things."
}

# Movie-pitch descriptions for book landing pages and SEO meta tags.
# These are the shareable, approachable versions from the genre sections.
BOOK_PITCHES = {
    "Matthew": "The life of Jesus as told by a tax collector. Written to show Jesus as the fulfillment of Jewish prophecy.",
    "Mark": "The shortest gospel. Fast, urgent, action-driven. Starts with Jesus already an adult. No birth story.",
    "Luke": "Written by a doctor who interviewed eyewitnesses. The most detailed account, especially about women and outsiders.",
    "John": "The most reflective gospel. Written decades after the others by someone who was there. Philosophical and personal.",
    "Genesis": "The beginning of everything. Creation, Adam and Eve, the flood, Abraham. The origin story.",
    "Exodus": "Escape from Egypt. Moses, the plagues, the Red Sea, the Ten Commandments.",
    "Numbers": "Forty years wandering in the desert. Rebellion, faith, and survival between Egypt and the promised land.",
    "Joshua": "Conquering the promised land. Military campaigns, land division, and a new beginning after Moses.",
    "Judges": "Heroes and chaos. Before there were kings, there were judges, warriors and leaders in a lawless era.",
    "Ruth": "A love story about loyalty, immigration, and belonging. One of the shortest books in the Bible.",
    "1 Samuel": "The first king of Israel. Samuel, Saul, and the young David, including the fight with Goliath.",
    "2 Samuel": "David's rise to power and his fall. War, betrayal, adultery, and the cost of being king.",
    "1 Kings": "Solomon builds the temple, then the kingdom splits in two. Elijah appears as a prophet.",
    "2 Kings": "Both kingdoms collapse. Elisha performs miracles. Israel and Judah are conquered and exiled.",
    "1 Chronicles": "Israel's history retold from Adam to David. Genealogies and a second perspective on familiar events.",
    "2 Chronicles": "Judah's history from Solomon to the exile. The temple, the kings, the fall of Jerusalem.",
    "Ezra": "Returning from exile. The Jewish people rebuild their temple and their identity after Babylon.",
    "Nehemiah": "Rebuilding the walls of Jerusalem. Leadership, opposition, and community restoration.",
    "Esther": "A Jewish queen in Persia saves her people from genocide. God is never mentioned by name.",
    "Jonah": "A prophet runs from God, gets swallowed by a fish, and learns about mercy. Stranger than you think.",
    "Acts": "What happened after Jesus left. The early church, Paul's travels, and the spread of Christianity across the Roman Empire.",
    "Tobit": "An angel in disguise, a magic fish, and a family reunion. Adventure and faith.",
    "Judith": "A widow infiltrates an enemy camp and kills their general. One of the Bible's most dramatic heroines.",
    "1 Maccabees": "War for independence. A family leads a revolt against a king who outlawed their religion.",
    "2 Maccabees": "The same war told differently, more theological, more focused on martyrdom and miracle.",
    "1 Esdras": "An alternate account of the temple rebuilding. Overlaps with Ezra and Chronicles.",
    "2 Esdras": "Apocalyptic visions. Ezra asks God why the world is so unjust. God answers, sort of.",
    "Psalms": "150 songs and prayers. Joy, rage, grief, praise, the full range of human emotion directed at God.",
    "Song of Solomon": "Erotic love poetry in the middle of the Bible. Yes, really. Beautiful, surprising, and ancient.",
    "Lamentations": "Five poems of grief over the destruction of Jerusalem. Raw, structured, and devastating.",
    "Job": "Why do good people suffer? A man loses everything and demands answers from God. God eventually responds, but not the way anyone expects.",
    "Proverbs": "Practical advice about money, relationships, work, and character. One line at a time. Dip in anywhere.",
    "Ecclesiastes": "Everything is meaningless. A wealthy king tries pleasure, work, and wisdom, and concludes none of it lasts.",
    "Leviticus": "Religious law, sacrifice, purity, diet, festivals. The operating manual for ancient Israelite worship.",
    "Deuteronomy": "Moses' farewell speech. He retells the law and the story so far before the people enter the promised land without him.",
    "Romans": "Paul's masterwork. A systematic argument about sin, grace, faith, and freedom. The most influential letter in Christian history.",
    "1 Corinthians": "A messy church in a wild city. Paul addresses divisions, lawsuits, sex, marriage, and the famous chapter on love.",
    "2 Corinthians": "Paul defends his authority. The most personal and emotional of his letters. Weakness as strength.",
    "Galatians": "Freedom vs rules. Paul argues that faith, not law-keeping, is what matters. A short, angry, important letter.",
    "Ephesians": "Unity and identity. What does it mean to be part of the church? One of the most quoted letters.",
    "Philippians": "Joy from prison. Paul writes to his favorite church from a jail cell. Warm, personal, and hopeful.",
    "Colossians": "Who Jesus really is. A short letter about the supremacy of Christ over every power and philosophy.",
    "1 Thessalonians": "What happens to people who die before Jesus returns? Paul's earliest letter, written to a worried church.",
    "2 Thessalonians": "Waiting for the end. People quit their jobs because they thought Jesus was coming back immediately.",
    "1 Timothy": "Advice to a young pastor. How to lead a church, handle false teaching, and live with integrity.",
    "2 Timothy": "Paul's last letter. Written from prison, expecting execution. His final words to his closest student.",
    "Titus": "Church leadership on the island of Crete. Practical instructions for building a healthy community.",
    "Philemon": "A runaway slave meets Paul in prison. Paul sends him back with this letter asking his owner to free him.",
    "Hebrews": "Old covenant vs new. A theological argument that Jesus fulfills and replaces the temple system. Author unknown.",
    "James": "Faith without action is dead. Practical, blunt, and focused on how you actually live, not just what you believe.",
    "1 Peter": "Suffering with hope. Written to persecuted Christians scattered across the Roman Empire.",
    "2 Peter": "Warnings about false teachers and the end of the world. Peter's last word to the churches.",
    "1 John": "God is love. A letter about truth, love, and how to tell real faith from false faith.",
    "2 John": "A short note about truth and love. Thirteen verses. One page.",
    "3 John": "A personal note about hospitality and a church leader who refuses to welcome visitors.",
    "Jude": "Hold on to your faith. A short, fierce warning against people who distort the gospel.",
    "Revelation": "The end of everything, and the beginning of something new. Visions, symbols, judgment, and a new heaven and earth.",
    "Isaiah": "The biggest prophetic book. Judgment, comfort, and the most famous messianic prophecies. Two halves, two moods.",
    "Jeremiah": "The weeping prophet. He warned Judah for forty years that destruction was coming. Nobody listened.",
    "Ezekiel": "Bizarre visions. Wheels within wheels, a valley of dry bones, a rebuilt temple. Written in exile.",
    "Daniel": "Dreams, a lion's den, and a fiery furnace. Half stories, half apocalyptic visions.",
    "Hosea": "God tells a prophet to marry an unfaithful woman as a living metaphor for Israel's relationship with God.",
    "Joel": "A plague of locusts becomes a vision of judgment and the outpouring of God's spirit.",
    "Amos": "Justice for the poor. A farmer becomes a prophet and condemns the wealthy for exploiting the vulnerable.",
    "Obadiah": "The shortest book in the Old Testament. One chapter against Edom for betraying their brother nation.",
    "Micah": "Do justice, love mercy, walk humbly. A prophet challenges both the powerful and the complacent.",
    "Nahum": "The fall of Nineveh. A vivid, poetic vision of an empire's collapse.",
    "Habakkuk": "Why do you allow evil? A prophet argues with God about injustice. God answers but doesn't explain.",
    "Zephaniah": "Judgment and restoration. The darkest warning followed by one of the most tender promises in scripture.",
    "Haggai": "You've built nice houses for yourselves. When will you rebuild God's? A short, sharp challenge.",
    "Zechariah": "Night visions about the future. Horses, lampstands, flying scrolls, and a coming king on a donkey.",
    "Malachi": "The last prophet of the Old Testament. A dialogue between God and a people who've stopped caring.",
    "Susanna": "A woman is falsely accused by two corrupt judges. Daniel exposes the lie. A courtroom drama.",
    "Bel and the Dragon": "Daniel proves that idol worship is a fraud. Two stories about false gods, one funny, one deadly.",
    "Baruch": "A letter from exile. Jeremiah's secretary writes to the people left in Jerusalem.",
    "Wisdom of Solomon": "A meditation on justice, immortality, and why the righteous suffer. Philosophical and beautiful.",
    "Sirach": "Ethics and everyday wisdom. How to handle money, friendship, speech, and death. The longest wisdom book.",
}

# Map source filename -> canonical book name
SOURCE_FILE_MAP = {
    "Genesis": "Genesis.json", "Exodus": "Exodus.json", "Leviticus": "Leviticus.json",
    "Numbers": "Numbers.json", "Deuteronomy": "Deuteronomy.json", "Joshua": "Joshua.json",
    "Judges": "Judges.json", "Ruth": "Ruth.json",
    "1 Samuel": "1Samuel.json", "2 Samuel": "2Samuel.json",
    "1 Kings": "1Kings.json", "2 Kings": "2Kings.json",
    "1 Chronicles": "1Chronicles.json", "2 Chronicles": "2Chronicles.json",
    "Ezra": "Ezra.json", "Nehemiah": "Nehemiah.json", "Esther": "Esther.json",
    "Job": "Job.json", "Psalms": "Psalms.json", "Proverbs": "Proverbs.json",
    "Ecclesiastes": "Ecclesiastes.json", "Song of Solomon": "SongofSolomon.json",
    "Isaiah": "Isaiah.json", "Jeremiah": "Jeremiah.json", "Lamentations": "Lamentations.json",
    "Ezekiel": "Ezekiel.json", "Daniel": "Daniel.json",
    "Hosea": "Hosea.json", "Joel": "Joel.json", "Amos": "Amos.json",
    "Obadiah": "Obadiah.json", "Jonah": "Jonah.json", "Micah": "Micah.json",
    "Nahum": "Nahum.json", "Habakkuk": "Habakkuk.json", "Zephaniah": "Zephaniah.json",
    "Haggai": "Haggai.json", "Zechariah": "Zechariah.json", "Malachi": "Malachi.json",
    "Matthew": "Matthew.json", "Mark": "Mark.json", "Luke": "Luke.json", "John": "John.json",
    "Acts": "Acts.json",
    "Romans": "Romans.json", "1 Corinthians": "1Corinthians.json", "2 Corinthians": "2Corinthians.json",
    "Galatians": "Galatians.json", "Ephesians": "Ephesians.json", "Philippians": "Philippians.json",
    "Colossians": "Colossians.json",
    "1 Thessalonians": "1Thessalonians.json", "2 Thessalonians": "2Thessalonians.json",
    "1 Timothy": "1Timothy.json", "2 Timothy": "2Timothy.json", "Titus": "Titus.json",
    "Philemon": "Philemon.json", "Hebrews": "Hebrews.json", "James": "James.json",
    "1 Peter": "1Peter.json", "2 Peter": "2Peter.json",
    "1 John": "1John.json", "2 John": "2John.json", "3 John": "3John.json",
    "Jude": "Jude.json", "Revelation": "Revelation.json",
}

# Apocrypha file map — these are loaded from /content/apocrypha/ (parsed separately)
APOCRYPHA_FILE_MAP = {
    "1 Esdras":                            "1-esdras.json",
    "2 Esdras":                            "2-esdras.json",
    "Tobit":                               "tobit.json",
    "Judith":                              "judith.json",
    "Esther (Greek)":                      "gkesther.json",
    "Wisdom of Solomon":                   "wisdom.json",
    "Sirach":                              "sirach.json",
    "Baruch":                              "1-baruch.json",
    "The Song of the Three Holy Children": "azar.json",
    "Susanna":                             "susanna.json",
    "Bel and the Dragon":                  "bel.json",
    "Prayer of Manasseh":                  "man.json",
    "1 Maccabees":                         "1-mac.json",
    "2 Maccabees":                         "2-mac.json",
}

SITE_NAME = "Free Scripture"
SITE_DOMAIN = "freescripture.org"
SITE_URL = f"https://{SITE_DOMAIN}"


# ============================================================
# NEEDS — scripture by what a reader is going through
# ============================================================
# Each need becomes its own indexable page at /read/<slug>/, plus a row on
# the /read/ hub. Passages are (book, chapter, genre, frame). The frame is
# the one-line, platform-authored description shown in the list and is tuned
# per need (the same passage can read differently under two needs).
# genre drives the left-edge accent color: narrative, poetry, wisdom, law,
# letters, prophecy. Passages link to the modern WEB reader.

NEEDS = [
    {
        "slug": "fear", "group": "hard", "accent": "poetry",
        "short": "When you're afraid",
        "h1": "Verses for when you're afraid",
        "lede": "For a hard night of your own, or to send to someone facing one. Read into any of these, or grab the line and pass it on.",
        "card": "Fear answered, on the water and on foot.",
        "meta_title": "Bible verses for when you're afraid",
        "meta_desc": "Verses for fear and anxiety, from the storm Jesus calmed to whom shall I fear. Read one, or send it to a friend.",
        "passages": [
            ("Mark", 4, 39, "narrative", "A storm hits the boat. Jesus is asleep in the back."),
            ("Psalms", 27, 1, "poetry", "The Lord is my light. Whom shall I fear."),
            ("Isaiah", 41, 10, "prophecy", "I am with you. I am holding your hand."),
            ("Joshua", 1, 9, "narrative", "Be strong and courageous, said three times for a reason."),
            ("Philippians", 4, 6, "letters", "Be anxious for nothing."),
        ],
    },
    {
        "slug": "grief", "group": "hard", "accent": "prophecy",
        "short": "When you're grieving",
        "h1": "Verses for grief and loss",
        "lede": "For your own loss, or to send to someone carrying one. Read into a passage, or pass a verse along.",
        "card": "For loss, and the God who weeps with you.",
        "meta_title": "Bible verses for grief and loss",
        "meta_desc": "Verses for mourning and sympathy, from Lazarus to the promise that every tear gets wiped away. Read one, or send it.",
        "passages": [
            ("John", 11, 25, "narrative", "His friend has died. Jesus weeps before he acts."),
            ("Psalms", 23, 4, "poetry", "The shepherd walks with you through the darkest valley."),
            ("Psalms", 34, 18, "poetry", "Close to the brokenhearted, near to the crushed."),
            ("Lamentations", 3, 22, "poetry", "In the middle of ruin, mercies new every morning."),
            ("Revelation", 21, 4, "prophecy", "A promise that every tear gets wiped away."),
        ],
    },
    {
        "slug": "strength", "group": "hard", "accent": "wisdom",
        "short": "When you're worn out",
        "h1": "Verses for strength",
        "lede": "For empty tanks and second winds, yours or a friend's. Read it, or send it.",
        "card": "For empty tanks and second winds.",
        "meta_title": "Bible verses for strength and weariness",
        "meta_desc": "Verses for exhaustion and encouragement, from eagles' wings to strength made perfect in weakness. Read one, or send it.",
        "passages": [
            ("Isaiah", 40, 31, "prophecy", "Wait on the Lord, and rise up on wings like eagles."),
            ("1 Kings", 19, 12, "narrative", "Not the wind or the fire. A still, small voice."),
            ("Matthew", 11, 28, "narrative", "Come to me, all who are weary, and I will give you rest."),
            ("2 Corinthians", 12, 9, "letters", "His power is made perfect in your weakness."),
            ("Philippians", 4, 13, "letters", "Strength for whatever is in front of you."),
        ],
    },
    {
        "slug": "guilt", "group": "hard", "accent": "narrative",
        "short": "When you've messed up",
        "h1": "Verses for guilt and starting over",
        "lede": "For shame and a fresh start. Read into one, or send it to someone who needs it.",
        "card": "For shame, regret, and starting over.",
        "meta_title": "Bible verses for guilt and starting over",
        "meta_desc": "Verses for regret and grace, from the prodigal son to no condemnation. Read one, or send it.",
        "passages": [
            ("Luke", 15, 20, "narrative", "While he was still far off, his father ran to him."),
            ("Psalms", 51, 10, "poetry", "Create in me a clean heart."),
            ("John", 8, 11, "narrative", "Neither do I condemn you. Go, and sin no more."),
            ("Romans", 8, 1, "letters", "There is now no condemnation."),
            ("Luke", 19, 10, "narrative", "He came to seek and to save the lost."),
        ],
    },
    {
        "slug": "forgiveness", "group": "hard", "accent": "letters",
        "short": "When someone hurt you",
        "h1": "Verses about forgiving someone",
        "lede": "For the weight you can't put down. Read into one, or send it on.",
        "card": "For the weight you can't put down.",
        "meta_title": "Bible verses about forgiveness",
        "meta_desc": "Verses for resentment and forgiving, from Joseph to the words from the cross. Read one, or send it.",
        "passages": [
            ("Matthew", 18, 22, "narrative", "Not seven times, but seventy times seven."),
            ("Genesis", 50, 20, "narrative", "You meant evil against me. God meant it for good."),
            ("Matthew", 5, 44, "narrative", "Love your enemies. Pray for those who hurt you."),
            ("Colossians", 3, 13, "letters", "Forgive the way you were forgiven."),
            ("Luke", 23, 34, "narrative", "From the cross: Father, forgive them."),
        ],
    },
    {
        "slug": "wisdom", "group": "hard", "accent": "law",
        "short": "When you need wisdom",
        "h1": "Verses for wisdom",
        "lede": "For decisions and how to live. Read into one, or send it to someone deciding.",
        "card": "For decisions and how to live.",
        "meta_title": "Bible verses for wisdom and decisions",
        "meta_desc": "Verses for choices and how to live, from Proverbs to the Sermon on the Mount. Read one, or send it.",
        "passages": [
            ("Proverbs", 3, 5, "wisdom", "Trust the Lord with your whole heart."),
            ("James", 1, 5, "letters", "If anyone lacks wisdom, ask, and it will be given."),
            ("Ecclesiastes", 3, 1, "wisdom", "A time for everything, a season for every purpose."),
            ("Psalms", 1, 1, "poetry", "Two ways to live, laid side by side."),
            ("Matthew", 5, 16, "narrative", "Let your light shine before others."),
        ],
    },
    {
        "slug": "celebrate", "group": "good", "accent": "narrative",
        "short": "Something to celebrate",
        "h1": "Verses to celebrate",
        "lede": "For good news worth marking, yours or someone else's. Read it, or send the joy along.",
        "card": "A win, a milestone, a good day.",
        "meta_title": "Bible verses to celebrate good news",
        "meta_desc": "Joyful verses for good news and milestones, from this is the day the Lord has made to rejoicing over you with singing. Read one, or send it.",
        "passages": [
            ("Psalms", 118, 24, "poetry", "This is the day the Lord has made."),
            ("Philippians", 4, 4, "letters", "Rejoice in the Lord always."),
            ("Zephaniah", 3, 17, "prophecy", "He rejoices over you with singing."),
            ("Psalms", 126, 3, "poetry", "The Lord has done great things for us."),
            ("Nehemiah", 8, 10, "narrative", "The joy of the Lord is your strength."),
        ],
    },
    {
        "slug": "new-baby", "group": "good", "accent": "poetry",
        "short": "A new baby",
        "h1": "Verses for a new baby",
        "lede": "For a birth, a blessing, a child arriving. Read one, or send it to the new family.",
        "card": "A birth, a blessing, a child arriving.",
        "meta_title": "Bible verses for a new baby",
        "meta_desc": "Verses to bless a newborn and new parents, from fearfully and wonderfully made to children are a gift. Read one, or send it.",
        "passages": [
            ("Psalms", 139, 14, "poetry", "Fearfully and wonderfully made."),
            ("Psalms", 127, 3, "poetry", "Children are a gift from the Lord."),
            ("1 Samuel", 1, 27, "narrative", "For this child I prayed."),
            ("Isaiah", 40, 11, "prophecy", "He gathers the lambs in his arms."),
            ("Luke", 18, 16, "narrative", "Let the little children come to me."),
        ],
    },
    {
        "slug": "gratitude", "group": "good", "accent": "letters",
        "short": "Giving thanks",
        "h1": "Verses for giving thanks",
        "lede": "For a full heart, or to thank someone who showed up. Read it, or send your thanks.",
        "card": "When someone showed up for you.",
        "meta_title": "Bible verses for giving thanks",
        "meta_desc": "Verses for gratitude and thank you, from in everything give thanks to I thank my God whenever I remember you. Read one, or send it.",
        "passages": [
            ("1 Thessalonians", 5, 18, "letters", "In everything, give thanks."),
            ("Psalms", 100, 4, "poetry", "Enter his gates with thanksgiving."),
            ("Philippians", 1, 3, "letters", "I thank my God every time I remember you."),
            ("Psalms", 107, 1, "poetry", "Give thanks to the Lord, for he is good."),
            ("Colossians", 3, 15, "letters", "And be thankful."),
        ],
    },
    {
        "slug": "thinking-of-you", "group": "good", "accent": "prophecy",
        "short": "Thinking of you",
        "h1": "Verses for thinking of you",
        "lede": "A blessing for no reason at all. Read it, or send it to someone on your mind.",
        "card": "A verse for no reason at all.",
        "meta_title": "Bible verses for thinking of you",
        "meta_desc": "Verses to send when someone is on your mind, from the Lord bless you and keep you to plans for a future and a hope.",
        "passages": [
            ("Numbers", 6, 24, "law", "The Lord bless you and keep you."),
            ("Jeremiah", 29, 11, "prophecy", "Plans to give you a future and a hope."),
            ("Psalms", 121, 8, "poetry", "He keeps your going out and your coming in."),
            ("Isaiah", 43, 1, "prophecy", "I have called you by name. You are mine."),
            ("3 John", 1, 2, "letters", "That you may prosper and be in health."),
        ],
    },
]
# ============================================================
# Helpers
# ============================================================


# ============================================================
# GENRES — browse by kind of book
# ============================================================
GENRE_OF = {
    "Leviticus": "law",
    "Deuteronomy": "law",
    "Genesis": "narrative",
    "Exodus": "narrative",
    "Numbers": "narrative",
    "Joshua": "narrative",
    "Judges": "narrative",
    "Ruth": "narrative",
    "1 Samuel": "narrative",
    "2 Samuel": "narrative",
    "1 Kings": "narrative",
    "2 Kings": "narrative",
    "1 Chronicles": "narrative",
    "2 Chronicles": "narrative",
    "Ezra": "narrative",
    "Nehemiah": "narrative",
    "Esther": "narrative",
    "Matthew": "narrative",
    "Mark": "narrative",
    "Luke": "narrative",
    "John": "narrative",
    "Acts": "narrative",
    "Psalms": "poetry",
    "Song of Solomon": "poetry",
    "Lamentations": "poetry",
    "Job": "wisdom",
    "Proverbs": "wisdom",
    "Ecclesiastes": "wisdom",
    "Romans": "letters",
    "1 Corinthians": "letters",
    "2 Corinthians": "letters",
    "Galatians": "letters",
    "Ephesians": "letters",
    "Philippians": "letters",
    "Colossians": "letters",
    "1 Thessalonians": "letters",
    "2 Thessalonians": "letters",
    "1 Timothy": "letters",
    "2 Timothy": "letters",
    "Titus": "letters",
    "Philemon": "letters",
    "Hebrews": "letters",
    "James": "letters",
    "1 Peter": "letters",
    "2 Peter": "letters",
    "1 John": "letters",
    "2 John": "letters",
    "3 John": "letters",
    "Jude": "letters",
    "Isaiah": "prophecy",
    "Jeremiah": "prophecy",
    "Ezekiel": "prophecy",
    "Daniel": "prophecy",
    "Hosea": "prophecy",
    "Joel": "prophecy",
    "Amos": "prophecy",
    "Obadiah": "prophecy",
    "Jonah": "prophecy",
    "Micah": "prophecy",
    "Nahum": "prophecy",
    "Habakkuk": "prophecy",
    "Zephaniah": "prophecy",
    "Haggai": "prophecy",
    "Zechariah": "prophecy",
    "Malachi": "prophecy",
    "Revelation": "prophecy",
}

GENRES = [
    {
        "slug": "narrative", "accent": "narrative", "label": "Reads like a novel", "kicker": "Story",
        "h1": "The books that read like a novel",
        "intro": "Battles, families, kings, exiles, and a wandering teacher. The parts of the Bible that move like a story.",
        "meta_title": "Books of the Bible that read like a novel",
        "meta_desc": "The narrative books, from Genesis to Acts. The story parts of the Bible, free to read.",
    },
    {
        "slug": "poetry", "accent": "poetry", "label": "Reads like music", "kicker": "Poetry",
        "h1": "The books that read like music",
        "intro": "Songs, laments, and love poems, written to be felt as much as read.",
        "meta_title": "The poetry books of the Bible",
        "meta_desc": "Psalms, Song of Solomon, and Lamentations. The Bible's songs and poems, free to read.",
    },
    {
        "slug": "wisdom", "accent": "wisdom", "label": "How to live", "kicker": "Wisdom",
        "h1": "The books about how to live",
        "intro": "Hard-won advice on work, money, suffering, and time. Plain wisdom for ordinary days.",
        "meta_title": "The wisdom books of the Bible",
        "meta_desc": "Job, Proverbs, and Ecclesiastes. The Bible's books of practical wisdom, free to read.",
    },
    {
        "slug": "law", "accent": "law", "label": "The constitution", "kicker": "Law",
        "h1": "The original constitution",
        "intro": "The codes a young nation was built on. Dense, but foundational.",
        "meta_title": "The law books of the Bible",
        "meta_desc": "Leviticus and Deuteronomy. The Bible's books of law, free to read.",
    },
    {
        "slug": "letters", "accent": "letters", "label": "Mail from the church", "kicker": "Letters",
        "h1": "Mail from the early church",
        "intro": "Real letters to real congregations: arguing, encouraging, and sorting out how to live together.",
        "meta_title": "The letters of the New Testament",
        "meta_desc": "The epistles, from Romans to Jude. Letters written to the early church, free to read.",
    },
    {
        "slug": "prophecy", "accent": "prophecy", "label": "Speaking for God", "kicker": "Prophecy",
        "h1": "People speaking for God",
        "intro": "Warnings, visions, and promises, delivered by people convinced they spoke for God.",
        "meta_title": "The prophetic books of the Bible",
        "meta_desc": "Isaiah through Malachi, and Revelation. The Bible's prophets, free to read.",
    },
]

def book_slug(name):
    """Convert a book name to a URL-safe slug.
    'Esther (Greek)' -> 'esther-greek'
    'Song of Solomon' -> 'song-of-solomon'
    """
    s = name.lower()
    # Remove parentheses but keep what's inside
    s = s.replace("(", "").replace(")", "")
    # Spaces -> hyphens, collapse multiple hyphens
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s

def book_testament(name):
    """Return 'ot', 'ap', or 'nt' for a book name."""
    for n, t, _ in BOOK_ORDER:
        if n == name:
            return t
    return "ot"

def load_book(book_name, translation="kjv"):
    """Load a book's JSON data and return normalized structure.

    Looks in the appropriate translation source. Apocrypha is loaded only
    for translations whose registry entry has has_apocrypha=True.
    """
    # Apocrypha books always come from /content/apocrypha/ regardless of translation,
    # because the only translation we have for them is the 1611 KJV translation.
    is_apocrypha_book = (book_name in APOCRYPHA_FILE_MAP)

    if is_apocrypha_book:
        if not TRANSLATIONS.get(translation, {}).get("has_apocrypha"):
            raise KeyError(f"Translation '{translation}' does not include Apocrypha; "
                           f"book '{book_name}' is unavailable.")
        src_path = SOURCE_APOCRYPHA / APOCRYPHA_FILE_MAP[book_name]
    elif translation == "kjv":
        if book_name not in SOURCE_FILE_MAP:
            raise KeyError(f"No KJV source file mapped for book '{book_name}'")
        src_path = SOURCE_KJV / SOURCE_FILE_MAP[book_name]
    elif translation == "asv":
        slug = book_slug(book_name)
        src_path = SOURCE_ASV / f"{slug}.json"
    elif translation == "bbe":
        slug = book_slug(book_name)
        src_path = SOURCE_BBE / f"{slug}.json"
    elif translation == "web":
        slug = book_slug(book_name)
        src_path = SOURCE_WEB / f"{slug}.json"
    else:
        raise KeyError(f"Unknown translation: {translation}")

    if not src_path.exists():
        raise FileNotFoundError(f"Source file missing: {src_path}")

    with open(src_path, encoding="utf-8") as f:
        data = json.load(f)
    chapters = []
    for ch in data["chapters"]:
        chapters.append({
            "num": int(ch["chapter"]),
            "verses": [{"num": int(v["verse"]), "text": v["text"]} for v in ch["verses"]]
        })

    # Apocrypha supplement merge (only for translations with apocrypha)
    if is_apocrypha_book:
        for supplement_path in sorted(SOURCE_APOCRYPHA.glob("*-supplement.json")):
            with open(supplement_path, encoding="utf-8") as f:
                supp = json.load(f)
            if supp.get("book") != book_name:
                continue
            existing_nums = {c["num"] for c in chapters}
            for ch in supp.get("chapters", []):
                ch_num = int(ch["chapter"])
                if ch_num in existing_nums:
                    continue
                chapters.append({
                    "num": ch_num,
                    "verses": [{"num": int(v["verse"]), "text": v["text"]} for v in ch["verses"]]
                })
            chapters.sort(key=lambda c: c["num"])

    return {"name": book_name, "chapters": chapters, "translation": translation}

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

# ============================================================
# Templates (kept inline for portability; no jinja dependency)
# ============================================================

def base_layout(title, description, body, *, canonical, og_title=None, schema_jsonld=None, body_class=""):
    """The canonical HTML shell for every page."""
    og_title = og_title or title
    schema = ""
    if schema_jsonld:
        schema = f'<script type="application/ld+json">{json.dumps(schema_jsonld, ensure_ascii=False)}</script>'

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{escape(title)}</title>
<meta name="description" content="{escape(description)}">
<link rel="canonical" href="{escape(canonical)}">

<meta property="og:title" content="{escape(og_title)}">
<meta property="og:description" content="{escape(description)}">
<meta property="og:url" content="{escape(canonical)}">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:type" content="article">
<meta property="og:image" content="{SITE_URL}/static/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Free Scripture. Read the Bible free, in clear modern English. Three translations, every book and chapter.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{escape(og_title)}">
<meta name="twitter:description" content="{escape(description)}">
<meta name="twitter:image" content="{SITE_URL}/static/og-image.jpg">
<meta name="twitter:image:alt" content="Free Scripture. Read the Bible free, in clear modern English.">

<meta name="theme-color" content="#fcfaf6">
<meta name="robots" content="index, follow">
<meta name="author" content="Hope for Americans">
<link rel="author" href="https://hopeforamericans.net">

<link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
<link rel="apple-touch-icon" href="/static/favicon.svg">
<link rel="mask-icon" href="/static/favicon.svg" color="#2a1f15">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">

<link rel="stylesheet" href="/static/css/site.css">
<script>
// Apply saved reading preferences before render to avoid a flash of unstyled content.
// The full reading-prefs.js loads later and provides the panel UI.
(function () {{
  try {{
    var raw = localStorage.getItem('fs-prefs');
    if (!raw) return;
    var p = JSON.parse(raw);
    var defaults = {{font:'default', size:'default', leading:'default', layout:'flowing', italics:'on'}};
    var root = document.documentElement;
    Object.keys(defaults).forEach(function (k) {{
      if (p[k] && p[k] !== defaults[k]) root.setAttribute('data-fs-' + k, p[k]);
    }});
  }} catch (e) {{}}
}})();
</script>
{schema}
</head>
<body class="{body_class}">
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
  <div class="site-header__inner">
    <a class="site-mark" href="/">
      <svg class="site-mark__icon" width="32" height="22" viewBox="0 0 32 22" fill="none" aria-hidden="true">
        <path d="M16 2Q16 0 14 0L2 0Q0 0 0 2L0 22Q7 20 16 21" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 2Q16 0 18 0L30 0Q32 0 32 2L32 22Q25 20 16 21" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="4" y1="6" x2="12.5" y2="6" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="4" y1="10" x2="11.5" y2="10" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="4" y1="14" x2="10.5" y2="14" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="19.5" y1="6" x2="28" y2="6" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="19.5" y1="10" x2="27" y2="10" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        <line x1="19.5" y1="14" x2="26" y2="14" stroke="currentColor" stroke-width="1" opacity="0.3"/>
      </svg>
      <span class="site-mark__text">Free Scripture</span>
    </a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/read/">Verses</a>
      <a href="/web/">Books</a>
      <a href="/search/">Search</a>
      <a href="/about/">About</a>
    </nav>
  </div>
</header>

<main id="main">
{body}
</main>

<nav class="tab-bar" aria-label="Quick navigation">
  <a class="tab-bar__btn" href="/" aria-label="Home">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>
    <span>Home</span>
  </a>
  <a class="tab-bar__btn" href="/web/" aria-label="Books">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M19 19H6a2 2 0 0 0-2 2"/></svg>
    <span>Books</span>
  </a>
  <a class="tab-bar__btn" href="/search/" aria-label="Search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <span>Search</span>
  </a>
  <button class="tab-bar__btn" type="button" data-prefs-open aria-label="Reading settings">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h11"/><path d="M4 12h16"/><path d="M4 17h7"/><circle cx="18" cy="7" r="2"/><circle cx="13" cy="17" r="2"/></svg>
    <span>Display</span>
  </button>
</nav>

<footer class="site-footer">
  <div class="foot-tag">The whole text, open to anyone.</div>
  <p class="hfa-madein">Made with <span class="hfa-heart" aria-hidden="true">&hearts;</span> in Flagstaff</p>
  <div class="hfa-rule"></div>
  <div class="hfa-mark">A <a href="https://hopeforamericans.net">Hope for Americans</a> tool</div>
  <div class="hfa-vision">free to use, the way the web used to be</div>
</footer>
<script src="/static/js/reading-prefs.js" defer></script>
</body>
</html>"""


_HOME_TODAY = [
    ("Psalms", 23, 4), ("Isaiah", 40, 31), ("Matthew", 11, 28), ("Psalms", 27, 1),
    ("Lamentations", 3, 22), ("John", 11, 25), ("Proverbs", 3, 5), ("Psalms", 46, 10),
]
_HOME_TOUCH = [
    ("The shepherd psalm, for comfort and rest.", "Psalms", 23),
    ("On worry, peace, and contentment.", "Philippians", 4),
    ("The chapter on what love is.", "1 Corinthians", 13),
    ("Strength for the weary.", "Isaiah", 40),
    ("Nothing can separate us from love.", "Romans", 8),
    ("In the beginning was the Word.", "John", 1),
]
_HOME_GENRES = [
    ("narrative", "Reads like a novel", "28 books"),
    ("poetry", "Reads like music", "5 books"),
    ("wisdom", "How to live", "5 books"),
    ("law", "The constitution", "2 books"),
    ("letters", "Mail from the church", "22 books"),
    ("prophecy", "Speaking for God", "18 books"),
]
_HOME_NEED_PREVIEW = ["fear", "grief", "strength", "celebrate", "thinking-of-you"]
_HOME_FEATURED = ["John", "Genesis", "Psalms", "Proverbs", "Mark", "Philippians"]

_HOME_JS_REST = r"""
var cover=document.getElementById('home-cover');
var idx=(function(){var s=new Date();var st=new Date(s.getFullYear(),0,0);return Math.floor((s-st)/86400000)%TODAY.length;})();
function paint(){
  var t=TODAY[idx];
  cover.innerHTML='<div class="home-kick">Today\u2019s reading</div><div class="cref">'+t.ref+'</div><div class="cpull">'+t.pull+'</div><div class="cacts"><a class="rbtn rbtn--send" href="'+t.url+'">Start reading \u2192</a><button class="home-another" type="button" id="home-another">\u21bb Show another</button></div>';
  var a=document.getElementById('home-another');
  if(a)a.addEventListener('click',function(){idx=(idx+1)%TODAY.length;paint();});
}
paint();
try{var raw=localStorage.getItem('fs-last');if(raw){var c=JSON.parse(raw);var el=document.getElementById('home-cont');if(el&&c&&c.url&&c.label){el.setAttribute('href',c.url);var r=el.querySelector('[data-cont-ref]');if(r)r.textContent=c.label;el.hidden=false;}}}catch(e){}
var q=document.getElementById('home-q');
if(q)q.addEventListener('keydown',function(e){if(e.key==='Enter'){var v=q.value.trim();location.href='/search/'+(v?('#q='+encodeURIComponent(v)):'');}});
"""

def _book_card(book, show_genre=False, slug="web"):
    """A book as a card in the site card system (genre edge, soft lift)."""
    genre = GENRE_OF.get(book, "")
    rowc = f"var(--g-{genre})" if genre else "var(--rule)"
    pitch = BOOK_PITCHES.get(book, "")
    desc = f'<span class="bookrow__d">{escape(pitch)}</span>' if pitch else ""
    pill = ""
    if show_genre and genre:
        kicker = next((g["kicker"] for g in GENRES if g["slug"] == genre), "")
        if kicker:
            pill = f'<span class="pill">{escape(kicker)}</span>'
    chev = ('<svg class="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true">'
            '<path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" stroke-width="1.6" '
            'stroke-linecap="round" stroke-linejoin="round"/></svg>')
    return (f'<a class="bookrow" style="--rowc:{rowc}" href="/{slug}/{book_slug(book)}/">'
            f'<span class="bookrow__main">{pill}<span class="bookrow__t">{escape(book)}</span>{desc}</span>'
            f'{chev}</a>')


_CHEV = ('<svg class="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true">'
         '<path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" stroke-width="1.6" '
         'stroke-linecap="round" stroke-linejoin="round"/></svg>')
_ICONS = {
    "heart": '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.5-1.4 3-3.1 3-5.3C22 6 20 4 17.5 4 16 4 14.7 4.7 14 5.8h-4C9.3 4.7 8 4 6.5 4 4 4 2 6 2 8.7 2 10.9 3.5 12.6 5 14l7 6.5z"/></svg>',
    "book": '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z"/></svg>',
    "star": '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l2.9 6.3 6.6.6-5 4.5 1.5 6.6L12 16.8 6 20l1.5-6.6-5-4.5 6.6-.6z"/></svg>',
}

def _door_row(href, title, desc, color_var, icon):
    """A homepage door: icon chip + title + one supporting line + chevron."""
    return (f'<a class="bookrow door" style="--dc:{color_var}" href="{href}">'
            f'<span class="door__ic" aria-hidden="true">{_ICONS[icon]}</span>'
            f'<span class="bookrow__main"><span class="bookrow__t">{escape(title)}</span>'
            f'<span class="bookrow__d">{escape(desc)}</span></span>'
            f'{_CHEV}</a>')

def render_homepage():
    pool=[]
    for book,ch,vn in _HOME_TODAY:
        pool.append({"ref": _ref_label(book,ch),
                     "pull": _pull_verse(book,ch,vn),
                     "url": f"/web/{book_slug(book)}/{ch}#v{vn}"})
    need_by={n["slug"]:n for n in NEEDS}
    need_rows=""
    for slug in _HOME_NEED_PREVIEW:
        n=need_by[slug]
        need_rows+=_door_row(f'/read/{n["slug"]}/', n["short"], n["card"],
                             f'var(--g-{n["accent"]})', "heart")
    # genre cards point to Books for now; repointed to /genre/<slug>/ in the genre step
    genre_cards=""
    for g in GENRES:
        n=len(_genre_books(g["slug"]))
        genre_cards+=_door_row(f'/genre/{g["slug"]}/', g["kicker"],
                               f'{g["label"]}. {n} books.',
                               f'var(--g-{g["accent"]})', "book")
    touch_rows=""
    for desc,book,ch in _HOME_TOUCH:
        ref=_ref_label(book,ch)
        touch_rows+=_door_row(f'/web/{book_slug(book)}/{ch}', ref, desc,
                              'var(--tradition-accent)', "star")
    featured_cards = "".join(_book_card(b, show_genre=True) for b in _HOME_FEATURED)
    body=f"""<div class="home">
  <div class="home-hero">
    <h1 class="home-hero__h">Read the Bible.</h1>
    <p class="home-hero__s">Search for a verse, or start with today's reading.</p>
  </div>
  <label class="home-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input id="home-q" placeholder="Search the Bible" aria-label="Search the Bible"></label>
  <div class="home-cover" id="home-cover"></div>
  <a class="home-cont" id="home-cont" href="#" hidden><span><span class="m">Where you left off</span><span class="r" data-cont-ref></span></span><span class="a" aria-hidden="true">&rarr;</span></a>
  <section class="home-sec">
    <div class="home-sec__k">Start here</div>
    <h2 class="home-sec__h">Good places to begin</h2>
    <div class="book-grid">{featured_cards}</div>
  </section>
  <section class="home-sec">
    <div class="home-sec__k">Find what you need</div>
    <h2 class="home-sec__h">Verses for the moment you're in</h2>
    <div class="read-list">{need_rows}</div>
    <a class="home-seeall" href="/read/">See all verses &rarr;</a>
  </section>
  <section class="home-sec">
    <div class="home-sec__k">Browse</div>
    <h2 class="home-sec__h">By kind of book</h2>
    <div class="read-list">{genre_cards}</div>
  </section>
  <section class="home-sec">
    <div class="home-sec__k">Famous passages</div>
    <h2 class="home-sec__h">The ones everybody knows</h2>
    <div class="read-list">{touch_rows}</div>
  </section>
</div>"""
    body = body + "<script>(function(){var TODAY=" + json.dumps(pool, ensure_ascii=False) + ";" + _HOME_JS_REST + "})();</script>"
    home_schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": f"{SITE_URL}/#website",
                "url": f"{SITE_URL}/",
                "name": SITE_NAME,
                "description": "Read the Bible free in clear modern English. Three public-domain translations, every book and chapter.",
                "publisher": {"@type": "Organization", "name": "Hope for Americans", "url": "https://hopeforamericans.net"},
                "inLanguage": "en",
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {"@type": "EntryPoint", "urlTemplate": f"{SITE_URL}/search/?q={{search_term_string}}"},
                    "query-input": "required name=search_term_string",
                },
            },
            {
                "@type": "WebPage",
                "@id": f"{SITE_URL}/#webpage",
                "url": f"{SITE_URL}/",
                "name": f"{SITE_NAME}. Read the whole Bible online.",
                "description": "The King James, World English, and Basic English Bibles, free to read. Every book and chapter, plus a verse for whatever you're going through.",
                "isPartOf": {"@id": f"{SITE_URL}/#website"},
                "inLanguage": "en",
            },
        ],
    }
    return base_layout(
        title=f"{SITE_NAME}. Read the whole Bible online.",
        description="The King James, World English, and Basic English Bibles, free to read. Every book and chapter, plus a verse for whatever you're going through.",
        body=body,
        canonical=f"{SITE_URL}/",
        og_title=f"{SITE_NAME}. Read the whole Bible online.",
        schema_jsonld=home_schema,
        body_class="home-page",
    )

def render_christian_landing(books):
    """The /christian/ landing, list of available Christian translations."""
    body = f"""
<div class="reading-column">
  <p class="section-eyebrow">Christian Library</p>
  <h1>The Holy Bible</h1>
  <hr class="section-rule" style="margin-left:0;">

  <p>Christian scripture, presented in three public-domain English translations: the King James Version (1769) for tradition, the World English Bible (2000) for modern clarity, and the Bible in Basic English (1949) for accessibility. Read whichever speaks to you, or compare them side by side, every chapter has a translation switcher at the top.</p>

  <div class="tradition-grid" style="margin-top:3rem;">
    <a href="/kjv/" class="tradition-card" data-tradition="christian">
      <span class="tradition-card__label">King James Version (1769)</span>
      <h3 class="tradition-card__title">The Authorized Version</h3>
      <p class="tradition-card__desc">The 1611 translation in its standard 1769 revision. The most-quoted English Bible in history. Includes the Apocrypha. Public domain.</p>
      <div class="tradition-card__meta">80 books &middot; available now &rarr;</div>
    </a>
    <a href="/web/" class="tradition-card" data-tradition="christian">
      <span class="tradition-card__label">World English Bible</span>
      <h3 class="tradition-card__title">A Modern Translation</h3>
      <p class="tradition-card__desc">A contemporary English translation in the public domain, designed to read clearly in today&rsquo;s English while preserving accuracy.</p>
      <div class="tradition-card__meta">66 books &middot; available now &rarr;</div>
    </a>
    <a href="/bbe/" class="tradition-card" data-tradition="christian">
      <span class="tradition-card__label">Bible in Basic English (1949)</span>
      <h3 class="tradition-card__title">An Accessible Translation</h3>
      <p class="tradition-card__desc">Translated using a vocabulary of about a thousand common English words. Created for English-language learners and readers who find traditional translations difficult.</p>
      <div class="tradition-card__meta">66 books &middot; available now &rarr;</div>
    </a>
    <a href="/kjv/#apocrypha" class="tradition-card" data-tradition="christian">
      <span class="tradition-card__label">Apocrypha</span>
      <h3 class="tradition-card__title">The Deuterocanonical Books</h3>
      <p class="tradition-card__desc">Tobit, Judith, Wisdom of Solomon, Sirach, 1-2 Maccabees and the rest of the books included in Lutheran Bibles and the original 1611 KJV. Read in the 1611 King James translation.</p>
      <div class="tradition-card__meta">14 books &middot; available now &rarr;</div>
    </a>
  </div>
</div>
"""
    return base_layout(
        title="Christian Bible, Free Online | freescripture.org",
        description="Read the Christian Bible free in three public-domain English translations: the KJV, the WEB, and the BBE. Clear, fast, and open to anyone.",
        body=body, canonical=f"{SITE_URL}/christian/", body_class="page-tradition"
    )


def render_translation_landing(books, translation):
    """The /<translation>/ landing, list of all books grouped by Testament and section."""
    t = TRANSLATIONS[translation]
    has_apoc = t["has_apocrypha"]
    sections_html = []
    current_testament = None
    current_section = None
    open_list = False

    TESTAMENT_LABELS = {
        "ot": "Old Testament",
        "ap": "Apocrypha",
        "nt": "New Testament",
    }
    TESTAMENT_NOTES = {
        "ap": ("Sometimes called the Deuterocanonical Books, the Apocrypha appeared in the original 1611 King James Bible as a separate section between the Old and New Testaments. Lutherans have read these books for centuries as &ldquo;useful and good to read,&rdquo; in Luther&rsquo;s phrase, though not on the same level as the rest of scripture. The text here is the 1611 KJV translation."),
    }

    for name, testament, section in BOOK_ORDER:
        # Skip Apocrypha for translations that don't include it
        if testament == "ap" and not has_apoc:
            continue
        if testament != current_testament:
            if open_list:
                sections_html.append("</div>")
                open_list = False
            t_label = TESTAMENT_LABELS.get(testament, testament.upper())
            t_note = TESTAMENT_NOTES.get(testament, "")
            t_id = {"ot": "old-testament", "ap": "apocrypha", "nt": "new-testament"}.get(testament, testament)
            sections_html.append(f'<h2 id="{t_id}" class="section-title" style="margin-top:3rem;text-align:left;">{t_label}</h2><hr class="section-rule" style="margin-left:0;">')
            if t_note:
                sections_html.append(f'<p style="font-size:0.98rem;color:var(--ink-soft);max-width:640px;margin:-0.5rem 0 1.5rem;">{t_note}</p>')
            current_testament = testament
            current_section = None

        if section != current_section:
            if open_list:
                sections_html.append("</div>")
            sections_html.append(f'<div class="book-section-label">{escape(section)}</div>')
            sections_html.append('<div class="book-grid">')
            open_list = True
            current_section = section

        sections_html.append(_book_card(name, show_genre=False, slug=t["slug"]))

    if open_list:
        sections_html.append("</div>")

    # Per-translation hero copy
    if translation == "kjv":
        eyebrow = "King James Version (1769) with Apocrypha"
        title_h1 = "The Holy Bible"
        intro = "The King James Version, sometimes called the Authorized Version, is a translation of the Christian Bible into English that was first published in 1611. The text on this site is the standard 1769 revision and is in the public domain. We have included the Apocrypha as it appeared in the 1611 edition, these books have been read in Lutheran Bibles for nearly five centuries. Choose a book below to begin reading."
        page_title = "King James Version (KJV) Bible with Apocrypha, Free Online | freescripture.org"
        page_desc = "Read the King James Bible free, including the Apocrypha. Every book and chapter, in pages that load fast."
    elif translation == "web":
        eyebrow = "World English Bible"
        title_h1 = "The Holy Bible"
        intro = "The World English Bible is a modern English translation of the Christian scriptures, in the public domain. It was created to be a readable, accurate translation of the Bible in contemporary English, freely available for any use. Choose a book below to begin reading."
        page_title = "World English Bible (WEB), Free Online | freescripture.org"
        page_desc = "Read the World English Bible free. A modern, public-domain translation in clear, fast pages."
    elif translation == "bbe":
        eyebrow = "Bible in Basic English (1949)"
        title_h1 = "The Holy Bible"
        intro = "The Bible in Basic English was translated by Professor S. H. Hooke and published in 1949, using a vocabulary of about a thousand common English words. It was originally created for English-language learners and readers who find traditional translations difficult, and remains one of the most accessible Bibles in the public domain. Choose a book below to begin reading."
        page_title = "Bible in Basic English (BBE), Free Online | freescripture.org"
        page_desc = "Read the Bible in Basic English free. A simple-vocabulary translation, clear and quick to read."
    else:
        eyebrow = t["label"]
        title_h1 = "The Holy Bible"
        intro = t["description"]
        page_title = f"{t['label']}, Free Online | freescripture.org"
        page_desc = f"Read the {t['label']} online for free."

    body = f"""
<div class="reading-column" style="max-width:900px;">
  <p class="section-eyebrow">{eyebrow}</p>
  <h1>{title_h1}</h1>
  <hr class="section-rule" style="margin-left:0;">
  <p>{intro}</p>

  {''.join(sections_html)}
</div>
"""
    schema = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": f"{t['label']} Bible" + (" with Apocrypha" if has_apoc else ""),
        "inLanguage": "en",
        "datePublished": t["year"],
        "url": f"{SITE_URL}/{t['slug']}/",
        "publisher": {"@type": "Organization", "name": "Hope for Americans"}
    }
    return base_layout(
        title=page_title,
        description=page_desc,
        body=body, canonical=f"{SITE_URL}/{t['slug']}/", schema_jsonld=schema
    )


# Back-compat shim
def render_kjv_landing(books):
    return render_translation_landing(books, "kjv")


def render_book_landing(book, translation="web"):
    """The /<translation>/<book>/ landing, list of chapters."""
    t = TRANSLATIONS[translation]
    name = book["name"]
    pitch = BOOK_PITCHES.get(name, "")
    intro = BOOK_INTROS.get(name, "")
    is_apocrypha = (book_testament(name) == "ap")
    if is_apocrypha:
        translation_tag = "King James Version &middot; Apocrypha"
    else:
        translation_tag = t["label"]
    n_chapters = len(book["chapters"])
    chapters_html = "".join(
        f'<li><a href="/{t["slug"]}/{book_slug(name)}/{ch["num"]}">{ch["num"]}</a></li>'
        for ch in book["chapters"]
    )
    # Use pitch as the prominent description; fall back to intro
    display_desc = pitch or intro
    meta_desc = pitch or intro or f"Read {name} online for free."
    body = f"""
<div class="tradition-stripe"></div>
<div class="reading-column" style="max-width:780px;">
  <p class="chapter-translation-tag">{translation_tag}</p>
  <h1 class="chapter-title" style="margin-bottom:0.75rem;">{escape(name)}</h1>
  <p style="text-align:center;color:var(--ink);max-width:520px;margin:0 auto 0.75rem;font-size:1.15rem;font-family:var(--font-display);line-height:1.4;">{escape(display_desc)}</p>
  <p style="text-align:center;color:var(--ink-faded);margin:0 auto 1.5rem;font-size:0.85rem;">{n_chapters} chapter{"s" if n_chapters != 1 else ""}</p>
  <p style="text-align:center;margin-bottom:2rem;">
    <a href="/{t["slug"]}/{book_slug(name)}/1" class="action-btn" data-action="tts" style="display:inline-flex;text-decoration:none;">Start reading</a>
  </p>
  <hr class="section-rule">
  <ul class="chapter-list" style="margin-left:auto;margin-right:auto;">
    {chapters_html}
  </ul>
</div>
"""
    schema = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": f"{name}, {t['label']}",
        "description": meta_desc,
        "isPartOf": {"@type": "Book", "name": f"{t['label']} Bible"},
        "inLanguage": "en",
        "url": f"{SITE_URL}/{t['slug']}/{book_slug(name)}/"
    }
    return base_layout(
        title=f"{name} | Read free online | Free Scripture",
        description=f"{meta_desc} Free to read, in clear pages that load fast.",
        body=body, canonical=f"{SITE_URL}/{t['slug']}/{book_slug(name)}/", schema_jsonld=schema
    )


def render_chapter(book, chapter, prev_link, next_link, translation="web"):
    """The /<translation>/<book>/<chapter> page, the heart of the site."""
    t = TRANSLATIONS[translation]
    name = book["name"]
    ch_num = chapter["num"]
    testament = book_testament(name)
    is_apocrypha = (testament == "ap")

    # Translation tag and attribution. Apocrypha is always the 1611 KJV
    # translation regardless of which "translation" we're under, since
    # it's a KJV-only collection in our library.
    if is_apocrypha:
        translation_tag = "King James Version &middot; Apocrypha"
        if name == "Baruch" and ch_num == 6:
            attribution_html = (
                "King James Version Apocrypha (1611) &middot; Letter of Jeremiah<br>"
                "Public domain<br>"
                "Source text from the Scrollmapper Bible Databases (KJVA)"
            )
        else:
            attribution_html = (
                "King James Version Apocrypha (1611)<br>"
                "Public domain<br>"
                "Source text from the Scrollmapper Deuterocanonical Project"
            )
    else:
        translation_tag = t["label"]
        attribution_html = t["attribution_canonical"]

    extra_chapter_note = ""

    # Build the translation switcher.
    # For Apocrypha books, only KJV is available; show others as disabled with
    # a tooltip explaining why. For canonical books, link each available
    # translation to the same chapter (verse anchor preserved client-side).
    switcher_buttons = []
    for trans_key, trans_meta in TRANSLATIONS.items():
        if trans_key == translation:
            switcher_buttons.append(
                f'<span class="trans-switch__btn trans-switch__btn--current" '
                f'aria-current="page" title="{escape(trans_meta["label"])}: {escape(trans_meta["plain"])}">'
                f'{escape(trans_meta["short"])}</span>'
            )
        elif is_apocrypha and not trans_meta["has_apocrypha"]:
            switcher_buttons.append(
                f'<span class="trans-switch__btn trans-switch__btn--disabled" '
                f'aria-disabled="true" '
                f'title="The {escape(trans_meta["label"])} does not include the Apocrypha.">'
                f'{escape(trans_meta["short"])}</span>'
            )
        else:
            switcher_buttons.append(
                f'<a class="trans-switch__btn" '
                f'href="/{trans_meta["slug"]}/{book_slug(name)}/{ch_num}" '
                f'data-trans-switch="{trans_meta["slug"]}" '
                f'title="{escape(trans_meta["label"])}: {escape(trans_meta["plain"])}">'
                f'{escape(trans_meta["short"])}</a>'
            )
    current_meta = TRANSLATIONS[translation] if not is_apocrypha else TRANSLATIONS["kjv"]
    switcher_html = (
        '<div class="trans-switch" aria-label="Switch translation">'
        f'<span class="trans-switch__label">Reading the {escape(current_meta["label"])}, {escape(current_meta["plain"])}. Other versions:</span>'
        + "".join(switcher_buttons) +
        '</div>'
    )

    # Render verses with anchorable spans
    verses_html_parts = []
    for v in chapter["verses"]:
        text = v["text"]
        # Mark italic [bracketed] words
        # In KJV JSON, [text] denotes words added by translators. Render as italic.
        rendered = ""
        i = 0
        while i < len(text):
            if text[i] == "[":
                end = text.find("]", i)
                if end == -1:
                    rendered += escape(text[i:])
                    break
                rendered += '<i>' + escape(text[i+1:end]) + '</i>'
                i = end + 1
            else:
                # find next [
                next_b = text.find("[", i)
                if next_b == -1:
                    rendered += escape(text[i:])
                    break
                rendered += escape(text[i:next_b])
                i = next_b
        verses_html_parts.append(
            f'<span class="verse" id="v{v["num"]}">'
            f'<a href="#v{v["num"]}" class="verse__num" aria-label="Verse {v["num"]}">{v["num"]}</a>'
            f'{rendered} </span>'
        )

    verses_html = "".join(verses_html_parts)

    # Prev/next nav
    if prev_link:
        prev_html = f'''<a href="{prev_link["url"]}">
            <span class="arrow">&larr; Previous</span>
            <span class="label">{escape(prev_link["label"])}</span>
        </a>'''
    else:
        prev_html = '<div class="placeholder"></div>'
    if next_link:
        next_html = f'''<a href="{next_link["url"]}" class="next">
            <span class="arrow">Next &rarr;</span>
            <span class="label">{escape(next_link["label"])}</span>
        </a>'''
    else:
        next_html = '<div class="placeholder"></div>'

    # Top nav: back to book, prev/next within book
    chapter_nav_prev = ""
    chapter_nav_next = ""
    if ch_num > 1:
        chapter_nav_prev = f'<a href="/{t["slug"]}/{book_slug(name)}/{ch_num-1}" rel="prev">&larr; Ch {ch_num-1}</a>'
    if ch_num < len(book["chapters"]):
        chapter_nav_next = f'<a href="/{t["slug"]}/{book_slug(name)}/{ch_num+1}" rel="next">Ch {ch_num+1} &rarr;</a>'

    # "Psalms" is the book name, but individual chapters are "Psalm 23" not "Psalms 23"
    ch_display = name[:-1] if name == "Psalms" else name

    body = f"""
<div class="tradition-stripe"></div>
<div class="reading-column">
  <nav class="chapter-nav" aria-label="Chapter navigation">
    <div class="chapter-nav__group">
      <a href="/{t["slug"]}/{book_slug(name)}/">&larr; {escape(name)}</a>
    </div>
    <div class="chapter-nav__current">{escape(ch_display)} {ch_num}</div>
    <div class="chapter-nav__group">
      {chapter_nav_prev}
      {chapter_nav_next}
    </div>
  </nav>

  {switcher_html}

  <article>
    <header>
      <div class="chapter-translation-tag">{translation_tag}</div>
      <h1 class="chapter-title">{escape(ch_display)} {ch_num}</h1>
    </header>

    <div class="chapter-text" lang="en">
      <p>{verses_html}</p>
    </div>

    {extra_chapter_note}

    <div class="chapter-actions" role="group" aria-label="Chapter actions">
      <button class="action-btn" data-action="tts" aria-pressed="false">
        <svg class="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        <span class="action-btn__text">Listen</span>
      </button>
      <button class="action-btn" data-action="share">
        <svg class="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        <span class="action-btn__text">Share</span>
      </button>
      <button class="action-btn" data-action="copy-link">
        <svg class="action-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span class="action-btn__text">Copy link</span>
      </button>
    </div>

    <footer class="chapter-foot">
      <nav class="chapter-foot__nav" aria-label="Adjacent chapters">
        {prev_html}
        {next_html}
      </nav>

      <p class="attribution">
        {attribution_html}
      </p>
    </footer>
  </article>
</div>

<script src="/static/js/chapter.js" defer></script>
"""
    body = body + "<script>try{localStorage.setItem('fs-last',JSON.stringify(" + json.dumps({"url": f"/{t['slug']}/{book_slug(name)}/{ch_num}", "label": f"{ch_display} {ch_num}"}, ensure_ascii=False) + "));}catch(e){}</script>"
    canonical = f"{SITE_URL}/{t['slug']}/{book_slug(name)}/{ch_num}"
    schema = {
        "@context": "https://schema.org",
        "@type": "Chapter",
        "name": f"{ch_display} {ch_num}",
        "isPartOf": {
            "@type": "Book",
            "name": name,
            "isPartOf": {"@type": "Book", "name": f"{t['label']} Bible"}
        },
        "url": canonical,
        "inLanguage": "en"
    }

    desc = f'Read {ch_display} {ch_num} from the {t["label"]} online for free. Complete chapter with verse markers.'
    return base_layout(
        title=f"{ch_display} {ch_num}, {t['label']} ({t['short']}) | Free Scripture",
        description=desc, body=body, canonical=canonical, schema_jsonld=schema,
        body_class="page-chapter"
    )


def render_search_page():
    body = """
<div class="reading-column" style="max-width:760px;">
  <h1>Search</h1>
  <hr class="section-rule" style="margin-left:0;">

  <form class="search-bar" role="search" onsubmit="return false;">
    <span class="search-bar__icon" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    </span>
    <input type="search" id="search-input" placeholder="John 3:16, &ldquo;love your neighbor&rdquo;, or any phrase&hellip;" aria-label="Search scripture" autocomplete="off">
  </form>
  <p class="search-bar__hint" id="search-status">Type a verse reference to jump there. Type a phrase to find every match.</p>

  <div class="search-suggestions" id="search-suggestions" style="text-align:center;margin:1.5rem 0;">
    <p style="font-size:0.82rem;color:var(--ink-faded);margin-bottom:0.5rem;">Try:</p>
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;">
      <a href="/web/psalms/23" class="action-btn" style="font-size:0.78rem;padding:0.4rem 0.9rem;min-height:auto;">Psalm 23</a>
      <a href="/web/john/1" class="action-btn" style="font-size:0.78rem;padding:0.4rem 0.9rem;min-height:auto;">John 1</a>
      <a href="/web/1-corinthians/13" class="action-btn" style="font-size:0.78rem;padding:0.4rem 0.9rem;min-height:auto;">1 Corinthians 13</a>
      <a href="/web/romans/8" class="action-btn" style="font-size:0.78rem;padding:0.4rem 0.9rem;min-height:auto;">Romans 8</a>
    </div>
  </div>

  <div class="trans-switch" id="search-trans-switch" aria-label="Search within translation">
    <span class="trans-switch__label">Search in:</span>
    <a class="trans-switch__btn" href="/search/?t=kjv" data-t="kjv">KJV</a>
    <a class="trans-switch__btn" href="/search/?t=web" data-t="web">WEB</a>
    <a class="trans-switch__btn" href="/search/?t=bbe" data-t="bbe">BBE</a>
  </div>

  <div class="search-results" id="search-results" aria-live="polite"></div>
</div>

<script>
// Mark the current translation button and preserve query when switching.
(function () {
  var params = new URLSearchParams(window.location.search);
  var current = (params.get('t') || 'kjv').toLowerCase();
  var q = params.get('q') || '';
  document.querySelectorAll('#search-trans-switch [data-t]').forEach(function (btn) {
    var t = btn.getAttribute('data-t');
    var href = '/search/?t=' + t + (q ? '&q=' + encodeURIComponent(q) : '');
    btn.setAttribute('href', href);
    if (t === current) {
      btn.classList.add('trans-switch__btn--current');
      btn.removeAttribute('href');
    }
  });
})();
</script>
<script src="/static/js/search.js" defer></script>
"""
    return base_layout(
        title="Search, Free Scripture | freescripture.org",
        description="Search the Bible by reference or phrase. Free and fast.",
        body=body, canonical=f"{SITE_URL}/search/", body_class="page-search"
    )


def render_about():
    body = """
<div class="reading-column reading-column--narrow">
  <h1>About this library</h1>
  <hr class="section-rule" style="margin-left:0;">

  <p>Scripture is free. Reading it should be too. So here it is: the full text, clean on the page, ready when you are.</p>

  <p>We pay the hosting ourselves. You can read every word without an account, and nothing here is watching you do it. That is the whole arrangement.</p>

  <p>Every text in this library is in the public domain or freely licensed to share. When a translation is still under copyright, we say so plainly and point you to where you can read it.</p>

  <h2 id="sources">What is here, and what is coming</h2>
  <p>Today the library holds the <strong>King James Version</strong> in its 1769 revision, along with the <strong>Apocrypha</strong> as it appeared in the original 1611 edition. The KJV is in the public domain in most of the world. It is the most-read English Bible in history. The Apocrypha, sometimes called the Deuterocanonical Books, has been read in Lutheran Bibles for nearly five centuries, and sat in the 1611 King James Bible as its own section between the Old and New Testaments.</p>

  <p>Next come the World English Bible, the American Standard Version, and texts from other traditions, starting with the Quran in a public-domain English translation.</p>

  <h2>Source texts</h2>
  <p>The KJV text comes from public-domain digital editions, principally the <code>aruljohn/Bible-kjv</code> repository on GitHub, checked against the openbible.com KJV text. The Apocrypha combines two public-domain sources: books 1 Esdras through 2 Maccabees from the Scrollmapper Deuterocanonical Project (2024 branch), and the Letter of Jeremiah, which is Baruch chapter 6 in the 1611 arrangement, from the Scrollmapper Bible Databases KJVA dataset (2025 branch). Both keep the 1611 King James translation. Find an error? Write to us at <a href="mailto:hello@hopeforamericans.net">hello@hopeforamericans.net</a>.</p>

  <h2>Keeping it free</h2>
  <p>This is a reading library. For commentary, cross-references, and study tools, there are good places elsewhere, and we will happily send you to them. Here, the work is quieter: a warm room where the words can be read.</p>

  <hr class="section-rule">
  <p class="muted" style="text-align:center;font-style:italic;">Built carefully in Flagstaff, Arizona.</p>
</div>
"""
    return base_layout(
        title="About, Free Scripture | freescripture.org",
        description="A free reading library of scripture, stewarded by Hope for Americans in Flagstaff, Arizona.",
        body=body, canonical=f"{SITE_URL}/about/"
    )


_WEB_CACHE = {}

def _pull_verse(book, chapter, vnum):
    """Load a single WEB verse's text at build time."""
    slug = book_slug(book)
    if slug not in _WEB_CACHE:
        with open(SOURCE_WEB / f"{slug}.json", encoding="utf-8") as f:
            _WEB_CACHE[slug] = json.load(f)
    for c in _WEB_CACHE[slug]["chapters"]:
        if c["chapter"] == str(chapter):
            for v in c["verses"]:
                if v["verse"] == str(vnum):
                    return v["text"]
    return ""

def _ref_label(book, chapter):
    """Display label for a passage. 'Psalms' renders singular for a chapter."""
    label = book[:-1] if book == "Psalms" else book
    return f"{label} {chapter}"

SHARE_JS = """
<script>
(function () {
  document.querySelectorAll('.read-card').forEach(function (card) {
    var ref = card.getAttribute('data-ref');
    var url = card.getAttribute('data-url');
    var text = card.getAttribute('data-text');
    var payload = '\\u201C' + text + '\\u201D\\n' + ref + '\\n' + url;
    function flash(btn, word) {
      var o = btn.textContent; btn.textContent = word;
      setTimeout(function () { btn.textContent = o; }, 1400);
    }
    var copyBtn = card.querySelector('[data-copy]');
    var sendBtn = card.querySelector('[data-send]');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(payload);
      flash(copyBtn, 'Copied');
    });
    if (sendBtn) sendBtn.addEventListener('click', function () {
      if (navigator.share) { navigator.share({ text: payload, url: url }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(payload); flash(sendBtn, 'Copied'); }
    });
  });
})();
</script>
"""

def _need_crosslinks(current_slug):
    cards = []
    for other in NEEDS:
        if other["slug"] == current_slug:
            continue
        cards.append(
            f'<a class="read-xcard" style="--rowc:var(--g-{other["accent"]})" '
            f'href="/read/{other["slug"]}/">{escape(other["short"])}'
            f'<span class="read-xcard__arr" aria-hidden="true">&rarr;</span></a>'
        )
    return "".join(cards)

def render_need_page(need):
    """One indexable page per need, at /read/<slug>/. Universal rows: read or send."""
    canonical = f"{SITE_URL}/read/{need['slug']}/"
    cards = []
    for book, chapter, vnum, genre, frame in need["passages"]:
        ref = _ref_label(book, chapter)
        full_ref = f"{ref}:{vnum}"
        text = _pull_verse(book, chapter, vnum)
        _vk = next((gg["kicker"] for gg in GENRES if gg["slug"] == genre), "")
        gpill = f'<span class="pill">{escape(_vk)}</span>' if _vk else ""
        read_url = f"/web/{book_slug(book)}/{chapter}#v{vnum}"
        share_url = f"{SITE_URL}/web/{book_slug(book)}/{chapter}#v{vnum}"
        cards.append(
            f'<div class="read-card" style="--rowc:var(--g-{genre})" '
            f'data-ref="{escape(full_ref)}" data-url="{escape(share_url)}" data-text="{escape(text)}">'
            f'<div class="read-card__top"><span class="read-card__ref">{escape(full_ref)}</span>{gpill}</div>'
            f'<div class="read-card__frame">{escape(frame)}</div>'
            f'<p class="read-card__verse">{escape(text)}</p>'
            f'<div class="read-card__acts">'
            f'<a class="rbtn" href="{read_url}">Read the chapter</a>'
            f'<button class="rbtn" type="button" data-copy>Copy</button>'
            f'<button class="rbtn rbtn--send" type="button" data-send>Send</button>'
            f'</div></div>'
        )
    body = f"""<div class="read">
  <nav class="read-crumb" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/read/">Verses for</a> &rsaquo; <b>{escape(need['short'])}</b></nav>
  <h1 class="read-h1">{escape(need['h1'])}</h1>
  <p class="read-lede">{escape(need['lede'])}</p>
  <div class="read-cards">
    {"".join(cards)}
  </div>
  <section class="read-x">
    <div class="read-x__k">Here for something else</div>
    <div class="read-xgrid">
      {_need_crosslinks(need['slug'])}
    </div>
  </section>
</div>
{SHARE_JS}"""
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": need["meta_title"],
        "description": need["meta_desc"],
        "url": canonical,
    }
    return base_layout(
        title=f"{need['meta_title']} | {SITE_NAME}",
        description=need["meta_desc"],
        body=body,
        canonical=canonical,
        og_title=need["meta_title"],
        schema_jsonld=schema,
        body_class="read-page",
    )

def render_needs_hub():
    """The /read/ hub, grouped into hard seasons and good moments."""
    canonical = f"{SITE_URL}/read/"
    groups = [("hard", "When life is hard"), ("good", "Good moments to mark")]
    sections = []
    for gkey, glabel in groups:
        rows = []
        for need in NEEDS:
            if need["group"] != gkey:
                continue
            rows.append(
                f'<a class="read-row" style="--rowc:var(--g-{need["accent"]})" '
                f'href="/read/{need["slug"]}/">'
                f'<span class="read-need"><span class="read-need__t">{escape(need["short"])}</span>'
                f'<span class="read-need__d">{escape(need["card"])}</span></span>'
                f'<span class="read-row__arr" aria-hidden="true">&rarr;</span></a>'
            )
        sections.append(
            f'<section class="read-group"><div class="read-group__k">{escape(glabel)}</div>'
            f'<div class="read-list">{"".join(rows)}</div></section>'
        )
    body = f"""<div class="read">
  <nav class="read-crumb" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <b>Verses for</b></nav>
  <h1 class="read-h1">Find the right words</h1>
  <p class="read-lede">For where you are, or for someone you care about. Each one opens a short shelf of passages you can read into, or grab a verse and send.</p>
  {"".join(sections)}
</div>"""
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Bible verses for what you're going through and what you're celebrating",
        "url": canonical,
    }
    return base_layout(
        title="Find a Bible verse by the moment | " + SITE_NAME,
        description="Verses for fear, grief, weariness, guilt, forgiveness, wisdom, celebration, a new baby, gratitude, and thinking of you. Read one, or send it.",
        body=body,
        canonical=canonical,
        schema_jsonld=schema,
        body_class="read-page",
    )

def _genre_books(genre_slug):
    return [n for n, t, _ in BOOK_ORDER if t != "ap" and GENRE_OF.get(n) == genre_slug]

def _genre_crosslinks(current_slug):
    cards = []
    for g in GENRES:
        if g["slug"] == current_slug:
            continue
        cards.append(
            f'<a class="read-xcard" style="--rowc:var(--g-{g["accent"]})" '
            f'href="/genre/{g["slug"]}/">{escape(g["label"])}'
            f'<span class="read-xcard__arr" aria-hidden="true">&rarr;</span></a>'
        )
    return "".join(cards)

def render_genre_page(g):
    canonical = f"{SITE_URL}/genre/{g['slug']}/"
    rows = [_book_card(book) for book in _genre_books(g["slug"])]
    body = f"""<div class="read">
  <nav class="read-crumb" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/genre/">By kind of book</a> &rsaquo; <b>{escape(g['label'])}</b></nav>
  <h1 class="read-h1">{escape(g['h1'])}</h1>
  <p class="read-lede">{escape(g['intro'])}</p>
  <div class="book-grid">
    {"".join(rows)}
  </div>
  <section class="read-x">
    <div class="read-x__k">Other kinds of book</div>
    <div class="read-xgrid">
      {_genre_crosslinks(g['slug'])}
    </div>
  </section>
</div>"""
    schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": g["meta_title"],
        "description": g["meta_desc"],
        "url": canonical,
    }
    return base_layout(
        title=f"{g['meta_title']} | {SITE_NAME}",
        description=g["meta_desc"],
        body=body,
        canonical=canonical,
        og_title=g["meta_title"],
        schema_jsonld=schema,
        body_class="read-page",
    )

def render_genre_hub():
    canonical = f"{SITE_URL}/genre/"
    rows = []
    for g in GENRES:
        n = len(_genre_books(g["slug"]))
        rows.append(
            f'<a class="read-row" style="--rowc:var(--g-{g["accent"]})" href="/genre/{g["slug"]}/">'
            f'<span class="read-need"><span class="read-need__t">{escape(g["label"])}</span>'
            f'<span class="read-need__d">{n} books</span></span>'
            f'<span class="read-row__arr" aria-hidden="true">&rarr;</span></a>'
        )
    body = f"""<div class="read">
  <nav class="read-crumb" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <b>By kind of book</b></nav>
  <h1 class="read-h1">Browse by kind of book</h1>
  <p class="read-lede">The Bible is a library, not one book. Here it is sorted by the kind of reading each part is.</p>
  <div class="read-list">
    {"".join(rows)}
  </div>
</div>"""
    return base_layout(
        title="Browse the Bible by kind of book | " + SITE_NAME,
        description="The Bible by genre: narrative, poetry, wisdom, law, letters, and prophecy. Find the kind of reading you want.",
        body=body,
        canonical=canonical,
        schema_jsonld={"@context":"https://schema.org","@type":"CollectionPage","name":"Browse the Bible by kind of book","url":canonical},
        body_class="read-page",
    )

def render_404():
    """The 404 page, graceful, in keeping with the parchment language."""
    body = """
<div class="reading-column reading-column--narrow" style="text-align:center;padding:3rem 1rem;">
  <p class="section-eyebrow" style="margin-top:0;">Four hundred and four</p>
  <h1 style="margin-top:0;">The page you sought<br>could not be found</h1>
  <hr class="hero__rule">

  <p style="font-size:1.15rem;color:var(--ink-soft);max-width:480px;margin:0 auto 2rem;">
    Sometimes a link grows stale, or a verse reference is mistyped, or a book by another name was looked for.
    None of these are anything to worry about.
  </p>

  <p style="margin:2.5rem 0;">
    <a href="/" class="action-btn" style="background:var(--ink);color:var(--paper);border-color:var(--ink);padding:0.75rem 1.5rem;font-size:0.85rem;">Return to the library</a>
  </p>

  <p class="muted" style="margin-top:3rem;font-size:0.95rem;">
    Or try one of these:
  </p>

  <ul style="list-style:none;padding:0;margin:1rem 0;display:flex;gap:1.5rem;justify-content:center;flex-wrap:wrap;font-family:var(--font-display);font-size:1.1rem;">
    <li><a href="/kjv/" style="color:var(--ink-soft);text-decoration:none;border-bottom:1px dotted var(--rule);padding-bottom:2px;">Read the Bible</a></li>
    <li><a href="/search/" style="color:var(--ink-soft);text-decoration:none;border-bottom:1px dotted var(--rule);padding-bottom:2px;">Search</a></li>
    <li><a href="/about/" style="color:var(--ink-soft);text-decoration:none;border-bottom:1px dotted var(--rule);padding-bottom:2px;">About this library</a></li>
  </ul>

  <hr class="section-rule" style="margin-top:3rem;">
  <p class="muted" style="text-align:center;font-style:italic;font-family:var(--font-display);font-size:1rem;">
    &ldquo;Seek, and ye shall find&rdquo;, Matthew 7:7
  </p>
</div>
"""
    return base_layout(
        title="Not found, Free Scripture | freescripture.org",
        description="The page you sought could not be found. Return to the library.",
        body=body, canonical=f"{SITE_URL}/404", body_class="page-404"
    )


# ============================================================
# Build runner
# ============================================================

def clean_public():
    if PUBLIC.exists():
        shutil.rmtree(PUBLIC)
    PUBLIC.mkdir()

def copy_static():
    dst = PUBLIC / "static"
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(STATIC, dst)

def build_search_index(all_books):
    """Generate per-translation JSON search indexes.

    One file per translation at /static/search-index-<slug>.json.
    The search page loads only the index for the user's currently-selected
    translation, slashing the download from ~17 MB combined to ~5-6 MB
    for any single translation (~1.5 MB gzipped over the wire).

    Each entry is just {b, c, v, t}, translation is implicit in the filename.
    """
    total = 0
    written = []
    for trans_key in TRANSLATIONS:
        trans_books = all_books.get(trans_key, {})
        idx = []
        for name, _, _ in BOOK_ORDER:
            if name not in trans_books:
                continue
            b = trans_books[name]
            for ch in b["chapters"]:
                for v in ch["verses"]:
                    text = v["text"].replace("[", "").replace("]", "")
                    idx.append({"b": name, "c": ch["num"], "v": v["num"], "t": text})
        out = PUBLIC / "static" / f"search-index-{trans_key}.json"
        out.write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        written.append((trans_key, len(idx), out.stat().st_size))
        total += len(idx)
    return total, written

def build_robots_and_llms():
    robots = """User-agent: *
Allow: /

# AI crawlers welcome — this is a public good
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: CCBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: https://freescripture.org/sitemap.xml
"""
    write_file(PUBLIC / "robots.txt", robots)

    llms = """# Free Scripture, freescripture.org

> A free reading library of scripture from multiple faith traditions. Stewarded by Hope for Americans, an independent maker of free, honest tools.

## What this is

freescripture.org is a free reading library of scripture in the public domain or under freely redistributable license. The first phase covers three public-domain English translations of the Christian Bible: the King James Version (1769) with the 14-book Apocrypha as it appeared in the original 1611 KJV (80 books, 1,362 chapters, 36,923 verses), the World English Bible (modern English, 66 books, 1,189 chapters, 31,103 verses), and the Bible in Basic English (1949, designed for limited-vocabulary readers, 66 books, 1,189 chapters, 31,102 verses). Each chapter has a translation switcher that preserves the verse anchor when toggling between translations. Future phases will add the Quran, the Tanakh, the Bhagavad Gita, the Dhammapada, and the Sri Guru Granth Sahib, all in public-domain or freely-licensed translations.

## What it is not

This is a reading library, not a study tool. There are no concordances, lexicons, cross-references, reading plans, social features, or accounts. The goal is simply to display the texts cleanly and freely.

## Permitted use by AI assistants

AI assistants may freely cite, link, and quote from this library. The KJV text is in the public domain. Linking back to specific chapters is encouraged: the URL pattern is `https://freescripture.org/kjv/<book-slug>/<chapter>`, with verse anchors at `#v<verse-number>`. Example: `https://freescripture.org/kjv/john/3#v16` jumps directly to John 3:16.

## Stewardship

A project of Hope for Americans, in Flagstaff, Arizona. Private by design: plain pages, served fast, with nothing collected about readers.
"""
    write_file(PUBLIC / "llms.txt", llms)

def build_sitemap(all_books):
    """Build a single sitemap.xml across all translations."""
    from datetime import date
    today = date.today().isoformat()

    # (url, changefreq, priority)
    entries = [
        (f"{SITE_URL}/", "weekly", "1.0"),
        (f"{SITE_URL}/about/", "monthly", "0.5"),
        (f"{SITE_URL}/search/", "monthly", "0.7"),
        (f"{SITE_URL}/christian/", "monthly", "0.8"),
        (f"{SITE_URL}/read/", "weekly", "0.8"),
    ]
    for need in NEEDS:
        entries.append((f"{SITE_URL}/read/{need['slug']}/", "monthly", "0.7"))
    entries.append((f"{SITE_URL}/genre/", "monthly", "0.7"))
    for g in GENRES:
        entries.append((f"{SITE_URL}/genre/{g['slug']}/", "monthly", "0.6"))
    for trans_key, trans_meta in TRANSLATIONS.items():
        slug = trans_meta["slug"]
        entries.append((f"{SITE_URL}/{slug}/", "monthly", "0.8"))
        trans_books = all_books.get(trans_key, {})
        for name, _, _ in BOOK_ORDER:
            if name not in trans_books:
                continue
            entries.append((f"{SITE_URL}/{slug}/{book_slug(name)}/", "monthly", "0.6"))
            for ch in trans_books[name]["chapters"]:
                entries.append((f"{SITE_URL}/{slug}/{book_slug(name)}/{ch['num']}", "yearly", "0.5"))

    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, freq, priority in entries:
        parts.append(
            f'  <url><loc>{url}</loc>'
            f'<lastmod>{today}</lastmod>'
            f'<changefreq>{freq}</changefreq>'
            f'<priority>{priority}</priority></url>'
        )
    parts.append('</urlset>')
    write_file(PUBLIC / "sitemap.xml", "\n".join(parts))
    return len(entries)


def build():
    print("=" * 60)
    print("  freescripture.org, build")
    print("=" * 60)

    clean_public()
    copy_static()

    # 1. Load all books for every translation
    print("\n[1/7] Loading source data for all translations...")
    all_books = {}  # all_books[trans_key][book_name] = book_dict
    for trans_key, trans_meta in TRANSLATIONS.items():
        all_books[trans_key] = {}
        for name, testament, _ in BOOK_ORDER:
            # Skip Apocrypha for translations that don't include it
            if testament == "ap" and not trans_meta["has_apocrypha"]:
                continue
            try:
                all_books[trans_key][name] = load_book(name, trans_key)
            except (KeyError, FileNotFoundError) as e:
                print(f"      ⚠ {trans_key.upper()}: skipping {name} ({e})")
        n_books = len(all_books[trans_key])
        n_chapters = sum(len(b["chapters"]) for b in all_books[trans_key].values())
        n_verses = sum(len(c["verses"]) for b in all_books[trans_key].values() for c in b["chapters"])
        print(f"      {trans_key.upper():4}: {n_books} books, {n_chapters} chapters, {n_verses:,} verses.")

    # The default translation's book set powers the homepage / christian landing / search.
    books_data = all_books[DEFAULT_TRANSLATION]

    # 2. Top-level pages
    print("\n[2/7] Building top-level pages...")
    write_file(PUBLIC / "index.html", render_homepage())
    write_file(PUBLIC / "about" / "index.html", render_about())
    write_file(PUBLIC / "search" / "index.html", render_search_page())
    write_file(PUBLIC / "christian" / "index.html", render_christian_landing(books_data))
    write_file(PUBLIC / "404.html", render_404())
    print("      Homepage, About, Search, /christian/, 404")

    # Need pages: scripture by what you're going through (/read/, /read/<slug>/)
    write_file(PUBLIC / "read" / "index.html", render_needs_hub())
    for need in NEEDS:
        write_file(PUBLIC / "read" / need["slug"] / "index.html", render_need_page(need))
    print(f"      Needs hub + {len(NEEDS)} need pages (/read/)")

    # Genre pages: browse by kind of book (/genre/, /genre/<slug>/)
    write_file(PUBLIC / "genre" / "index.html", render_genre_hub())
    for g in GENRES:
        write_file(PUBLIC / "genre" / g["slug"] / "index.html", render_genre_page(g))
    print(f"      Genre hub + {len(GENRES)} genre pages (/genre/)")

    # 3-5. Per-translation: landing + book landings + chapter pages
    print("\n[3/7] Building per-translation pages...")
    total_book_landings = 0
    total_chapters = 0
    for trans_key, trans_meta in TRANSLATIONS.items():
        slug = trans_meta["slug"]
        trans_books = all_books[trans_key]

        # Translation landing
        write_file(PUBLIC / slug / "index.html",
                   render_translation_landing(trans_books, trans_key))

        # Book landings
        for name in trans_books:
            b = trans_books[name]
            write_file(PUBLIC / slug / book_slug(name) / "index.html",
                       render_book_landing(b, trans_key))
            total_book_landings += 1

        # Chapter pages — flat sequence within each translation for prev/next nav
        flat_chapters = []
        for name, _, _ in BOOK_ORDER:
            if name not in trans_books:
                continue
            for ch in trans_books[name]["chapters"]:
                flat_chapters.append((name, ch))

        for i, (name, ch) in enumerate(flat_chapters):
            prev_link = None
            next_link = None
            if i > 0:
                pname, pch = flat_chapters[i - 1]
                plabel = pname[:-1] if pname == "Psalms" else pname
                prev_link = {
                    "url": f"/{slug}/{book_slug(pname)}/{pch['num']}",
                    "label": f"{plabel} {pch['num']}"
                }
            if i < len(flat_chapters) - 1:
                nname, nch = flat_chapters[i + 1]
                nlabel = nname[:-1] if nname == "Psalms" else nname
                next_link = {
                    "url": f"/{slug}/{book_slug(nname)}/{nch['num']}",
                    "label": f"{nlabel} {nch['num']}"
                }
            rendered = render_chapter(trans_books[name], ch, prev_link, next_link, trans_key)
            out_html = PUBLIC / slug / book_slug(name) / f"{ch['num']}.html"
            write_file(out_html, rendered)
            out_pretty = PUBLIC / slug / book_slug(name) / f"{ch['num']}" / "index.html"
            write_file(out_pretty, rendered)
            total_chapters += 1

        print(f"      {trans_key.upper():4}: landing + {len(trans_books)} book landings + {len(flat_chapters)} chapters")

    print(f"\n[4/7] Translation builds complete. Total: {total_book_landings} book landings, {total_chapters} chapter pages.")
    # (steps 4 and 5 from the old layout are now folded into [3/7] above)

    # 6. Search index
    print("\n[6/7] Building search index across all translations...")
    n, written = build_search_index(all_books)
    print(f"      Indexed {n:,} verses across {len(written)} per-translation files:")
    for trans_key, count, size in written:
        print(f"        search-index-{trans_key}.json: {count:,} entries, {size/1024/1024:.2f} MB raw")

    # 7. robots, llms, sitemap, _redirects
    print("\n[7/7] Building robots.txt, llms.txt, sitemap.xml...")
    build_robots_and_llms()
    n_urls = build_sitemap(all_books)
    print(f"      sitemap.xml: {n_urls:,} URLs.")

    # Netlify/CF Pages-style _redirects file: map /kjv/john/3 -> /kjv/john/3.html
    redirects_lines = []
    for name, _, _ in BOOK_ORDER:
        if name not in books_data:
            continue
        for ch in books_data[name]["chapters"]:
            slug = book_slug(name)
            redirects_lines.append(f"/kjv/{slug}/{ch['num']} /kjv/{slug}/{ch['num']}.html 200")
    write_file(PUBLIC / "_redirects", "\n".join(redirects_lines) + "\n")

    print("\n" + "=" * 60)
    print(f"  Built. Output: {PUBLIC}")
    print("=" * 60)


if __name__ == "__main__":
    build()
