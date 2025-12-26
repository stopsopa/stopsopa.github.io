
if [ -n "${ZSH_VERSION:-}" ]; then
  _SHELL=zsh
elif [ -n "${BASH_VERSION:-}" ]; then
  _SHELL=bash
else
  _SHELL=sh
fi

echo ">$_SHELL<"
