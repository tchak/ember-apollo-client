import EmberObject from '@ember/object';
import { queryManager } from 'ember-apollo-client';
import { ApolloClient } from 'apollo-client';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | queryManager | ember object query manager', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.subject = function() {
      let TestObject = EmberObject.extend({ apollo: queryManager() });
      this.owner.register('test-container:test-object', TestObject);
      return this.owner.lookup('test-container:test-object');
    };
  });

  test('it unsubscribes from any watchQuery subscriptions', function(assert) {
    let done = assert.async();
    let subject = this.subject();
    let unsubscribeCalled = 0;

    let apolloService = subject.apollo.service;
    apolloService.watchQuery = (opts, _, manager) => {
      assert.deepEqual(opts, { query: 'fakeQuery' });
      manager.trackSubscription({
        unsubscribe() {
          unsubscribeCalled++;
        },
      });
      return {};
    };

    subject.apollo.watchQuery({ query: 'fakeQuery' });
    subject.apollo.watchQuery({ query: 'fakeQuery' });

    subject.willDestroy();
    assert.equal(
      unsubscribeCalled,
      2,
      '_apolloUnsubscribe() was called once per watchQuery'
    );
    done();
  });

  test('it unsubscribes from any subscribe subscriptions', function(assert) {
    let done = assert.async();
    let subject = this.subject();
    let unsubscribeCalled = 0;

    let apolloService = subject.apollo.service;
    apolloService.subscribe = (opts, _, manager) => {
      assert.deepEqual(opts, { query: 'fakeSubscription' });
      manager.trackSubscription({
        unsubscribe() {
          unsubscribeCalled++;
        },
      });
      return {};
    };

    subject.apollo.subscribe({ query: 'fakeSubscription' });
    subject.apollo.subscribe({ query: 'fakeSubscription' });

    subject.willDestroy();
    assert.equal(
      unsubscribeCalled,
      2,
      '_apolloUnsubscribe() was called once per subscribe'
    );
    done();
  });

  test('it exposes an apollo client object', function(assert) {
    let subject = this.subject();
    let client = subject.apollo.client;
    assert.ok(client instanceof ApolloClient);
  });
});
