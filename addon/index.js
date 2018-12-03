import queryManager from 'ember-apollo-client/apollo/query-manager';

export function getObservable(queryResult) {
  return queryResult._apolloObservable;
}

export let apolloObservableKey = '_apolloObservable';

export { queryManager };
