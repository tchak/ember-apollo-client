const META = new WeakMap();

export function getMeta(obj) {
  return META.get(obj);
}

export function setMeta(obj, meta) {
  META.set(obj, meta);
}
