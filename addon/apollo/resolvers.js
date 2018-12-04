import Ember from 'ember';
import { get, set } from '@ember/object';
import { isPresent } from '@ember/utils';
import { setProperties } from '@ember/object';
import Evented from '@ember/object/evented';
import { run } from '@ember/runloop';

import copyWithExtras from '../utils/copy-with-extras';
import { setMeta } from './meta';

export function resolveWith(resolve, resultKey) {
  return result => {
    return resolve(extractData(resultKey, result));
  };
}

export function rejectWith(reject) {
  return error => {
    let errors;
    if (isPresent(error.networkError)) {
      error.networkError.code = 'network_error';
      errors = [error.networkError];
    } else if (isPresent(error.graphQLErrors)) {
      errors = error.graphQLErrors;
    }
    if (errors) {
      return reject({ errors });
    }
    throw error;
  };
}

export function createObserver(resultKey, resolver, meta) {
  let result;

  if (meta.isSubscription) {
    result = new ApolloSubscription();
    setMeta(result, meta);
    resolver.resolve(result);
  }

  return {
    next: newData => {
      let data = extractData(resultKey, newData);

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

function extractData(resultKey, { data, loading }) {
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
      Ember.notifyPropertyChange(result, 'length');
    } else {
      setProperties(result, data);
    }
  });
}
