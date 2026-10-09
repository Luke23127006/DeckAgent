#!/bin/sh
# PostToolUse hook for Edit and Write.
# After a use case file in docs/spec/03-use-cases/ is edited, tell Claude that the
# "Flow at a glance" block is generated and may need the use-case-flowchart skill.
# Prints nothing for any other file, and nothing for the skill's own edit of the block.
# Reads the hook JSON from stdin. No jq needed. Always exits 0.

payload=$(cat)

path=$(printf '%s' "$payload" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)

# The path is JSON text, so a Windows separator appears as two backslashes.
case "$path" in
  *03-use-cases/UC-*.md | *03-use-cases\\\\UC-*.md) ;;
  *) exit 0 ;;
esac

# The skill replaces the block with an Edit whose new_string starts with the BEGIN marker.
if printf '%s' "$payload" | grep -q '"new_string"[[:space:]]*:[[:space:]]*"<!-- BEGIN generated: use-case-flowchart'; then
  exit 0
fi

name=${path##*/}
name=${name##*\\}

printf '%s' "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"${name} is a use case file. Its Flow at a glance block is generated from the steps and the alternative flows (criterion UCG-12). If this edit changed a step, an alternative flow, or an At or End field, update the block with the use-case-flowchart skill. No update is needed if the edit changed other text.\"}}"
exit 0
