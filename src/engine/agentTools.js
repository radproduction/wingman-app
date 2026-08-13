'use strict';

/**
 * Tools that let Wingman (the chief of staff) bring in its specialist STAFF.
 * See agents.js for the roster and agentExecutor.js for how a specialist runs.
 */
const { list } = require('./agents');

const AGENT_KEYS = list().map((a) => a.key);

const agentTools = [
  {
    name: 'consult_agent',
    description:
      "Bring in a SPECIALIST from the user's staff to weigh in with expert, data-driven input. " +
      'You are the chief of staff; these are the staff. Use this whenever the user asks for a specialist ' +
      '("bring in the marketing agent", "what does sales think?", "get finance\'s take", "I need the ops agent"), ' +
      'OR when a question clearly belongs to one domain and an expert analysis beats a general answer. ' +
      'The specialist reads the relevant data and returns its analysis plus recommended actions; you then present ' +
      'it to the user as that specialist speaking (e.g. "Here\'s your Marketing Wingman 📈 …") and carry out ' +
      'whatever they approve. You may consult more than one for a rounded view.\n' +
      'Agents: marketing (growth/campaigns/conversion), sales (revenue/upsell/retention), finance (cash flow/costs/' +
      'margins), operations (tasks/calendar/inbox execution), travel (trips/routes/logistics).',
    input_schema: {
      type: 'object',
      properties: {
        agent: { type: 'string', enum: AGENT_KEYS, description: 'Which specialist to bring in.' },
        question: {
          type: 'string',
          description:
            "What you want their input on, in plain words. Optional — omit for a general \"what should I know?\" read from that specialist.",
        },
      },
      required: ['agent'],
    },
  },
  {
    name: 'list_agents',
    description:
      "List the specialists (staff) available to bring in. Use for \"who's on my team?\", \"what agents do you have?\".",
    input_schema: { type: 'object', properties: {}, required: [] },
  },
];

const agentToolNames = new Set(agentTools.map((t) => t.name));

module.exports = { agentTools, agentToolNames };
