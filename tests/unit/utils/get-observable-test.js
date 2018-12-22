import { module, test } from 'qunit';

import { setMeta } from '@tchak/ember-apollo-client/-private/meta';
import { getObservable } from '@tchak/ember-apollo-client';

module('Unit | Utility | getObservable', function() {
  test('it should return the observable from a result object', function(assert) {
    let mockObservable = { fakeObservable: true };
    let resultObject = {};
    setMeta(resultObject, { observable: mockObservable });

    let result = getObservable(resultObject);
    assert.deepEqual(result, mockObservable);
  });
});
