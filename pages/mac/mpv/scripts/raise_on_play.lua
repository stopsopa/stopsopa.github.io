-- ~/.config/mpv/scripts/raise_on_play.lua
local mp = require 'mp'
local utils = require 'mp.utils'

local function raise_window()
    local script = [[
        tell application "System Events"
            set frontmost of process "mpv" to true
        end tell
    ]]
    utils.subprocess({
        args = { "osascript", "-e", script },
    })
end

mp.observe_property("pause", "bool", function(name, paused)
    if paused == false then
        raise_window()
    end
end)

