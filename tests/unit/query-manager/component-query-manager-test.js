import Component from '@ember/component';
import { queryManager } from 'ember-apollo-client';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | queryManager | component query manager', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.subject = function() {
      let TestObject = Component.extend({
        apollo: queryManager(),
      });
      this.owner.register('component:test-object', TestObject);
      return this.owner.lookup('component:test-object');
    };
  });

  test('it unsubscribes from any watchQuery subscriptions', function(assert) {
    let done = assert.async();
    let subject = this.subject();
    let unsubscribeCalled = 0;

    let apolloService = subject.apollo.service;
    apolloService.watchQuery = (opts, _, manager) => {
      assert.deepEqual(opts, { query: 'fakeQuery' });
      manager.trackSubscription(() => unsubscribeCalled++);
      return {};
    };

    subject.apollo.watchQuery({ query: 'fakeQuery' });
    subject.apollo.watchQuery({ query: 'fakeQuery' });

    subject.willDestroyElement();
    assert.equal(
      unsubscribeCalled,
      2,
      'unsubscribe() was called once per watchQuery'
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
      manager.trackSubscription(() => unsubscribeCalled++);
      return {};
    };

    subject.apollo.subscribe({ query: 'fakeSubscription' });
    subject.apollo.subscribe({ query: 'fakeSubscription' });

    subject.willDestroyElement();
    assert.equal(
      unsubscribeCalled,
      2,
      'unsubscribe() was called once per subscribe'
    );
    done();
  });
});
