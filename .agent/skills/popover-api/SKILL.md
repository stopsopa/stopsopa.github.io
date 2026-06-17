---
name: popover-api
description: Use this skill every time one desire to place one element (tooltip, menu, popover, modal etc) in relation to some other element on the page. Always use the modern native browser popover api, not css positioning hacks.
---

<core-css>

[assets/popover.css](assets/popover.css)

this is main source of truth for css style this entire document will be based around.

if it will be upated in comparison to our local copy then our local copy have to be updated.

When asked for the first time to use popover api, start first from copying file [assets/popover.css](assets/popover.css) somewhere into the project.

It is reasonable to consult with the user where exactly that file should be copied to the project and in what way it should be loaded if it is not clear.

But fundamentally it is just simple flat css file so if there are places in the framework to load it then just follow reasonable standards.
Just try to avoid loading it twice due to ergonomic reasons.

</core-css>

<basic-structure>

# when popover should show on anchor click

<anchor-toggle-with-close-button>

when using our core-css to position popover then basic structure is:

```
<button popovertarget="mypopover2">Toggle the popover</button>
<div id="mypopover2" popover data-popover>
  Popover content
  <button popovertarget="mypopover2" popovertargetaction="hide">Close</button>
</div>
```

above example assumes you have anchor button which once clicked will show popover and when clicked again will hide popover.

but also clicking inside popover will NOT hide it, except the button "Close" - that will close it.

Also clicking beyound popover will hide the popover.

NOTE; defining "close" button here is optional, all will be 100% functional without it too.

Usually this is default layout.

The main enabler here is attribute 'data-popover', this is the element activating styles from [assets/popover.css](assets/popover.css).

This way if there is such need you can use native popover api and our css styles from assets/popover.css will not interfeer with your manual code when attribute data-popover is not added.

Beyond that attribute the html snippet above follows just standard native popover api implementation.

So all examples presented in this document can be controlled by any other javascript and html apis which normally could be used with regular native popover api.

</anchor-toggle-with-close-button>

<close-only-with-button>

```
<button popovertarget="mypopover3">Toggle the popover</button>
<div id="mypopover3" popover="manual" data-popover>
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
<div id="mypopover4" popover data-popover>
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

Above there are two sets of containers -> class="container". (with separate classes 'one' and 'two')

Each container have 3 buttons.

Each button have 'interestfor' attribute pointing to id in 3 popovers.

Pay attention that we have 2 containers each with 3 buttons and only 3 popovers. This actually demonstrate that this is relation:
multiple elements hovered can trigger showing the same popover - and this is fine and allowed.

And most importantly: attribute 'interestfor' instead of 'popovertarget' that will change how popover is showing.

Using 'interestfor' will show popover on just mouse hover.
Instead of when using 'popovertarget' which will show popover on click.

</popover-on-mouse-hover>

</basic-structure>

<position>

For deciding where exactly popover should appear in relation to anchor element we will use our core-css file.

What our core-css file requires is to add [data-popover] attribute to the popover element.

from that point controlling position of popover in relation to anchor element is done via adding css class to element with 'data-popover' attribute.

Here are classes which are available:

- class **top**: Positioned **above** the anchor, horizontally **centered**. (this is default style used even when no class is added to 'data-popover' element)
- class **bottom**: Positioned **below** the anchor, horizontally **centered**.
- class **left**: Positioned to the **left** of the anchor, vertically **centered**.
- class **right**: Positioned to the **right** of the anchor, vertically **centered**.

- class **top-left**: Positioned **above** the anchor, its **left edge** aligned with the anchor's **left edge**.
- class **top-right**: Positioned **above** the anchor, its **right edge** aligned with the anchor's **right edge**.
- class **bottom-left**: Positioned **below** the anchor, its **left edge** aligned with the anchor's **left edge**.
- class **bottom-right**: Positioned **below** the anchor, its **right edge** aligned with the anchor's **right edge**.

- class **center**: Positioned **directly over** the anchor, centered both horizontally and vertically.

- class **topleft**: bottom right corner of the poppover touches top left corner of the anchor
- class **topright**: bottom left corner of the poppover touches top right corner of the anchor
- class **bottomleft**: top right corner of the popover touches bottom left corner of the anchor
- class **bottomright**: top left corner of the popover touches bottom right corner of the anchor

- class **left-top**: Positioned to the **left** of the anchor, its **top edge** aligned with the anchor's **top edge**.
- class **left-bottom**: Positioned to the **left** of the anchor, its **bottom edge** aligned with the anchor's **bottom edge**.
- class **right-top**: Positioned to the **right** of the anchor, its **top edge** aligned with the anchor's **top edge**.
- class **right-bottom**: Positioned to the **right** of the anchor, its **bottom edge** aligned with the anchor's **bottom edge**.

</position>

<framework-agnostic>

The formation of html using 'data-popover' attribute to activate our core-css styles is universal.

It can be used in vanilla html, react, angular, svelte and others.

It will work as long as basic underlying html will match to what is presented in examples above.

Occasionally it will have to wrapped though with some standard react wrapper components or any other formation specific to given framework.

Just do what is right for given framework context on top of what is presented in examples above.

</framework-agnostic>

<help-demo>

In case user is confused which class to use then propose user the link to main github page demo page where behaviour of classes is presented in interactive way:

https://stopsopa.github.io/skill-popover-api/demo/index.html

user will be able to observe which class to use to properly position popover as needed.

From that demo page user can also go to the main github page for more details with just one click on the ribbon widget.

</help-demo>
