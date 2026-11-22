#!/usr/bin/env bash
# Negative controls: plants one deliberate bug at a time in a scratch copy
# and checks that the test suite fails. A planted bug that the tests miss
# means a rule is not really tested.
#
# Usage: ./negative-controls.sh   (run from the project folder after npm ci)

set -u
cd "$(dirname "$0")"
ROOT="$(pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

caught=0
missed=0
broken=0

# plant <description> <file> <perl substitution>
# plant_bytes <description> <file> <node code>   (edits a binary file; the code gets `b`, a Buffer)
plant() {
  apply_and_test "$1" "$2" perl "$3"
}

plant_bytes() {
  apply_and_test "$1" "$2" node "$3"
}

apply_and_test() {
  local description="$1" file="$2" tool="$3" change="$4"
  rm -rf "$WORK/copy"
  mkdir -p "$WORK/copy"
  tar --exclude=node_modules --exclude=.next -cf - . | tar -xf - -C "$WORK/copy"
  ln -s "$ROOT/node_modules" "$WORK/copy/node_modules"

  local before after
  before="$(cksum < "$WORK/copy/$file")"
  if [ "$tool" = perl ]; then
    perl -0pi -e "$change" "$WORK/copy/$file"
  else
    node -e "const fs=require('fs');const f=process.argv[1];let b=fs.readFileSync(f);$change;fs.writeFileSync(f,b);" "$WORK/copy/$file"
  fi
  after="$(cksum < "$WORK/copy/$file")"
  if [ "$before" = "$after" ]; then
    echo "SETUP ERROR: the bug for \"$description\" did not apply to $file"
    missed=$((missed + 1))
    return
  fi

  if (cd "$WORK/copy" && npx vitest run > "$WORK/log.txt" 2>&1); then
    echo "MISSED: $description"
    missed=$((missed + 1))
  elif grep -qE 'Tests +[1-9][0-9]* failed' "$WORK/log.txt"; then
    echo "caught: $description"
    caught=$((caught + 1))
  else
    # The run failed without any test failing (a broken setup or a file that won't load): proves nothing.
    echo "BROKEN: $description (the test run did not complete; last lines below)"
    tail -5 "$WORK/log.txt"
    broken=$((broken + 1))
  fi
}

# Baseline: the unchanged project must pass, or every "caught" below would be meaningless.
rm -rf "$WORK/copy"; mkdir -p "$WORK/copy"
tar --exclude=node_modules --exclude=.next -cf - . | tar -xf - -C "$WORK/copy"
ln -s "$ROOT/node_modules" "$WORK/copy/node_modules"
if ! (cd "$WORK/copy" && npx vitest run > "$WORK/log.txt" 2>&1); then
  echo "STOP: the unchanged project does not pass its tests:"; tail -10 "$WORK/log.txt"; exit 1
fi
echo "baseline: unchanged project passes"

plant "bakery open on Mondays and Tuesdays" \
  src/lib/bakery.ts 's/OPEN_DAYS = \[0, 3, 4, 5, 6\]/OPEN_DAYS = [0, 1, 2, 3, 4, 5, 6]/'
plant "order window off by one day" \
  src/lib/order.ts 's/daysAhead > BAKERY\.orderWindowDays/daysAhead >= BAKERY.orderWindowDays/'
plant "yesterday accepted as a pick-up day" \
  src/lib/order.ts 's/daysAhead < 0/daysAhead < -1/'
plant "impossible dates such as 30 February accepted" \
  src/lib/order.ts 's/\) \{\n    return null;\n  \}\n  return time;/) {\n  }\n  return time;/'
plant "\"today\" taken from the server clock (UTC), not the bakery" \
  src/lib/order.ts 's/timeZone,\n    year/timeZone: "UTC",\n    year/'
plant "badly formed emails accepted" \
  src/lib/order.ts 's/!EMAIL_PATTERN\.test\(email\)/false/'
plant "empty orders accepted" \
  src/lib/order.ts 's/items\.length < ITEMS_MIN/items.length < 0/'
plant "order length limit off by one" \
  src/lib/order.ts 's/items\.length > ITEMS_MAX/items.length >= ITEMS_MAX/'
plant "spam trap ignored" \
  src/lib/order.ts 's/input\.website\.trim\(\) !== ""/false/'
plant "typed order lost after an error" \
  src/app/actions.ts 's/items: input\.items \}/items: "" }/'
plant "errors no longer linked to their fields for screen readers" \
  src/components/OrderForm.tsx 's/"aria-describedby": `\$\{field\}-error`//'
plant "demo label removed from the page" \
  src/app/page.tsx 's/Portfolio sample: an invented business/A bakery/'

plant_bytes "one byte of a bake photo changed" \
  public/images/bake-croissant.jpg 'b[b.length-100]^=0xff'
plant_bytes "EXIF metadata added back into the hero photo" \
  public/images/bakery-hero.jpg 'b=Buffer.concat([b.subarray(0,2),Buffer.from([0xff,0xe1,0,8,0x45,0x78,0x69,0x66,0,0]),b.subarray(2)])'
plant "story photo description emptied" \
  src/lib/photos.ts 's/alt: "Flour-dusted hands[^"]*"/alt: ""/'

echo
echo "$caught caught, $missed missed, $broken broken"
[ "$missed" -eq 0 ] && [ "$broken" -eq 0 ]
