import Route from '@ember/routing/route';
import { queryManager } from 'ember-apollo-client';

import query from 'dummy/gql/queries/human';
import mutation from 'dummy/gql/mutations/change-character-name';

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
    changeName(id, name) {
      return this.apollo.mutate({
        mutation,
        variables: { id, name },
      });
    },
  },
});
