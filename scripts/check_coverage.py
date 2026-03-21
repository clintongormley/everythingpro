"""Check per-file coverage meets the minimum threshold."""

import json
import sys

THRESHOLD = 90


def main() -> int:
    with open("coverage.json") as f:
        data = json.load(f)

    failures: list[tuple[str, float]] = []

    for path, file_data in data["files"].items():
        pct = file_data["summary"]["percent_covered"]
        if pct < THRESHOLD:
            failures.append((path, pct))

    if failures:
        print(f"FAIL: {len(failures)} file(s) below {THRESHOLD}% coverage:\n")
        for path, pct in sorted(failures):
            print(f"  {pct:5.1f}%  {path}")
        return 1

    total = data["totals"]["percent_covered"]
    print(f"OK: all files >= {THRESHOLD}% coverage (aggregate: {total:.1f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
