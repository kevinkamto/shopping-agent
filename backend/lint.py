import subprocess
import sys


def run(cmd: list[str]) -> None:
    result = subprocess.run(cmd)
    if result.returncode != 0:
        sys.exit(result.returncode)


run(["uv", "run", "ruff", "check", ".", "--fix"])
run(["uv", "run", "ruff", "format", "."])
run(["uv", "run", "mypy", "app/"])
