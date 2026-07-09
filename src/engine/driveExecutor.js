'use strict';

const drive = require('../services/drive');
const googleAuth = require('../auth/googleAuth');

/**
 * Execute a single Drive tool_use block. Never throws — errors become {error}.
 * Because Drive shares the combined Google token, a user who connected before
 * the Drive scope was added will hit an insufficient-scope error; we map that
 * to a clear "reconnect Google" hint.
 */
async function executeDriveTool(user, toolUse) {
  if (!googleAuth.isConnected(user)) {
    return { error: 'DRIVE_NOT_CONNECTED' };
  }

  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'search_drive': {
        const files = await drive.search(user, {
          query: input.query,
          folderName: input.folder_name,
          limit: input.limit,
        });
        return { count: files.length, files };
      }

      case 'read_drive_file': {
        const file = await drive.readFile(user, input.file_id);
        return file;
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    const msg = err && err.message ? err.message : 'drive_operation_failed';
    if (/insufficient|scope|permission|forbidden|403/i.test(msg)) {
      return { error: 'DRIVE_SCOPE_MISSING', detail: 'Drive access was not granted. The user should reconnect Google and allow Drive access.' };
    }
    return { error: msg };
  }
}

module.exports = { executeDriveTool };
