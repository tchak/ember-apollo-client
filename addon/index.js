export {
  default as queryManager,
} from '@tchak/ember-apollo-client/apollo/query-manager';

import { getMeta } from '@tchak/ember-apollo-client/-private/meta';

export function getObservable(result) {
  const meta = getMeta(result);
  return meta && meta.observable;
}

function callObservable(result, method, opts) {
  const meta = getMeta(result);
  if (meta && meta.observable) {
    const { observable, service } = meta;

    return service.waitFor((resolve, reject) => {
      observable[method](opts)
        .then(resolve)
        .catch(reject);
    });
  }
}

export function unsubscribe(result) {
  const meta = getMeta(result);
  if (meta && meta.unsubscribe) {
    meta.unsubscribe();
  }
}

export function refetch(result, opts) {
  return callObservable(result, 'refetch', opts);
}

export function fetchMore(result, opts) {
  return callObservable(result, 'fetchMore', opts);
}
