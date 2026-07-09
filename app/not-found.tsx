import Link from "next/link";

export default function NotFound() {
  return (
    <div className="reading-column notfound-page">
      <header className="page-head">
        <h1 className="page-title">That page is not here</h1>
        <p className="page-lede">
          The link may be old, or the chapter may not exist in that book. Here are
          a few ways back.
        </p>
      </header>
      <div className="home-rows">
        <Link className="bookrow" href="/">
          <span className="bookrow__body"><span className="bookrow__title">Home</span></span>
          <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
        </Link>
        <Link className="bookrow" href="/web/">
          <span className="bookrow__body"><span className="bookrow__title">All books</span></span>
          <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
        </Link>
        <Link className="bookrow" href="/search/">
          <span className="bookrow__body"><span className="bookrow__title">Search</span></span>
          <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
        </Link>
      </div>
    </div>
  );
}
