It seems it is not possible to save just one layer using Inkscape. https://inkscape.org/forums/beyond/export-layers-as-svg-files/
there are only some weird plugins (I've not use them because I don't trust them)

Inkscape is always saving all lines from all layers but those which are not visible will have attribute
style="display:none"
So the only solution seems to be just to remove all style="display:none" manually from final files

---

UPDATE:

    There seems to be format "Optimised SVG" in File -> Save As...
