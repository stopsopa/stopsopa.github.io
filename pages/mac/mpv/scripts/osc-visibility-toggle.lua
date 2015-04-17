-- ~/.config/mpv/scripts/osc-visibility-toggle.lua

local mp = require 'mp'

local visible = true

local function toggle_osc_visibility()
    if visible then
        mp.commandv("script-message", "osc-visibility", "auto")
        mp.osd_message("OSC: auto-hide", 2)
    else
        mp.commandv("script-message", "osc-visibility", "always")
        mp.osd_message("OSC: always visible", 2)
    end
    visible = not visible
end

-- Bind to Ctrl+O (or change to your preferred key)
mp.add_key_binding("ctrl+o", "toggle-osc-visibility", toggle_osc_visibility)
