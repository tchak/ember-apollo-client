import { registerWaiter } from '@ember/test';
import RSVP from 'rsvp';

export default function waitFor() {
  let ongoing = 0;
  registerWaiter(() => ongoing === 0);
  return resolver => {
    const promise = new RSVP.Promise(resolver);
    ongoing++;
    return promise.finally(() => {
      ongoing--;
    });
  };
}
