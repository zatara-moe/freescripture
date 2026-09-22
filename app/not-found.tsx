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
      <div className="read-list">
        <Link className="bookrow" href="/">
          <span className="bookrow__main"><span className="bookrow__t">Home</span></span>
          <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <Link className="bookrow" href="/web/">
          <span className="bookrow__main"><span className="bookrow__t">All books</span></span>
          <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <Link className="bookrow" href="/search/">
          <span className="bookrow__main"><span className="bookrow__t">Search</span></span>
          <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
      </div>
    </div>
  );
}
