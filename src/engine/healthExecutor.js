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
        const token = health.tokenFor(user.id);
        return {
          ingest_url: `${config.publicBaseUrl}/health/ingest/${token}`,
          how: 'On iPhone: Shortcuts app → new Automation → daily → "Get Health Sample" for the metrics you want → "Get Contents of URL" (POST, JSON) to this link. Apple Health data lives only on the phone, so this is what sends it across.',
          also: 'Any wearable app or automation that can POST JSON works too.',
        };
      }

      case 'get_health': {
        if (!healthRepo.hasAnyData(user.id)) return { error: 'HEALTH_NOT_CONNECTED' };
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
