
# https://youtu.be/Sx9zG7wa4FA?t=23237
# save the cursor position
printf '\e7'
# jump somewhere
printf '\e[20;20H'

# print Hello World
printf 'Hello World'

# jump back to the saved position
printf '\e8'
