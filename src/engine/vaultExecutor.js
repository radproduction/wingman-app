'use strict';

const vault = require('../db/credentials');

async function executeVaultTool(user, toolUse) {
  const { name, input } = toolUse;
  try {
    if (name === 'save_credential') {
      if (!input.label || !input.secret) return { error: 'LABEL_AND_SECRET_REQUIRED' };
      const r = vault.save(user.id, {
        label: String(input.label).trim(),
        username: input.username ? String(input.username).trim() : null,
        secret: String(input.secret),
        url: input.url ? String(input.url).trim() : null,
      });
      return {
        saved: true,
        updated: !!r.updated,
        label: String(input.label).trim(),
        note: 'Stored encrypted — I can use it but can never read it back. Please delete the message that had the password.',
      };
    }
    if (name === 'list_credentials') {
      const rows = vault.listSafe(user.id);
      return {
        count: rows.length,
        credentials: rows.map((c) => ({ label: c.label, username: c.username || null, url: c.url || null })),
      };
    }
    return { error: `Unknown tool: ${name}` };
  } catch (err) {
    const msg = (err && err.message) || 'vault_operation_failed';
    if (msg === 'SECRET_KEY_NOT_SET') return { error: 'VAULT_UNAVAILABLE', detail: 'Secure storage is not configured on the server.' };
    return { error: msg };
  }
}

module.exports = { executeVaultTool };
