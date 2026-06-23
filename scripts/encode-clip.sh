#!/usr/bin/env bash
#
# Encode a teaser clip from its ORIGINAL recording into the four files the site
# ships, plus posters. Run this on the raw screen-capture (NOT on an already-
# compressed clip — re-encoding a compressed file can't recover lost detail).
#
#   scripts/encode-clip.sh <name> <landscape-original> <portrait-original>
#
# Examples:
#   scripts/encode-clip.sh peggy_ashcroft ~/raw/peggy_land.mov ~/raw/peggy_port.mov
#   scripts/encode-clip.sh scholars_mate ~/raw/scholars_mate.mov   # crop fallback (warns)
#
# PASS A DEDICATED PORTRAIT RECORDING. The feed is full-screen 9:16, so portrait
# wants its own framing (composed for vertical), not a centre-crop of the
# landscape clip — cropping throws away the sides and usually mis-frames the
# subject. If you omit the portrait original the script still runs, but it
# centre-crops 9:16 from the landscape one and prints a loud warning.
#
# Produces, for <name>:
#   src/assets/videos/<name>_landscape.mp4       H.264  (universal fallback)
#   src/assets/videos/<name>_landscape_av1.mp4   AV1    (modern browsers; ~30-50% smaller)
#   src/assets/videos/<name>_portrait.mp4        H.264
#   src/assets/videos/<name>_portrait_av1.mp4    AV1
#   src/assets/thumbnails/<name>_landscape.jpg   poster (posterUrl, first frame)
#   src/assets/thumbnails/<name>_portrait.jpg    poster (mobilePosterUrl, first frame)
#   src/assets/thumbnails/<name>_grid.jpg        profile-grid tile (gridPosterUrl, @1.5s)
#
# The two codecs are the point: AV1 hits the same visual quality as H.264 in far
# fewer bytes, so you can raise quality (lower CRF) and still land near today's
# file size. The site offers AV1 first and H.264 as a <source> fallback, so the
# browser picks the best it can decode (see "the <source> refactor" in CLAUDE.md).
#
# Tunables (override via env): HEIGHT, FPS, H264_CRF, AV1_CRF.
#   Higher quality  -> lower CRF (bigger files).  Smaller files -> higher CRF.
set -euo pipefail

HEIGHT="${HEIGHT:-720}"     # output height; 720p is plenty for the small CRT
FPS="${FPS:-30}"
H264_CRF="${H264_CRF:-23}"  # was 28 on the old clips; AV1 lets us afford better H.264 too
AV1_CRF="${AV1_CRF:-28}"    # SVT-AV1 scale (0-63); ~28 ≈ visually transparent here

if [ "$#" -lt 2 ]; then
  sed -n '3,17p' "$0"   # print the usage header
  exit 1
fi

NAME="$1"
LAND_SRC="$2"
PORT_SRC="${3:-}"

command -v ffmpeg >/dev/null 2>&1 || { echo "error: ffmpeg not found on PATH"; exit 1; }

# Repo-root-relative output dirs (script lives in scripts/).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VID="$ROOT/src/assets/videos"
THUMB="$ROOT/src/assets/thumbnails"
mkdir -p "$VID" "$THUMB"

# Pick whichever AV1 encoder this ffmpeg build has (SVT is faster; aom is the
# reference). The CLI flags differ, so each gets its own arg set.
if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libsvtav1; then
  AV1_ARGS=(-c:v libsvtav1 -preset 6 -crf "$AV1_CRF")
elif ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libaom-av1; then
  AV1_ARGS=(-c:v libaom-av1 -crf "$AV1_CRF" -b:v 0 -cpu-used 4 -row-mt 1)
else
  echo "error: this ffmpeg has neither libsvtav1 nor libaom-av1 (no AV1 support)"; exit 1
fi

H264_ARGS=(-c:v libx264 -preset slow -crf "$H264_CRF" -profile:v high)
COMMON=(-pix_fmt yuv420p -movflags +faststart -an)   # -an: clips play muted

# scale to HEIGHT, even width (-2), set fps. Portrait additionally centre-crops 9:16.
LAND_VF="scale=-2:${HEIGHT},fps=${FPS}"
PORT_CROP="crop='trunc(ih*9/16/2)*2':ih"

echo "→ landscape H.264"
ffmpeg -y -i "$LAND_SRC" -vf "$LAND_VF" "${H264_ARGS[@]}" "${COMMON[@]}" "$VID/${NAME}_landscape.mp4"
echo "→ landscape AV1"
ffmpeg -y -i "$LAND_SRC" -vf "$LAND_VF" "${AV1_ARGS[@]}"  "${COMMON[@]}" "$VID/${NAME}_landscape_av1.mp4"

if [ -n "$PORT_SRC" ]; then
  PORT_IN="$PORT_SRC";        PORT_VF="scale=-2:${HEIGHT},fps=${FPS}"
else
  PORT_IN="$LAND_SRC";        PORT_VF="${PORT_CROP},scale=-2:${HEIGHT},fps=${FPS}"
  echo "⚠️  no portrait original given — centre-cropping 9:16 from the landscape clip."
  echo "    The feed is full-screen vertical; a dedicated portrait recording looks"
  echo "    much better. Pass one as the 3rd argument when you have it."
fi
echo "→ portrait H.264"
ffmpeg -y -i "$PORT_IN" -vf "$PORT_VF" "${H264_ARGS[@]}" "${COMMON[@]}" "$VID/${NAME}_portrait.mp4"
echo "→ portrait AV1"
ffmpeg -y -i "$PORT_IN" -vf "$PORT_VF" "${AV1_ARGS[@]}"  "${COMMON[@]}" "$VID/${NAME}_portrait_av1.mp4"

# Posters (first frame, codec-agnostic — one each is fine):
#   *_landscape.jpg / *_portrait.jpg  = <video poster> (posterUrl / mobilePosterUrl)
#   *_grid.jpg                        = profile-grid tile (gridPosterUrl), grabbed
#                                       1.5s in so the tile previews real content,
#                                       not an intro/title first frame.
echo "→ posters"
ffmpeg -y -i "$VID/${NAME}_landscape.mp4" -frames:v 1 -vf "scale=-2:540" -q:v 4 "$THUMB/${NAME}_landscape.jpg"
ffmpeg -y -i "$VID/${NAME}_portrait.mp4"  -frames:v 1 -vf "scale=-2:540" -q:v 4 "$THUMB/${NAME}_portrait.jpg"
ffmpeg -y -ss 1.5 -i "$VID/${NAME}_portrait.mp4" -frames:v 1 -vf "scale=-2:540" -q:v 4 "$THUMB/${NAME}_grid.jpg"

echo
echo "done. files for '${NAME}':"
ls -lh "$VID/${NAME}_"*.mp4 "$THUMB/${NAME}_"*.jpg | awk '{print "  "$5"\t"$9}'
