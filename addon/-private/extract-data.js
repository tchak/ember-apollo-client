import { get } from '@ember/object';

import copyWithExtras from './copy-with-extras';

export default function extractData({ data, loading }, resultKey = null) {
  if (loading && !data) {
    // This happens when the cache has no data and the data is still loading
    // from the server. We don't want to resolve the promise with empty data
    // so we instead just bail out.
    //
    // See https://github.com/bgentry/ember-apollo-client/issues/45
    return null;
  }
  const keyedData = !resultKey ? data : data && get(data, resultKey);

  return copyWithExtras(keyedData || {});
}
