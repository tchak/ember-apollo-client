import Ember from 'ember';
import { get, set } from '@ember/object';
import { isPresent } from '@ember/utils';
import { assign } from '@ember/polyfills';
import { setProperties } from '@ember/object';
import Evented from '@ember/object/evented';
import { run } from '@ember/runloop';

import copyWithExtras from '../utils/copy-with-extras';

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

export function getObservable(result) {
  const subscription = SUBSCRIPTIONS.get(result);
  return subscription && subscription.observable;
}

export function unsubscribe(result) {
  const subscription = SUBSCRIPTIONS.get(result);
  if (subscription && subscription.unsubscribe) {
    subscription.unsubscribe();
  }
}

export function decorateResult(result, subscription) {
  SUBSCRIPTIONS.set(result, subscription);
}

const SUBSCRIPTIONS = new WeakMap();

export function subscriptionObserver(resultKey, resolve, reject, subscription) {
  let result = createSubscriptionResult();
  decorateResult(result, subscription);
  resolve(result);

  return {
    next: newData => {
      let data = extractData(resultKey, newData);

      if (data) {
        updateSubscriptionResult(result, data);
      }
    },
    error(e) {
      reject(e);
    },
  };
}

export function watchQueryObserver(resultKey, resolve, reject, subscription) {
  let result;

  return {
    next: newData => {
      let data = extractData(resultKey, newData);

      if (!result) {
        result = createWatchQueryResult(data);
        decorateResult(result, subscription);
        resolve(result);
      } else {
        updateWatchQueryResult(result, data);
      }
    },
    error(e) {
      reject(e);
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

const ApolloSubscription = function() {};
ApolloSubscription.prototype = Evented.mixins[0].properties;

function createSubscriptionResult() {
  return new ApolloSubscription();
}

function updateSubscriptionResult(result, data) {
  run(() => {
    set(result, 'lastEvent', data);
    result.trigger('event', data);
  });
}

function createWatchQueryResult(data) {
  if (Array.isArray(data)) {
    return data.concat([]);
  } else {
    return assign({}, data);
  }
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
