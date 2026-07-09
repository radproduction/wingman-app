'use strict';

/**
 * Anthropic tool definitions for Google Drive (read-only). Claude calls these to
 * browse folders, search files, and read document contents on the user's behalf.
 */
const driveTools = [
  {
    name: 'search_drive',
    description:
      "Search the user's Google Drive for files and folders by name or content. " +
      'Use for "find my <X> file", "what\'s in my Drive", "show files about <topic>". ' +
      'Leave query empty to list the most recently modified items.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text to match in the file/folder name or contents. Omit for recent files.' },
        folder_name: { type: 'string', description: 'Optional: only look inside a folder whose name matches this.' },
        limit: { type: 'number', description: 'How many results (default 10, max 25).' },
      },
      required: [],
    },
  },
  {
    name: 'read_drive_file',
    description:
      'Read the text content of a Drive file (Google Doc/Sheet/Slides or a text ' +
      'file) so you can summarize or answer questions about it. Get the file id ' +
      'from search_drive first.',
    input_schema: {
      type: 'object',
      properties: {
        file_id: { type: 'string', description: 'The Drive file id (from search_drive).' },
      },
      required: ['file_id'],
    },
  },
];

const driveToolNames = new Set(driveTools.map((t) => t.name));

module.exports = { driveTools, driveToolNames };
