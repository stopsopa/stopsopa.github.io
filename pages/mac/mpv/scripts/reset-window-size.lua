-- ~/.config/mpv/scripts/reset-window-size.lua
--
-- Adds a keyboard shortcut (Ctrl+0) that restores the MPV window to the
-- video's native size (100% scale).
--
-- This is useful after you've manually resized the window and want to return
-- to the original size of the video.
--
-- For audio-only files (MP3, FLAC, WAV, etc.) there is no video to size the
-- window against, so the script simply displays a message instead of attempting
-- to resize.

local mp = require "mp"

local function reset_window_size()
    -- Check whether the currently playing file contains a video stream.
    if mp.get_property_native("video-params") then
        -- Restore the window to 100% of the video's native resolution.
        mp.set_property("window-scale", "1")
        mp.osd_message("Window: 100%")
    else
        -- Audio-only files have no natural video dimensions.
        mp.osd_message("Audio-only file (nothing to resize)")
    end
end

-- Bind the function to Ctrl+0.
mp.add_key_binding("Ctrl+0", "reset-window-size", reset_window_size)