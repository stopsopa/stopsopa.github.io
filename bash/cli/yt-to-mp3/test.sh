
node -v 1> /dev/null 2> /dev/null

if [[ "${?}" != "0" ]]; then

  echo "error: node is not installed";

  exit 1
fi

yt-dlp --version 1> /dev/null 2> /dev/null

if [[ "${?}" != "0" ]]; then

  echo "error: yt-dlp is not installed";

  exit 1
fi

ffmpeg -version 1> /dev/null 2> /dev/null

if [[ "${?}" != "0" ]]; then

  echo "error: ffmpeg is not installed";

  exit 1
fi
