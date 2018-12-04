import Ember from 'ember';
import RSVP from 'rsvp';

import { registerWaiter } from '@ember/test';

export default function waitFor() {
  let ongoing = 0;
  if (Ember.testing) {
    registerWaiter(() => ongoing === 0);
  }
  return resolver => {
    const promise = new RSVP.Promise(resolver);
    ongoing++;
    return promise.finally(() => {
      ongoing--;
    });
  };
}
