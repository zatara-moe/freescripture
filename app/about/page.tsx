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
          This is a place to read the Bible. Four translations, every book and
          chapter, laid out to be read on any screen. There are also Bible
          stories told in plain words, one scene at a time.
        </p>
        <p>
          The translations are the Berean Standard Bible, the King James Version, the World English Bible,
          and the Bible in Basic English. All four are in the public domain.
          The King James text here includes the Apocrypha.
        </p>
        <p>
          You can read straight through a book, jump to a chapter, or find a
          verse for what you are going through and pass it to someone.
        </p>

        <h2 id="how-stories-are-written">How the stories are written</h2>
        <p>
          Each story follows the Bible closely, in short sentences. Every
          paragraph shows the verses it comes from, so you can check it. Words
          in <strong>bold quotes</strong> are the Bible&apos;s exact words.
        </p>
        <p>
          Boxes marked <em>Imagine the scene</em> are imagination, not
          Scripture. We never make up words and put them in someone&apos;s mouth.
        </p>
        <p>
          The stories are written from a Lutheran (ELCA) point of view. Each
          one is checked line by line against the Bible text. We also ask a
          Lutheran pastor to review each story. Stories marked <em>New</em> are
          still waiting for that review, so small changes may come.
        </p>

        <h2 id="luther-and-the-jewish-people">Luther and the Jewish people</h2>
        <p>
          Many story pages share a short thought from Martin Luther. He helped
          people see that God&apos;s love is a gift, not something we earn. We
          still learn from that.
        </p>
        <p>
          But Luther also wrote terrible things about Jewish people, especially
          late in his life, as in <em>On the Jews and Their Lies</em> (1543). He
          called for cruel acts against them. Those words were wrong. For
          centuries, people used them to spread hatred, and the Nazis later used
          them too.
        </p>
        <p>
          In 1994, the Evangelical Lutheran Church in America (ELCA) said so
          plainly in its Declaration to the Jewish Community. It said,
          &ldquo;we reject this violent invective,&rdquo; and it expressed
          &ldquo;deep and abiding sorrow&rdquo; over the harm it caused. It
          promised to oppose hatred of Jewish people in the church and in the
          world.
        </p>
        <p>
          We agree. Jesus was Jewish. So were his mother and his first
          followers. Quoting Luther does not mean we agree with everything he
          said.
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

        <h2>Connected to Digital Lutheran Church</h2>
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
