import Ember from 'ember';

import Service from '@ember/service';
import { getOwner } from '@ember/application';

import fetch from 'fetch';

import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

import waitFor from '../utils/wait-for';
import { resolveWith, rejectWith, createObserver } from '../apollo/resolvers';

// used in environments without injected `config:environment` (i.e. unit tests):
const defaultOptions = {
  apiURL: 'http://testserver.example/v1/graph',
};

export default Service.extend({
  client: null,

  // options are configured in your environment.js.
  options() {
    // config:environment not injected into tests, so try to handle that gracefully.
    let config = getOwner(this).resolveRegistration('config:environment');
    if (config && config.apollo) {
      return config.apollo;
    } else if (Ember.testing) {
      return defaultOptions;
    }
    throw new Error('no Apollo service options defined');
  },

  init() {
    this._super(...arguments);

    const options = this.configure();
    this.client = new ApolloClient(options);
    this._waitFor = waitFor();
  },

  /**
   * This is the options hash that will be passed to the ApolloClient constructor.
   * You can override it if you wish to customize the ApolloClient.
   *
   * @method clientOptions
   * @return {!Object}
   * @public
   */
  configure() {
    return {
      link: this.link(),
      cache: this.cache(),
    };
  },

  cache() {
    return new InMemoryCache();
  },

  link() {
    const { apiURL: uri, requestCredentials: credentials } = this.options();
    const options = { uri, fetch };

    if (credentials) {
      options.credentials = credentials;
    }
    return createHttpLink(options);
  },

  /**
   * Executes a mutation on the Apollo client. The resolved object will
   * never be updated and does not have to be unsubscribed.
   *
   * @method mutate
   * @param {!Object} opts The query options used in the Apollo Client mutate.
   * @param {String} resultKey The key that will be returned from the resulting response data. If null or undefined, the entire response data will be returned.
   * @return {!Promise}
   * @public
   */
  mutate(opts, resultKey) {
    return this._waitFor((resolve, reject) => {
      this.client
        .mutate(opts)
        .then(resolveWith(resolve, resultKey))
        .catch(rejectWith(reject));
    });
  },

  /**
   * Executes a single `query` on the Apollo client. The resolved object will
   * never be updated and does not have to be unsubscribed.
   *
   * @method query
   * @param {!Object} opts The query options used in the Apollo Client query.
   * @param {String} resultKey The key that will be returned from the resulting response data. If null or undefined, the entire response data will be returned.
   * @return {!Promise}
   * @public
   */
  query(opts, resultKey = null) {
    return this._waitFor((resolve, reject) => {
      this.client
        .query(opts)
        .then(resolveWith(resolve, resultKey))
        .catch(rejectWith(reject));
    });
  },

  /**
   * Executes a `watchQuery` on the Apollo client. If updated data for this
   * query is loaded into the store by another query, the resolved object will
   * be updated with the new data.
   *
   * When using this method, it is important to either call `unsubscribe(result)` on
   * the resolved data when the route or component is torn down. That tells
   * Apollo to stop trying to send updated data to a non-existent listener.
   *
   * @method watchQuery
   * @param {!Object} opts The query options used in the Apollo Client watchQuery.
   * @param {String} resultKey The key that will be returned from the resulting response data. If null or undefined, the entire response data will be returned.
   * @param {QueryManager} manager A QueryManager that should track this active watchQuery.
   * @return {!Promise}
   * @public
   */
  watchQuery(opts, resultKey = null, manager = null) {
    let observable = this.client.watchQuery(opts);

    return this._waitFor((resolve, reject) => {
      const unsubscribe = () => subscription.unsubscribe();
      const observer = createObserver(
        resultKey,
        { resolve, reject },
        {
          observable,
          unsubscribe,
        }
      );
      const subscription = observable.subscribe(observer);

      if (manager) {
        manager.trackSubscription(unsubscribe);
      }
    });
  },

  /**
   * Executes a `subscribe` on the Apollo client. If this subscription receives
   * data, the resolved object will be updated with the new data.
   *
   * When using this method, it is important to call `unsubscribe(result)` on
   * the resolved data when the route or component is torn down. That tells
   * Apollo to stop trying to send updated data to a non-existent listener.
   *
   * @method subscribe
   * @param {!Object} opts The query options used in the Apollo Client subscribe.
   * @param {String} resultKey The key that will be returned from the resulting response data. If null or undefined, the entire response data will be returned.
   * @param {QueryManager} manager A QueryManager that should track this active watchQuery.
   * @return {!Promise}
   * @public
   */
  subscribe(opts, resultKey = null, manager = null) {
    const observable = this.client.subscribe(opts);

    return this._waitFor((resolve, reject) => {
      const unsubscribe = () => subscription.unsubscribe();
      const observer = createObserver(
        resultKey,
        { resolve, reject },
        {
          isSubscription: true,
          observable,
          unsubscribe,
        }
      );
      const subscription = observable.subscribe(observer);

      if (manager) {
        manager.trackSubscription(unsubscribe);
      }
    });
  },
});
