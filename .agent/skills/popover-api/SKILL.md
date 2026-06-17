---
name: popover-api
description: Use this skill every time one desire to place one element (tooltip, menu, popover, modal etc) in relation to some other element on the page. Always use the modern native browser popover api, not css positioning hacks.
license: GPL-2.0-only
metadata:
  author: stopsopa
  version: "1.0"
  website: https://github.com/stopsopa/skill-popover-api
---

<core-css>
Css style file [assets/popover.css](assets/popover.css) is the main source of truth for css style this entire document will be based around.

If it will be updated in comparison to our local copy then our local copy have to be updated.

When asked for the first time to use popover api, start first from copying file [assets/popover.css](assets/popover.css) somewhere into the project.

It is reasonable to consult with the user where exactly that file should be copied to the project and in what way it should be loaded if it is not clear.

But fundamentally it is just simple flat css file so if there are places in the framework to load it then just follow reasonable standards.
Just try to avoid loading it twice due to ergonomic reasons.

</core-css>

<basic-structure>

# when popover should show on anchor click

<anchor-toggle-with-close-button>

<h2>Use popovertarget attribute to show popover on anchor click</h2>

when using our core-css to position popover then basic structure is:

```html
<button popovertarget="mypopover2">Toggle the popover</button>
<div id="mypopover2" popover data-popover>
  Popover content
  <button popovertarget="mypopover2" popovertargetaction="hide">Close</button>
</div>
```

In above example we have button wich serves as anchor. Button once clicked will show popover (the element with [popover] attribute) and when clicked again will hide popover.

But also clicking inside popover will NOT hide it, except the button "Close" - that will close it.

Also clicking beyound popover will hide the popover.

When you follow the strucuture of this example it is not doing anything more than standard popover api functionality.
And feel free to apply any modification as suitable for user use case.

NOTE; defining "close" button here is optional, all will be 100% functional without it too.

So the html formation is default layout.

The main enabler here is attribute 'data-popover', this is the attribute activating styles from [assets/popover.css](assets/popover.css) which mainly takes care of positioning popover in relation to anchor element.

You can not add attribute [data-popover] but then you will lose our custom styles and popover will behave like regular native element.  
When attribute [data-popover] then you are doing standard raw popover api and probably this skill have nothing to offer. Just do what you need with standard popover api implementation.

But the point is that attribute [data-popover] serves as explicit separation of cases where we are handling popover api using style provided with this skill or handling it manually. So when [data-popover] is not specified our css will not interfeer with your manual popover api implementation.

So generally feel free to use [data-popover] to stick to our styles or avoid it when you prefer using raw native popover api.

Examples presented in this document can be controlled by any other javascript and html apis which normally could be used with regular native popover api.

</anchor-toggle-with-close-button>

<close-only-with-button>

<h2>Use popovertargetattribute with popover="manual" to close popover only on button click</h2>

```html
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

<h2>Use id attribute to identify popover</h2>

In all examples keep id always unique for givin formation of divs meant to implement single popover.
But also make popovertarget to always point to that particular id to keep these dom elements to work together.

NOTE: It is possible though in standard popover api to have multiple anchors pointing to the same popover. If needed then that is naturally allowed.

```html
<button popovertarget="mypopover4">Toggle the popover</button>
<div id="mypopover4" popover data-popover>
  Popover content
  <button popovertarget="mypopover4" popovertargetaction="hide">Close</button>
</div>
```

</id-always-unique>

<popover-on-mouse-hover>

<h2>Use interestfor attribute to show popover on mouse hover</h2>

```html
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

As mentioned before our core-css file requires is to add [data-popover] attribute to the [popover] element.

from that point controlling position of popover in relation to anchor element is done via adding css class to element with [data-popover] attribute.

Here are classes which are available:

- class **top**: Positioned above the anchor, horizontally centered. (this is default style used even when no class is added to 'data-popover' element)
- class **bottom**: Positioned below the anchor, horizontally centered. (this is default style used even when no class is added to 'data-popover' element)
- class **left**: Positioned to the left of the anchor, vertically centered. (this is default style used even when no class is added to 'data-popover' element)
- class **right**: Positioned to the right of the anchor, vertically centered. (this is default style used even when no class is added to 'data-popover' element)

- class **top-left**: Positioned above the anchor, its left edge aligned with the anchor's left edge.
- class **top-right**: Positioned above the anchor, its right edge aligned with the anchor's right edge.
- class **bottom-left**: Positioned below the anchor, its left edge aligned with the anchor's left edge.
- class **bottom-right**: Positioned below the anchor, its right edge aligned with the anchor's right edge.

- class **center**: Positioned directly over the anchor, centered both horizontally and vertically.

- class **topleft**: bottom right corner of the poppover touches top left corner of the anchor
- class **topright**: bottom left corner of the poppover touches top right corner of the anchor
- class **bottomleft**: top right corner of the popover touches bottom left corner of the anchor
- class **bottomright**: top left corner of the popover touches bottom right corner of the anchor

- class **left-top**: Positioned to the left of the anchor, its top edge aligned with the anchor's top edge.
- class **left-bottom**: Positioned to the left of the anchor, its bottom edge aligned with the anchor's bottom edge.
- class **right-top**: Positioned to the right of the anchor, its top edge aligned with the anchor's top edge.
- class **right-bottom**: Positioned to the right of the anchor, its bottom edge aligned with the anchor's bottom edge.

It is preferable to get information about which positioning class to use from the user but if user specifies particular positioning just describing it then try to find best class automatically based on the descriptions.

In case user or AI is confused which class to use then propose user the link to main github page demo page where behaviour of classes is presented in interactive way:

https://stopsopa.github.io/skill-popover-api/demo/index.html

user will be able to observe which class provides best positioning behaviour for the popover in question.

From that demo page user can also go to the main github page for more details with just one click on the ribbon widget.

</position>

<framework-agnostic>

The formation of html using 'data-popover' attribute to activate our core-css styles is universal.

It can be used in vanilla html, react, angular, svelte and others.

It will work as long as basic underlying html will match to what is presented in examples above and [assets/popover.css](assets/popover.css) is loaded in the browser context.

Occasionally it will have to wrapped though with some standard react wrapper components or any other formation/structures specific to given framework.

Just do what is right for given framework context on top of what is presented in examples above.

</framework-agnostic>
