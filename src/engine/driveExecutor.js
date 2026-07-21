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

      case 'create_drive_file': {
        const file = await drive.createDoc(user, {
          name: input.name,
          content: input.content || '',
          folderName: input.folder_name,
        });
        return { created: true, ...file };
      }

      case 'create_drive_sheet': {
        const sheet = await drive.createSheet(user, {
          name: input.name,
          rows: Array.isArray(input.rows) ? input.rows : null,
          folderName: input.folder_name,
        });
        return { created: true, kind: 'sheet', ...sheet };
      }

      case 'create_drive_folder': {
        const folder = await drive.createFolder(user, {
          name: input.name,
          folderName: input.folder_name,
        });
        return { created: true, kind: 'folder', ...folder };
      }

      case 'share_drive_file': {
        const shared = await drive.share(user, {
          fileId: input.file_id,
          email: input.email || null,
          role: input.can_edit ? 'writer' : 'reader',
        });
        return { shared: true, ...shared };
      }

      case 'rename_drive_file': {
        const renamed = await drive.rename(user, { fileId: input.file_id, name: input.name });
        return { renamed: true, ...renamed };
      }

      case 'move_drive_file': {
        const moved = await drive.move(user, { fileId: input.file_id, folderName: input.folder_name });
        if (!moved.moved) return { error: 'FOLDER_NOT_FOUND', detail: `No folder named "${input.folder_name}".` };
        return moved;
      }

      case 'delete_drive_file': {
        const del = await drive.trashFile(user, input.file_id);
        return { deleted: true, ...del, note: 'Moved to Trash — recoverable for 30 days.' };
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
