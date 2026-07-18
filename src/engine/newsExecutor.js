'use strict';

const news = require('../services/news');

/**
 * Execute the news tool. Never throws — errors become {error} so the assistant
 * can explain rather than the turn failing.
 */
async function executeNewsTool(user, toolUse) {
  const { name, input } = toolUse;
  if (name !== 'get_news') return { error: `Unknown tool: ${name}` };

  const limit = Math.min(Math.max(parseInt(input.limit, 10) || 3, 1), 6);
  try {
    const topics = input.topic ? [input.topic] : news.topicsFor(user);
    const bul = await news.bulletin(user, { perTopic: limit, topics });
    if (!bul.sections.length) {
      return { error: 'NO_NEWS', detail: 'No headlines came back for those topics right now.' };
    }
    return {
      city: bul.city || null,
      sections: bul.sections.map((s) => ({
        topic: s.topic,
        label: s.label,
        headlines: s.items.map((i) => ({ title: i.title, source: i.source, published: i.publishedAt })),
      })),
    };
  } catch (err) {
    return { error: (err && err.message) || 'news_fetch_failed' };
  }
}

module.exports = { executeNewsTool };
