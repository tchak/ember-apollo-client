export {
  default as queryManager,
} from '@tchak/ember-apollo-client/apollo/query-manager';

import { getMeta } from '@tchak/ember-apollo-client/-private/meta';

export function getObservable(result) {
  const meta = getMeta(result);
  return meta && meta.observable;
}

export function unsubscribe(result) {
  const meta = getMeta(result);
  if (meta && meta.unsubscribe) {
    meta.unsubscribe();
  }
}
