#!/usr/bin/env bash
# Bring up a virtual display + audio stack, then run the worker.
set -e

export DISPLAY=:99

# 1) Virtual display (Meet/Zoom behave better than true-headless).
Xvfb :99 -screen 0 1280x720x24 -ac -nolisten tcp >/tmp/xvfb.log 2>&1 &
sleep 1

# 2) Per-user PulseAudio.
pulseaudio -D --exit-idle-time=-1 --disable-shm=true
sleep 1

# 3) Virtual OUTPUT sink — everything the browser plays lands here, and we
#    record its .monitor. This is the mixed call audio.
pactl load-module module-null-sink sink_name=vsink sink_properties=device.description=vsink
pactl set-default-sink vsink

# 4) Silent virtual MIC, so getUserMedia has an input device but the bot emits
#    no sound into the call.
pactl load-module module-null-sink sink_name=vmic
pactl load-module module-virtual-source source_name=vsource master=vmic.monitor
pactl set-default-source vsource

echo "[start] display + audio ready; launching worker"
exec node src/worker.js
