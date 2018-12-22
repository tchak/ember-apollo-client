import Route from '@ember/routing/route';
import { queryManager } from '@tchak/ember-apollo-client';

import query from 'dummy/gql/queries/human';

const variables = { id: '1000' };

export default Route.extend({
  apollo: queryManager(),
  model() {
    return this.apollo.watchQuery(
      {
        query,
        variables,
        fetchPolicy: 'cache-and-network',
      },
      'human'
    );
  },

  actions: {
    refetchModel() {
      this.apollo.query({
        query,
        variables,
        fetchPolicy: 'network-only',
      });
    },
  },
});
