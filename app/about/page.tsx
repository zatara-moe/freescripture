import type { Metadata } from "next";
import { SITE_URL } from "@/lib/bible";

export const metadata: Metadata = {
  title: "About",
  description:
    "Free Scripture is a free online Bible reader, stewarded by Hope for Americans in Flagstaff, Arizona.",
  alternates: { canonical: `${SITE_URL}/about/` },
};

export default function About() {
  return (
    <div className="reading-column about-page">
      <header className="page-head">
        <h1 className="page-title">About Free Scripture</h1>
      </header>
      <div className="prose">
        <p>
          This is a place to read the Bible. Three translations, every book and
          chapter, laid out to be read on any screen.
        </p>
        <p>
          The translations are the King James Version, the World English Bible,
          and the Bible in Basic English. All three are in the public domain.
          The King James text here includes the Apocrypha.
        </p>
        <p>
          You can read straight through a book, jump to a chapter, or find a
          verse for what you are going through and pass it to someone.
        </p>

        <h2>Your privacy</h2>
        <p>
          This site has no accounts, no cookies, no analytics, and no tracking
          of any kind. We do not know who you are, what you read, or when you
          visit. Your reading preferences and your last-read position are saved
          on your own device and never sent to a server.
        </p>
        <p>
          There are no ads and nothing for sale. This is a free tool, built the
          way the web used to work.
        </p>

        <h2>Part of a family</h2>
        <p>
          Free Scripture provides the Bible text
          for{" "}
          <a href="https://www.digitallutheranchurch.com">Digital Lutheran Church</a>,
          which offers daily prayer offices, pastoral care, the Lutheran
          library, and this Sunday&apos;s lectionary readings. If you are
          looking for more than the text itself, that is where to go.
        </p>

        <p>
          Free Scripture is a tool from{" "}
          <a href="https://hopeforamericans.net">Hope for Americans</a>, built in
          Flagstaff, Arizona.
        </p>
      </div>
    </div>
  );
}
