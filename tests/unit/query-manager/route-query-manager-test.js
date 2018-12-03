import Route from '@ember/routing/route';
import { queryManager } from 'ember-apollo-client';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | queryManager | route query manager', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.subject = function() {
      let TestObject = Route.extend({ apollo: queryManager() });
      this.owner.register('test-container:test-object', TestObject);
      return this.owner.lookup('test-container:test-object');
    };
  });

  test('it unsubscribes from any watchQuery subscriptions with isExiting=true', function(assert) {
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

    subject.beforeModel();
    subject.resetController({}, true);
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

    subject.beforeModel();
    subject.resetController({}, true);
    assert.equal(
      unsubscribeCalled,
      2,
      'unsubscribe() was called once per subscribe'
    );
    done();
  });

  test('it only unsubscribes from stale watchQuery subscriptions with isExiting=false', function(assert) {
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

    // simulate data being re-fetched, as when query params change
    subject.beforeModel();
    subject.apollo.watchQuery({ query: 'fakeQuery' });

    subject.resetController({}, false);
    assert.equal(
      unsubscribeCalled,
      1,
      'unsubscribe() was called only once, for the first query'
    );
    done();
  });

  test('it unsubscribes from any watchQuery subscriptions on willDestroy', function(assert) {
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

    subject.beforeModel();
    subject.willDestroy();
    assert.equal(
      unsubscribeCalled,
      2,
      'unsubscribe() was called once per watchQuery'
    );
    done();
  });
});
