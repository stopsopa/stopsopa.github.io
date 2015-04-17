arr=(foo bar baz)
printf '%s\n' hello how are you
# hello
# how
# are
# you
echo " ONE"
printf '%s\n' "${arr[@]}"
#  ONE
# foo
# bar
# baz
echo " TWO"
printf '%s\n' "${arr[@]:0:2}"
#  TWO
# foo
# bar
echo " THREE"
printf '%s\n' "${arr[@]//a/o}"
#  THREE
# foo
# bor
# boz
echo " FOUR"
printf '%s\n' "${arr[@]%z}"
#  FOUR
# foo
# bar
# ba
echo " FIVE"
printf '%s\n' "${arr[@]#b}"
#  FIVE
# foo
# ar
# az
echo " SIX"
(IFS=_; echo "${arr[*]}")
#  SIX
# foo_bar_baz


