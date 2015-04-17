# Not used anymore since generating TOC is done during build not in the github workflow

if [ ! -f "${1}" ]; then

  echo "${0} error: File '${1}' does not exist."
fi

if [ $(awk '/<!-- toc -->/{flag=1;next}/<!-- tocstop -->/{flag=0}flag' "${1}" | wc -l) -ne 0 ]; then
  echo "${0} error: TOC is already generated. Please remove it before running the workflow."

  exit 1
fi

echo "${0} error: All good"