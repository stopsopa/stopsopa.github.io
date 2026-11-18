https://maps.apple.com/place?coordinate=55.119257,-6.659260&name=62%20Mountsandel%20Road&map=explore

> CAN be converted (offline, pure string conversion). `coordinate` is the exact point.
> `name` is only a label and `map=explore` is Apple view mode - both dropped.
> Result: https://www.google.com/maps/search/?api=1&query=55.119257%2C-6.659260

https://maps.apple.com/directions?destination=29A%20New%20Row,%20Coleraine,%20BT52%201AD,%20Northern%20Ireland&destination-place-id=IF1BEBD1631DCFAF9&mode=driving&source=55.075455,-6.640447

> CAN be converted (offline). `source` -> `origin`, `destination` -> `destination`, `mode` -> `travelmode`.
> `destination-place-id` is Apple internal id, means nothing to Google - dropped.
> Destination here is an address (no coordinates in the link), so Google geocodes the text itself -
> the pin might land slightly differently than in Apple Maps.
> Result: https://www.google.com/maps/dir/?api=1&origin=55.075455%2C-6.640447&destination=29A+New+Row%2C+Coleraine%2C+BT52+1AD%2C+Northern+Ireland&travelmode=driving

https://maps.apple.com/directions?destination=29A%20New%20Row,%20Coleraine,%20BT52%201AD,%20Northern%20Ireland&destination-place-id=IF1BEBD1631DCFAF9&mode=driving&source=55.075455,-6.640447

> Identical to the link above - same result.

https://maps.apple/p/=yMRN7_K4hFfhg

> CAN'T be converted offline. This is a short link - the part after /p/ is an opaque id,
> coordinates are not encoded in it. Only Apple's server knows where it points.
> Only way: make http request, follow the redirect to the long maps.apple.com/... link
> and convert that one (see convertShort() in convert.ts - not verified against the real links).

https://maps.apple/p/W~5mr5ufkx8uuu

> Short link - same as above, needs network request.

https://maps.apple/p/KRN7dWDNuj6K76

> Short link - same as above, needs network request.

https://maps.apple/p/5GefIkKJtqbr3_

> Short link - same as above, needs network request.

https://maps.apple/p/HRLu8Gtf1CPqIy

> Short link - same as above, needs network request.
