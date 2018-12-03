import Route from '@ember/routing/route';
import { queryManager } from 'ember-apollo-client';

import query from 'dummy/gql/queries/characters';

export default Route.extend({
  apollo: queryManager(),
  queryParams: {
    kind: {
      refreshModel: true,
    },
  },

  model(variables) {
    return this.apollo.watchQuery({ query, variables }, 'characters');
  },
});
