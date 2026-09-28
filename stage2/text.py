"""Human-editable game text.

Every line the player sees lives in terminal/text/*.txt, so changing a word is a
grep-and-edit in that folder, with no Python involved. The format is dead simple:

    # a comment (only before the first section)
    [section.key]
    First line of the text.
    Second line, blank lines between paragraphs are kept.

    [another.key]
    Templates use {name} placeholders: Cleared {cleared}, {remaining} left.

Load a value with T("file", "key") and fill placeholders with keywords:
T("characters", "rocky.crew_work", cleared=3, remaining=5). Use lines() when you
want it split into a list. Files are cached; call reload() after editing if the
process is long-lived.
"""
from __future__ import annotations
import os

_DIR = os.path.join(os.path.dirname(__file__), "text")  # stage2/text/
_CACHE: dict = {}


def _load(name: str) -> dict:
    sections: dict = {}
    key, buf = None, []
    with open(os.path.join(_DIR, name + ".txt"), encoding="utf-8") as f:
        for raw in f:
            line = raw.rstrip("\n")
            s = line.strip()
            if s.startswith("[") and s.endswith("]") and len(s) > 2:
                if key is not None:
                    sections[key] = "\n".join(buf).strip("\n")
                key, buf = s[1:-1].strip(), []
            elif s.startswith("#"):
                continue           # a comment line, anywhere in the file
            elif key is not None:
                buf.append(line)
            # other lines before the first [section] are ignored
        if key is not None:
            sections[key] = "\n".join(buf).strip("\n")
    return sections


def _file(name: str) -> dict:
    if name not in _CACHE:
        _CACHE[name] = _load(name)
    return _CACHE[name]


def T(file: str, key: str, /, **kw) -> str:
    """One text value, with {placeholders} filled from keywords. file/key are
    positional-only so a {name} or {key} placeholder never clashes with them."""
    val = _file(file).get(key)
    if val is None:
        return f"<{file}.{key}?>"      # visible, greppable miss
    if kw:
        try:
            val = val.format(**kw)
        except (KeyError, IndexError, ValueError):
            pass
    return val


def has(file: str, key: str, /) -> bool:
    """True if the key exists. Lets a caller page through case1, case2, ...
    without hard-coding how many there are."""
    return _file(file).get(key) is not None


def lines(file: str, key: str, /, **kw) -> list:
    """A text value split into a list of lines."""
    val = T(file, key, **kw)
    return val.split("\n") if val else [""]


def reload():
    _CACHE.clear()
