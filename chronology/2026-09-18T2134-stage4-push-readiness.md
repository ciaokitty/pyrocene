# Stage 4 push readiness

Checked the `stage4` branch before sharing it through origin. At the start of
this check HEAD was `4213cd7`, with 20 commits beyond `origin/main`. The branch
includes the recent Stage 2 changes as well as Stage 4. Existing game changes
were committed. The remaining participation draft is now preserved at
`v1_participation.md`; only trailing whitespace was removed.

Expanded `.gitignore` for credentials, environment overrides, private keys,
browser authentication state, raw scan data, raster media, screenshots and
release archives. Git cannot ignore files by size. Raster images are ignored
by default with explicit exceptions for the small shipped portraits and lab
examples. No required asset was deleted or removed from tracking.

Measured assets, generated screenshots and offline packages remain outside the
repository. The largest outgoing blob was about 3.39 MB, a lab sample JSON.
The largest tracked PNG was about 1.73 MB. There were no large scan binaries or
release archives in the outgoing history. Cloning the source still requires
the external assets described in the existing delivery documentation.

Used checksum-verified Gitleaks 8.30.1 with redacted output. Scanned the 20
outgoing commits, then all 74 commits reachable from HEAD, plus staged changes.
Reviewed every alert: `pyrocene-ash-cinema-v1` and `pyrocene-stage4-v0` are
localStorage names, and the older xterm alert is a `FourKeyMap` class export.
No credentials were identified. Automated scanning is not a guarantee against
every possible secret. Reports and the temporary scanner are outside the repo.

Verified origin is the public GitHub repository `bprashanth/pyrocene`. The
authenticated account has push permission. A dry-run push to `stage4` succeeded;
no remote branch or PR was created. `origin/main` is an ancestor of this branch.

To publish the branch and open its PR:

```sh
git push -u origin stage4
gh pr create --base main --head stage4
```
