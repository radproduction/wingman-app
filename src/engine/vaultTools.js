'use strict';

const vaultTools = [
  {
    name: 'save_credential',
    description:
      "Save a third-party login (a site/app username + password) into the user's SECURE VAULT, so Wingman can " +
      'use it later to act on that site for them (a bill portal, a service login, etc.). The password is stored ' +
      'ENCRYPTED and can never be read back — not even by you. Use when the user asks to save/remember a login. ' +
      'After saving, tell them it is stored securely and suggest they DELETE the message that contained the ' +
      'password (chat history is not a safe place for it).',
    input_schema: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'A short name for the login, e.g. "electricity portal", "Netflix".' },
        username: { type: 'string', description: 'The login / email / username (NOT the password).' },
        secret: { type: 'string', description: 'The password / secret to store (it will be encrypted).' },
        url: { type: 'string', description: 'Optional site URL.' },
      },
      required: ['label', 'secret'],
    },
  },
  {
    name: 'list_credentials',
    description:
      'List which logins the user has in their vault — labels and usernames ONLY (passwords are never shown, not ' +
      'even to you). Use for "what logins have you saved?", "which credentials do you have?".',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
];

const vaultToolNames = new Set(vaultTools.map((t) => t.name));

module.exports = { vaultTools, vaultToolNames };
