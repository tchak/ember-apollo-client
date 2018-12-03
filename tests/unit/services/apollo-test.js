import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { computed } from '@ember/object';
import ApolloService from 'ember-apollo-client/services/apollo';
import testQuery from '../build/test-query';
import testMutation from '../build/test-mutation';
import testSubscription from '../build/test-subscription';
import { Promise } from 'rsvp';

module('Unit | Service | apollo', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let options = {
      apiURL: 'https://test.example/graphql',
    };
    let service = this.owner.factoryFor('service:apollo').create({ options });
    assert.ok(service);
  });

  test('it uses clientOptions', function(assert) {
    let customDataIdFromObject = o => o.name;
    this.owner.register(
      'service:overridden-apollo',
      ApolloService.extend({
        // Override the clientOptions.
        clientOptions: computed(function() {
          let opts = this._super(...arguments);
          opts.dataIdFromObject = customDataIdFromObject;
          return opts;
        }),
      })
    );
    let service = this.owner.lookup('service:overridden-apollo');

    // make sure the override was used.
    assert.equal(
      service.get('apollo.dataIdFromObject', customDataIdFromObject)
    );
  });

  test('.mutate resolves with __typename', async function(assert) {
    let done = assert.async();
    let service = this.owner.lookup('service:apollo');

    service.set('client', {
      mutate() {
        assert.ok(true, 'Called mutate function on apollo client');

        return new Promise(resolve => {
          resolve({ data: { human: { name: 'Link' }, __typename: 'person' } });
        });
      },
    });

    const result = await service.mutate({ mutation: testMutation });

    assert.equal(result.__typename, 'person');
    done();
  });

  test('.query resolves with __typename', async function(assert) {
    let done = assert.async();
    let service = this.owner.lookup('service:apollo');

    service.set('client', {
      query() {
        assert.ok(true, 'Called query function on apollo client');

        return new Promise(resolve => {
          resolve({ data: { human: { name: 'Link' }, __typename: 'person' } });
        });
      },
    });

    const result = await service.query({ query: testQuery });

    assert.equal(result.__typename, 'person');
    done();
  });

  test('.watchQuery with key', async function(assert) {
    let service = this.owner.lookup('service:apollo');

    service.set('client', {
      watchQuery() {
        assert.ok(true, 'Called watchQuery function on apollo client');

        return {
          subscribe({ next }) {
            next({ data: { human: { name: 'Link' }, __typename: 'person' } });
          },
        };
      },
    });

    const result = await service.watchQuery({ query: testQuery }, 'human');
    assert.equal(result.get('name'), 'Link');
  });

  test('.watchQuery with key gracefully handles null', async function(assert) {
    let service = this.owner.lookup('service:apollo');

    service.set('client', {
      watchQuery() {
        return {
          subscribe({ next }) {
            next({ data: null });
          },
        };
      },
    });

    const result = await service.watchQuery({ query: testQuery }, 'human');
    assert.equal(result.get('name'), undefined);
  });

  test('.subscribe with key', async function(assert) {
    let service = this.owner.lookup('service:apollo');
    let nextFunction = null;

    service.set('client', {
      subscribe() {
        assert.ok(true, 'Called subscribe function on apollo client');

        return {
          subscribe({ next }) {
            nextFunction = next;
          },
        };
      },
    });

    const result = await service.subscribe(
      {
        subscription: testSubscription,
      },
      'human'
    );

    const names = [];
    result.on('event', e => names.push(e.name));

    // Things initialize as empty
    assert.equal(result.get('lastEvent'), null);
    assert.equal(result.get('events.length'), 0);

    // Two updates come in
    nextFunction({ data: { human: { name: '1 Link' }, __typename: 'person' } });
    nextFunction({ data: { human: { name: '2 Luke' }, __typename: 'person' } });

    // Events are in the correct order
    assert.equal(result.get('lastEvent.name'), '2 Luke');
    assert.equal(
      result
        .get('events')
        .mapBy('name')
        .join(' '),
      '2 Luke 1 Link'
    );
    // Event streams are in the correct order
    assert.equal(names.join(' '), '1 Link 2 Luke');

    nextFunction({ data: { human: { name: '3 Greg' }, __typename: 'person' } });
    // Stream null
    nextFunction({ loading: true });
    nextFunction({ loading: true, data: null });
    // Still have last event
    assert.equal(result.get('lastEvent.name'), '3 Greg');
  });
});
