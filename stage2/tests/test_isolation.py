"""The live game must not move. Run this in every test pass.

pyrocene.netlify.app is built from main and serves engine/, terminal/, web/ and
game/. Stage 2 copies what it needs into stage2/ and imports only the copies, so
a push of this branch can never change what is already in people's hands.
"""
import os
import subprocess
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROTECTED = ["engine", "terminal", "web", "game"]


class Isolation(unittest.TestCase):
    def test_live_directories_unchanged(self):
        base = subprocess.run(["git", "merge-base", "HEAD", "main"], cwd=ROOT,
                              capture_output=True, text=True).stdout.strip()
        diff = subprocess.run(["git", "diff", "--stat", base, "--", *PROTECTED],
                              cwd=ROOT, capture_output=True, text=True).stdout.strip()
        self.assertEqual(diff, "", f"stage 2 changed the live game:\n{diff}")

    def test_untracked_and_staged_changes_are_clean(self):
        out = subprocess.run(["git", "status", "--porcelain", "--", *PROTECTED],
                             cwd=ROOT, capture_output=True, text=True).stdout.strip()
        self.assertEqual(out, "", f"uncommitted changes in the live game:\n{out}")

    def test_stage2_never_imports_the_live_packages(self):
        """Parse the code rather than grep it: the copied engine's docstring
        shows `from engine import ...` as usage, which is not an import."""
        import ast
        bad = []
        for dirpath, _, names in os.walk(os.path.join(ROOT, "stage2")):
            for n in sorted(names):
                if not n.endswith(".py"):
                    continue
                p = os.path.join(dirpath, n)
                tree = ast.parse(open(p, encoding="utf-8").read(), filename=p)
                rel = os.path.relpath(p, ROOT)
                for node in ast.walk(tree):
                    if isinstance(node, ast.ImportFrom):
                        if node.level == 0 and (node.module or "").split(".")[0] in ("engine", "terminal"):
                            bad.append(f"{rel}:{node.lineno}: from {node.module} import ...")
                    elif isinstance(node, ast.Import):
                        for a in node.names:
                            if a.name.split(".")[0] in ("engine", "terminal"):
                                bad.append(f"{rel}:{node.lineno}: import {a.name}")
        self.assertEqual(bad, [], "stage 2 must import its own frozen copy:\n" + "\n".join(bad))

    def test_netlify_does_not_build_branches(self):
        toml = open(os.path.join(ROOT, "netlify.toml"), encoding="utf-8").read()
        self.assertIn("[context.branch-deploy]", toml,
                      "a branch deploy would rebuild the live site")


if __name__ == "__main__":
    unittest.main()
