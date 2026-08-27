<first stage>

create ascii.ts next to ascii.html

and allow me to always transpile it

on the page just load ascii.js - don't worry about transpilation

I need ascii editor in pages/ascii.html

Entire project should be just in one file pages/ascii.html

what I need is some kind of infinite canvas - when press space it should allow me moving on the canvas with the mouse all directions

Canvas should have grid where each cell is of size of one ascii character

then whereve I press I shold be able to just type text on that canvas

I should be able to select rectangular area and copy it to the clipboard as a ascii "image" to copy somewhere else

Basicaly it should be tool to create any ascii image

by default we should have this select mode which allow us to select this and that, once something is selected I can just take it and move to different place on the canvas

in select mode we should be able to just press on the ascii line and drag it

if it is horizontal like then dragging up and down wil move entire line up and down and extend or shring all connected perpendicular lines

the same for vertical line only left and right should shring or extend perpendicular lines

also if that is kinda grid then it should move all what is below or what is above, or what is on the left or on the right when moving the line

It's like extending/shrinking column or a row in the table

on the left we should have tool panel with clear visible handler to drag it around to never allow it to hide part of our image.

we should have tools to draw lines from point to point
one tool would serve for drawing lines where we bend line in the midle like zigzag. where tool prefers to draw horizontal lines with vertical line in the middle compensating for the difference in height

```

   ────────────────┐
                   │
                   │
                   │
                   │
                   │
                   │
                   │
                   │
                   └────────────────────


```

or

```

       │
       │
       │
       │
       └───────────┐
                   │
                   │
                   │
                   │
                   │
                   │

```

when shift button is pressed

</first stage>

<second stage>

we should also have tool to draw rectangles

</second stage>

<third stage>

also tool to draw any shape

</third stage>
