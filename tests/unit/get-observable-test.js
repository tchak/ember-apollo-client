import EmberObject from '@ember/object';
import { getObservable } from 'ember-apollo-client';
import { decorateResult } from 'ember-apollo-client/apollo/resolvers';
import { module, test } from 'qunit';

module('Unit | getObservable', function() {
  test('it should return the observable from a result object', function(assert) {
    let mockObservable = { fakeObservable: true };
    let resultObject = EmberObject.create();
    decorateResult(resultObject, { observable: mockObservable });

    let result = getObservable(resultObject);
    assert.deepEqual(result, mockObservable);
  });
});
