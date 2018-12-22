import { set, setProperties, notifyPropertyChange } from '@ember/object';
import Evented from '@ember/object/evented';
import { run } from '@ember/runloop';

import extractData from './extract-data';
import { setMeta } from './meta';

export default function createObserver(resultKey, resolver, meta) {
  let result;

  if (meta.isSubscription) {
    result = new ApolloSubscription();
    setMeta(result, meta);
    resolver.resolve(result);
  }

  return {
    next: newData => {
      let data = extractData(newData, resultKey);

      if (!result) {
        result = data || {};
        setMeta(result, meta);
        resolver.resolve(result);
      } else if (data) {
        updateResult(result, data);
      }
    },
    error(e) {
      resolver.reject(e);
    },
  };
}

function updateResult(result, data) {
  if (result instanceof ApolloSubscription) {
    updateSubscriptionResult(result, data);
  } else {
    updateWatchQueryResult(result, data);
  }
}

const ApolloSubscription = function() {};
ApolloSubscription.prototype = Evented.mixins[0].properties;

function updateSubscriptionResult(result, data) {
  run(() => {
    set(result, 'lastEvent', data);
    result.trigger('event', data);
  });
}

function updateWatchQueryResult(result, data) {
  run(() => {
    if (Array.isArray(result)) {
      result.splice(0, result.length, ...data);
      notifyPropertyChange(result, 'length');
    } else {
      setProperties(result, data);
    }
  });
}
