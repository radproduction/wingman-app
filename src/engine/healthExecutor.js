'use strict';

const healthRepo = require('../db/healthData');
const health = require('../services/health');
const config = require('../config');

/** Execute a health tool. Never throws — errors become {error}. */
async function executeHealthTool(user, toolUse) {
  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'get_health_connect_link': {
        // Lead with the one-tap options. Sending someone to hand-build an iOS
        // Shortcut when their watch could be connected in a single tap is what
        // made this feel impossible in the first place.
        const oneClick = health.availableOneClick();
        const status = health.connectionStatus(user);

        return {
          already_connected: status.sources,
          one_click_options: oneClick,
          settings_path: 'Settings → Health data, in the Wingman app',
          how: oneClick.length
            ? `Easiest by far: open Settings → Health data in the app and tap Connect next to ${oneClick.join(' or ')}. It takes one tap and keeps itself up to date — no setup on the phone.`
            : 'Open Settings → Health data in the app to connect a device.',
          apple_health_only: {
            when: 'ONLY suggest this if they have an iPhone with no fitness tracker at all — Apple keeps Health data on the device with no service we can read it from.',
            ingest_url: `${config.publicBaseUrl}/health/ingest/${health.tokenFor(user.id)}`,
            note: 'Do not paste these steps unless they ask for the Apple Health route — point them at Settings first.',
          },
        };
      }

      case 'get_health': {
        // Connected means a source is SET UP, not that readings have arrived —
        // a watch connected two minutes ago has nothing to show yet and must
        // not be reported as "not connected".
        const status = health.connectionStatus(user);
        if (!status.connected) return { error: 'HEALTH_NOT_CONNECTED' };
        if (!status.hasData) {
          return {
            connected_sources: status.sources,
            readings: 0,
            detail: `Connected to ${status.sources.join(', ')}, but no readings have come through yet — they usually appear after the device next syncs.`,
          };
        }
        const days = Math.min(Math.max(parseInt(input.days, 10) || 7, 1), 30);

        if (input.metric) {
          const latest = healthRepo.latest(user.id, input.metric);
          if (!latest) return { metric: input.metric, readings: 0, detail: 'No readings for that yet.' };
          const history = healthRepo.since(user.id, input.metric, days);
          const base = healthRepo.baseline(user.id, input.metric);
          return {
            metric: latest.metric_type,
            latest: { value: latest.value, unit: latest.unit, recorded_at: latest.recorded_at },
            usual: base ? Math.round(base.mean * 10) / 10 : null,
            readings_in_period: history.length,
            trend: history.slice(-days).map((r) => ({ at: r.recorded_at, value: r.value })),
          };
        }

        const all = healthRepo.latestAll(user.id);
        return {
          latest: all.map((r) => ({
            metric: r.metric_type, value: r.value, unit: r.unit,
            recorded_at: r.recorded_at, source: r.source,
          })),
          // So the assistant can mention anything unusual without being asked.
          notable: health.findAnomalies(user.id),
        };
      }

      case 'log_health': {
        const r = healthRepo.record(user.id, {
          metric: input.metric,
          value: input.value,
          unit: input.unit,
          source: 'told_to_wingman',
        });
        if (!r.saved) {
          return r.reason === 'duplicate'
            ? { logged: false, detail: 'That reading is already recorded.' }
            : { error: 'INVALID_READING', detail: `Could not record ${input.metric}.` };
        }
        return { logged: true, metric: r.metric, value: r.value, unit: r.unit };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: (err && err.message) || 'health_operation_failed' };
  }
}

module.exports = { executeHealthTool };
