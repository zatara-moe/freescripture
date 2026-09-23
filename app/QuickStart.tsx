"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Start = { href: string; label: string; sub: string };
const PSALM: Start = { href: "/web/psalms/23/", label: "Start with Psalm 23", sub: "The Lord is my shepherd. A good place to begin." };

export default function QuickStart({ start }: { start?: Start }) {
  const first = start || PSALM;
  const [resume, setResume] = useState<{ href: string; label: string } | null>(null);
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("fs-last") || "null");
      if (d && d.url && d.url !== first.href) {
        setResume({ href: d.url, label: d.label ? `Continue ${d.label}` : "Continue reading" });
      }
    } catch (e) {}
  }, [first.href]);
  return (
    <>
      <div className="hero-actions">
        <Link className="hero-cta" href={first.href}>{first.label}</Link>
        {resume
          ? <Link className="hero-link" href={resume.href}>{resume.label}</Link>
          : <Link className="hero-link" href="/stories/">Browse all stories</Link>}
      </div>
      <p className="hero-hint">{first.sub}</p>
    </>
  );
}
