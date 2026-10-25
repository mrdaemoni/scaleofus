// Local maintenance/export only. There is no personal approval step.
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {ReflectionStore} from './store.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const store = new ReflectionStore(process.env.REFLECTIONS_STATE_DIR || path.join(root, '.local-reflections'));
const [action, id] = process.argv.slice(2);
try {
  let result;
  if (action === 'list') result = (await store.list()).map(({id, status, language, quoteConsent, createdAt}) => ({id, status, language, quoteConsent, createdAt}));
  else if (action === 'show') result = (await store.list()).find(record => record.id === id) || {error:'Not found'};
  else if (['revoke', 'delete'].includes(action)) result = await store.remove(id, action);
  else if (action === 'prune') result = await store.prune();
  else if (action === 'export') result = await store.exportPublic(path.join(root, 'src/content/public-reflections.json'));
  else throw new Error('Use list | show ID | revoke ID | delete ID | prune | export');
  console.log(JSON.stringify(result, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
