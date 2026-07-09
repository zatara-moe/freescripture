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
        <p>
          Free Scripture is a tool from{" "}
          <a href="https://hopeforamericans.net">Hope for Americans</a>, built in
          Flagstaff, Arizona.
        </p>
      </div>
    </div>
  );
}
