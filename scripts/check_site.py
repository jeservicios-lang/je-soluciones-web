#!/usr/bin/env python3
"""Read-only validation for this dependency-free static website."""

from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import math
import re
import sys
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SITE_URL = "https://jesolucionesdosquebradas.com"
VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}
HTML_FILES = sorted(path for path in ROOT.glob("*.html") if path.name != "404.html")


class Document(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[str] = []
        self.ids: list[str] = []
        self.links: list[str] = []
        self.scripts: list[str] = []
        self.styles: list[str] = []
        self.resources: list[str] = []
        self.images: list[dict[str, str | None]] = []
        self.headings: Counter[str] = Counter()
        self.meta: list[dict[str, str | None]] = []
        self.buttons: list[dict[str, str | None]] = []
        self.selects: list[dict[str, str | None]] = []
        self.aria_controls: list[str] = []
        self.json_ld: list[str] = []
        self.errors: list[str] = []
        self._in_json_ld = False
        self._json_ld_text = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if tag == "a" and values.get("href"):
            self.links.append(values["href"] or "")
        if tag == "script":
            if values.get("src"):
                self.scripts.append(values["src"] or "")
            self._in_json_ld = values.get("type") == "application/ld+json"
            self._json_ld_text = ""
        if tag == "link" and values.get("rel") == "stylesheet" and values.get("href"):
            self.styles.append(values["href"] or "")
        elif tag == "link" and values.get("href") and values.get("rel") != "canonical":
            self.resources.append(values["href"] or "")
        if tag == "img":
            self.images.append(values)
        if tag == "meta":
            self.meta.append(values)
        if tag == "button":
            self.buttons.append(values)
        if tag == "select":
            self.selects.append(values)
        if values.get("aria-controls"):
            self.aria_controls.append(values["aria-controls"] or "")
        if re.fullmatch(r"h[1-6]", tag):
            self.headings[tag] += 1
        if tag not in VOID_ELEMENTS:
            self.stack.append(tag)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in VOID_ELEMENTS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._in_json_ld:
            self.json_ld.append(self._json_ld_text)
            self._in_json_ld = False
        if tag in VOID_ELEMENTS:
            self.errors.append(f"Unexpected closing tag </{tag}>")
            return
        if tag not in self.stack:
            self.errors.append(f"Closing tag </{tag}> has no matching opening tag")
            return
        if self.stack[-1] != tag:
            self.errors.append(
                f"Closing tag </{tag}> found while <{self.stack[-1]}> is still open"
            )
            self.stack = self.stack[: self.stack.index(tag)]
        else:
            self.stack.pop()

    def handle_data(self, data: str) -> None:
        if self._in_json_ld:
            self._json_ld_text += data


def parse_document(path: Path) -> Document:
    document = Document()
    document.feed(path.read_text(encoding="utf-8"))
    document.close()
    if document.stack:
        document.errors.append("Unclosed tags: " + ", ".join(document.stack))
    return document


def page_path(href: str, current_page: Path) -> tuple[Path | None, str]:
    url = urlsplit(href)
    if url.scheme or url.netloc or href.startswith(("mailto:", "tel:", "javascript:")):
        return None, ""
    decoded_path = unquote(url.path)
    target = ROOT / "index.html" if decoded_path in ("", "/") else ROOT / decoded_path.lstrip("/")
    if not decoded_path and not url.path:
        target = current_page
    return target.resolve(), unquote(url.fragment)


def check() -> list[str]:
    problems: list[str] = []
    pages = sorted(ROOT.glob("*.html"))
    documents = {page: parse_document(page) for page in pages}

    for page, document in documents.items():
        label = page.relative_to(ROOT).as_posix()
        problems.extend(f"{label}: {error}" for error in document.errors)

        content = page.read_text(encoding="utf-8")
        title_match = re.search(r"<title>(.*?)</title>", content, re.I | re.S)
        title = title_match.group(1).strip() if title_match else ""
        descriptions = [
            meta.get("content", "")
            for meta in document.meta
            if meta.get("name", "").lower() == "description"
        ]
        canonicals = re.findall(
            r'<link\b(?=[^>]*\brel="canonical")(?=[^>]*\bhref="([^"]+)")[^>]*>',
            content,
            re.I,
        )
        if not title:
            problems.append(f"{label}: missing title")
        if not descriptions or not descriptions[0]:
            problems.append(f"{label}: missing meta description")
        if len(canonicals) != 1:
            problems.append(f"{label}: expected one canonical URL, found {len(canonicals)}")
        elif not canonicals[0].startswith(SITE_URL + "/"):
            problems.append(f"{label}: canonical does not use the configured domain")
        if not re.search(r'<html\b[^>]*\blang="es-CO"', content, re.I):
            problems.append(f"{label}: html lang must be es-CO")
        if document.headings["h1"] != 1:
            problems.append(f"{label}: expected exactly one h1")
        for name in ("og:title", "og:description", "og:url", "twitter:card", "twitter:title", "twitter:description"):
            if not any(meta.get("property") == name or meta.get("name") == name for meta in document.meta):
                problems.append(f"{label}: missing social metadata {name}")
        ids = Counter(document.ids)
        for duplicate in (value for value, count in ids.items() if count > 1):
            problems.append(f"{label}: duplicate id #{duplicate}")
        for image in document.images:
            if "alt" not in image:
                problems.append(f"{label}: image is missing alt text")
        for button in document.buttons:
            if not any(button.get(key) for key in ("aria-label", "aria-labelledby", "title")) and not button.get("type"):
                problems.append(f"{label}: button needs an accessible name and explicit type")
        for select in document.selects:
            if not any(select.get(key) for key in ("aria-label", "aria-labelledby")):
                problems.append(f"{label}: select needs an accessible label")
        for controlled_id in document.aria_controls:
            if controlled_id not in document.ids:
                problems.append(f"{label}: aria-controls references missing id #{controlled_id}")

        for raw_url in document.links:
            target, fragment = page_path(raw_url, page)
            if target is None:
                continue
            if not target.exists():
                problems.append(f"{label}: broken local link {raw_url}")
            elif fragment and target.suffix == ".html":
                target_document = documents.get(target)
                if target_document is None:
                    target_document = parse_document(target)
                if fragment not in target_document.ids:
                    problems.append(f"{label}: missing fragment in {raw_url}")

        for asset in document.scripts + document.styles + document.resources:
            if asset.startswith(("http://", "https://")):
                continue
            asset_path = (ROOT / asset.lstrip("/")).resolve()
            if not asset_path.exists():
                problems.append(f"{label}: missing local resource {asset}")

        for source in document.json_ld:
            try:
                json.loads(source)
            except json.JSONDecodeError as error:
                problems.append(f"{label}: invalid JSON-LD ({error})")

    titles = []
    for page in pages:
        match = re.search(r"<title>(.*?)</title>", page.read_text(encoding="utf-8"), re.I | re.S)
        if match:
            titles.append(match.group(1).strip())
    for title, count in Counter(titles).items():
        if count > 1:
            problems.append(f"duplicate page title: {title}")

    try:
        sitemap = ET.parse(ROOT / "sitemap.xml")
        namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = [node.text or "" for node in sitemap.findall(".//sm:loc", namespace)]
        if len(urls) != len(set(urls)):
            problems.append("sitemap.xml contains duplicate URLs")
        for url in urls:
            if not url.startswith(SITE_URL + "/"):
                problems.append(f"sitemap URL uses an unexpected domain: {url}")
            path = urlsplit(url).path
            target = ROOT / (path.lstrip("/") or "index.html")
            if not target.is_file():
                problems.append(f"sitemap URL has no matching file: {url}")
    except (ET.ParseError, OSError) as error:
        problems.append(f"invalid sitemap.xml: {error}")

    robots_path = ROOT / "robots.txt"
    robots = robots_path.read_text(encoding="utf-8") if robots_path.exists() else ""
    if f"Sitemap: {SITE_URL}/sitemap.xml" not in robots:
        problems.append("robots.txt is missing the canonical sitemap URL")
    if "Disallow: /404.html" not in robots:
        problems.append("robots.txt should keep the 404 page out of crawling")
    if "noindex" not in (ROOT / "404.html").read_text(encoding="utf-8").lower():
        problems.append("404.html should remain noindex")

    javascript = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
    phone = re.search(r"WHATSAPP_NUMBER\s*=\s*'([^']+)'", javascript)
    if not phone or phone.group(1) != "573183310300":
        problems.append("WhatsApp number is not configured as 573183310300")
    if "chat.innerHTML" in javascript or "innerHTML =" in javascript:
        problems.append("JE IA must not put dynamic/user text into innerHTML")
    if "textContent" not in javascript:
        problems.append("JE IA should render dynamic text through textContent")

    homepage = documents.get(ROOT / "index.html")
    if homepage:
        schema = next((json.loads(item) for item in homepage.json_ld), {})
        if schema.get("@type") != "LocalBusiness":
            problems.append("homepage should use the verified generic LocalBusiness schema type")
        if schema.get("telephone") != "+57 318 331 0300":
            problems.append("LocalBusiness telephone does not match the confirmed WhatsApp number")
        for unknown in ("address", "openingHours", "openingHoursSpecification", "geo", "aggregateRating", "review"):
            if unknown in schema:
                problems.append(f"LocalBusiness includes unconfirmed business data: {unknown}")

    css = (ROOT / "assets/css/site.css").read_text(encoding="utf-8")
    if "@import" in css or "fonts.googleapis.com" in css:
        problems.append("CSS should not load external fonts")
    for breakpoint in ("1020px", "900px", "680px", "360px"):
        if f"@media(max-width:{breakpoint})" not in css:
            problems.append(f"missing responsive breakpoint {breakpoint}")
    if ":focus-visible" not in css:
        problems.append("missing visible keyboard focus styling")
    if "prefers-reduced-motion:reduce" not in css:
        problems.append("missing reduced-motion preference handling")
    css_without_comments = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css_without_strings = re.sub(r"(['\"])(?:\\.|(?!\1).)*\1", "", css_without_comments)
    balance = 0
    for character in css_without_strings:
        if character == "{":
            balance += 1
        elif character == "}":
            balance -= 1
        if balance < 0:
            break
    if balance != 0:
        problems.append("CSS blocks contain unmatched braces")
    cname = ROOT / "CNAME"
    if not cname.exists() or cname.read_text(encoding="utf-8").strip() != "jesolucionesdosquebradas.com":
        problems.append("CNAME does not match the configured custom domain")

    def luminance(color: str) -> float:
        channels = [int(color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
        linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in channels]
        return sum(channel * weight for channel, weight in zip(linear, (0.2126, 0.7152, 0.0722)))

    def contrast(first: str, second: str) -> float:
        lighter, darker = sorted((luminance(first), luminance(second)), reverse=True)
        return (lighter + 0.05) / (darker + 0.05)

    key_text_pairs = {
        "light-background eyebrow": ("#59655f", "#f5f6f1"),
        "small card label": ("#58665e", "#ffffff"),
        "muted body text": ("#56625e", "#f5f6f1"),
        "map label": ("#53624c", "#e3e9df"),
        "footer metadata": ("#748184", "#0b1216"),
        "dark hero note": ("#96a3a6", "#101820"),
    }
    for name, (foreground, background) in key_text_pairs.items():
        if contrast(foreground, background) < 4.5:
            problems.append(f"text contrast below WCAG AA for {name}")

    return problems


if __name__ == "__main__":
    errors = check()
    if errors:
        print(f"Found {len(errors)} problem(s):")
        print("\n".join(f"- {error}" for error in errors))
        sys.exit(1)
    print("Static site checks passed.")
    print(f"Checked {len(list(ROOT.glob('*.html')))} HTML pages, local links/assets, SEO metadata, JSON-LD, robots.txt, sitemap.xml, WhatsApp configuration, and JE IA text rendering.")
