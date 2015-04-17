
#   // https://www.npmjs.com/package/terminal-link
#   // https://github.com/sindresorhus/terminal-link/blob/main/index.js
#     // actually deeper https://github.com/sindresorhus/ansi-escapes/blob/main/base.js

# terminal_link "OpenAI" "https://openai.com" "🌐"
# terminal_link "GitHub" "https://github.com"
# terminal_link "Example" "https://example.com" "↗️"

terminal_link() {
	local text="$1"
	local url="$2"
	local icon="${3:-🔗}"

	printf '%s \033]8;;%s\a%s\033]8;;\a\n' \
		"$icon" "$url" "$text"
}