

S="dave eddy"
echo "${#S}" # prints >9< - works in all shells

echo "${S^}" # Dave eddy - in bash:4.1 & bash:4.4 & bash:5.1
    # throw in zsh       *.sh:6: bad substitution
    # throw in bash:3.1  *.sh: line 6: ${S^}: bad substitution
    # throw in sh:2      *.sh: 6: Bad substitution

echo "${S^^}" # DAVE EDDY - in bash:4.1 & bash:4.4 & bash:5.1
    # throw in zsh       *.sh:6: bad substitution
    # throw in bash:3.1  *.sh: line 6: ${S^^}: bad substitution
    # throw in sh:2      *.sh: 6: Bad substitution

echo "${S^^d}" # Dave eDDy - in bash:4.1 & bash:4.4 & bash:5.1
    # throw in zsh       *.sh:6: bad substitution
    # throw in bash:3.1  *.sh: line 6: ${S^^d}: bad substitution
    # throw in sh:2      *.sh: 6: Bad substitution

echo "${S^^[da]}" # DAve eDDy - in bash:4.1 & bash:4.4 & bash:5.1
    # throw in zsh       *.sh:6: bad substitution
    # throw in bash:3.1  *.sh: line 6: ${S^^[da]}: bad substitution
    # throw in sh:2      *.sh: 6: Bad substitution

S="DAVE EDDY"    
echo "${S,,}" # dave eddy - in bash:4.1 & bash:4.4 & bash:5.1
    # throw in zsh       *.sh:6: bad substitution
    # throw in bash:3.1  *.sh: line 6: ${S,,}: bad substitution
    # throw in sh:2      *.sh: 6: Bad substitution

name=${1:-dave} # set to "dave" if ${1} is empty or unset
echo ">${name}<"

