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
  {
    name: 'create_drive_file',
    description:
      'Create a new Google Doc in the user\'s Drive with the given text content. ' +
      'Use for "create a doc about X", "make a note in Drive", "save this as a document". ' +
      'Write the full content yourself. Optionally place it inside a named folder.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Title of the document.' },
        content: { type: 'string', description: 'The full text content to put in the document.' },
        folder_name: { type: 'string', description: 'Optional: name of a folder to create it in.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_drive_folder',
    description: 'Create a new folder in the user\'s Drive. Optionally inside a named parent folder.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Folder name.' },
        folder_name: { type: 'string', description: 'Optional: name of a parent folder to create it inside.' },
      },
      required: ['name'],
    },
  },
];

const driveToolNames = new Set(driveTools.map((t) => t.name));

module.exports = { driveTools, driveToolNames };
