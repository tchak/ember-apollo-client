import { module, test } from 'qunit';
import gql from 'graphql-tag';

import testFragment from './test-fragment';
import testQuery from './test-query';
import testSubscription from './test-subscription';

module('Unit | graphql-filter', function() {
  function testCompilation(description, { actual, expected }) {
    test(description, function(assert) {
      assert.deepEqual(
        actual.definitions,
        JSON.parse(JSON.stringify(expected.definitions))
      );
    });
  }

  testCompilation('simple compilation', {
    actual: testFragment,
    expected: gql`
      fragment testFragment on Object {
        name
      }
    `,
  });

  testCompilation('simple subscription compilation', {
    actual: testSubscription,
    expected: gql`
      subscription TestSubscription {
        subject {
          name
        }
      }
    `,
  });

  testCompilation('compilation with #import references', {
    actual: testQuery,
    expected: gql`
      query TestQuery {
        subject {
          ...testFragment
        }
      }

      fragment testFragment on Object {
        name
      }
    `,
  });
});
