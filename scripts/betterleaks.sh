#!/bin/sh
set -eu

# Use the same immutable release locally and in CI; verify before executing it.
version=1.10.0
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
case "$(uname -s)" in
  Darwin) platform=darwin ;;
  Linux) platform=linux ;;
  *) echo 'Betterleaks setup supports macOS and Linux.' >&2; exit 1 ;;
esac
case "$(uname -m)" in
  arm64|aarch64) arch=arm64 ;;
  x86_64) arch=x64 ;;
  *) echo 'Unsupported Betterleaks architecture.' >&2; exit 1 ;;
esac
install_dir="$repo_root/.tools/betterleaks/$version-$platform-$arch"
scanner="$install_dir/betterleaks"
if [ ! -x "$scanner" ]; then
  archive="betterleaks_${version}_${platform}_${arch}.tar.gz"
  base="https://github.com/betterleaks/betterleaks/releases/download/v$version"
  scratch=$(mktemp -d)
  trap 'rm -rf "$scratch"' EXIT HUP INT TERM
  curl --fail --silent --show-error --location "$base/$archive" -o "$scratch/$archive"
  curl --fail --silent --show-error --location "$base/checksums.txt" -o "$scratch/checksums.txt"
  expected=$(awk -v name="$archive" '$2 == name { print $1 }' "$scratch/checksums.txt")
  if command -v sha256sum >/dev/null 2>&1; then
    actual=$(sha256sum "$scratch/$archive" | awk '{print $1}')
  else
    actual=$(shasum -a 256 "$scratch/$archive" | awk '{print $1}')
  fi
  if [ -z "$expected" ] || [ "$actual" != "$expected" ]; then
    echo 'Betterleaks download checksum verification failed.' >&2
    exit 1
  fi
  tar -xzf "$scratch/$archive" -C "$scratch" betterleaks
  mkdir -p "$install_dir"
  mv "$scratch/betterleaks" "$scanner"
  chmod 755 "$scanner"
fi

# Select config explicitly: v1.10.0 does not auto-load repository config.
# Never contact credential providers or expose raw findings in routine scans.
exec "$scanner" "$@" --config "$repo_root/.betterleaks.toml" --redact=100 --verbose --no-banner --validation=false --ignore-gitleaks-allow
