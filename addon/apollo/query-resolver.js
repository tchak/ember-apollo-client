import { get } from '@ember/object';
import { isNone, isPresent } from '@ember/utils';

import copyWithExtras from '../utils/copy-with-extras';

export function resolveWith(resolve, resultKey) {
  return result => {
    let dataToSend = isNone(resultKey)
      ? result.data
      : get(result.data, resultKey);
    dataToSend = copyWithExtras(dataToSend);
    return resolve(dataToSend);
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
