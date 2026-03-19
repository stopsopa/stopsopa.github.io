---
name: popover-api
description: How to use native browser popover api to position
---

<core-css>

https://stopsopa.github.io/pages/js/popper/html-vanilla/popover.css

this is main source of truth for css style this entire document will be based around.

if it will be upated in comparison to our local copy then our local copy have to be updated.

When asked for the first time to use popover api, start first from wget'tting that css file into the project.

</core-css>

<basic-structure>

# when popover should show on anchor click

<anchor-toggle-with-close-button>

when using our core-css to position popover then basic structure is:

```
<button popovertarget="mypopover2">Toggle the popover</button>
<div id="mypopover2" popover>
  Popover content
  <button popovertarget="mypopover2" popovertargetaction="hide">Close</button>
</div>
```

above example assumes you have anchor button which once clicked will show popover and when clicked again will hide popover.

but also clicking inside popover will NOT hide it, except the button "Close" - that will close it.

Also clicking beyound popover will hide the popover.

NOTE; defining "close" button here is optional, all will be 100% functional without it too.

Usually this is default layout

</anchor-toggle-with-close-button>

<close-only-with-button>

```
<button popovertarget="mypopover3">Toggle the popover</button>
<div id="mypopover3" popover="manual">
  our popover content
  <button popovertarget="mypopover3" popovertargetaction="hide">Close</button>
</div>
```

here we will close only on "Close" button.

The main change is popover="manual" - when popover is in manual mode we can close it only via js or by clicking element with popovertargetaction="hide"

</close-only-with-button>

<id-always-unique>

In this basic example keep id always unique for givin formation of divs meant to implement single popover.
But also make popovertarget to always point to that particular id to keep these dom elements to work together.

```
<button popovertarget="mypopover4">Toggle the popover</button>
<div id="mypopover4" popover>
  Popover content
  <button popovertarget="mypopover4" popovertargetaction="hide">Close</button>
</div>
```

</id-always-unique>

<popover-on-mouse-hover>

```
<div class="container one">
  <button class="toolbar-button" interestfor="popover-b"><b>B</b></button>
  <button class="toolbar-button" interestfor="popover-i"><i>I</i></button>
  <button class="toolbar-button" interestfor="popover-u"><u>U</u></button>
</div>

<div class="container two">
  <button class="toolbar-button" interestfor="popover-b"><b>B</b></button>
  <button class="toolbar-button" interestfor="popover-i"><i>I</i></button>
  <button class="toolbar-button" interestfor="popover-u"><u>U</u></button>
</div>

<span popover="" id="popover-b" data-popover class="bottom">Bold</span>
<span popover="" id="popover-i" data-popover>Italic</span>
<span popover="" id="popover-u" data-popover>Underline</span>

```

Above there are two sets of containers -> class="container".

Each container have 3 buttons.

Each button have interestfor attribute pointing to id in 3 popovers.

Pay attention that we have 2 containers each with 3 buttons and only 3 popovers. This actually demonstrate that this is relation:
multiple elements hovered can trigger showing the same popover - and this is fine and allowed.

And most importantly: attribute interestfor instead of popovertarget that will change how popover is showing.

Using interestfor will show popover on just mouse hover.
Instead of when using popovertarget which will show popover on click.

</popover-on-mouse-hover>

</basic-structure>

<position>

For deciding where exactly popover should appear in relation to anchor element we will use our core-css file.

What our core-css file requires is to add [data-popover] attribute to the popover element.

from that point controlling position of popover in relation to anchor element is done via adding css class.

Here are classes which are available:

- **top**: Positioned **above** the anchor, horizontally **centered**.
- **bottom**: Positioned **below** the anchor, horizontally **centered**.
- **left**: Positioned to the **left** of the anchor, vertically **centered**.
- **right**: Positioned to the **right** of the anchor, vertically **centered**.

- **top-left**: Positioned **above** the anchor, its **left edge** aligned with the anchor's **left edge**.
- **top-right**: Positioned **above** the anchor, its **right edge** aligned with the anchor's **right edge**.
- **bottom-left**: Positioned **below** the anchor, its **left edge** aligned with the anchor's **left edge**.
- **bottom-right**: Positioned **below** the anchor, its **right edge** aligned with the anchor's **right edge**.

- **center**: Positioned **directly over** the anchor, centered both horizontally and vertically.

- **topleft**: bottom right corner of the poppover touches top left corner of the anchor
- **topright**: bottom left corner of the poppover touches top right corner of the anchor
- **bottomleft**: top right corner of the popover touches bottom left corner of the anchor
- **bottomright**: top left corner of the popover touches bottom right corner of the anchor

- **left-top**: Positioned to the **left** of the anchor, its **top edge** aligned with the anchor's **top edge**.
- **left-bottom**: Positioned to the **left** of the anchor, its **bottom edge** aligned with the anchor's **bottom edge**.
- **right-top**: Positioned to the **right** of the anchor, its **top edge** aligned with the anchor's **top edge**.
- **right-bottom**: Positioned to the **right** of the anchor, its **bottom edge** aligned with the anchor's **bottom edge**.

</position>
