const SUBSCRIPTION = new WeakMap();

export function getObservable(result) {
  const meta = SUBSCRIPTION.get(result);
  return meta && meta.observable;
}

export function unsubscribe(result) {
  const meta = SUBSCRIPTION.get(result);
  if (meta && meta.unsubscribe) {
    meta.unsubscribe();
  }
}

export function setMeta(result, meta) {
  SUBSCRIPTION.set(result, meta);
}
