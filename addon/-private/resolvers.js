import { isPresent } from '@ember/utils';

import extractData from './extract-data';

export function resolveWith(resolve, resultKey) {
  return result => {
    return resolve(extractData(result, resultKey));
  };
}

export function rejectWith(reject) {
  return error => {
    let errors;
    if (isPresent(error.networkError)) {
      error.networkError.code = 'network_error';
      errors = [error.networkError];
    } else if (isPresent(error.graphQLErrors)) {
      errors = error.graphQLErrors;
    }
    if (errors) {
      return reject({ errors });
    }
    throw error;
  };
}
