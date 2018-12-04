import Component from '@ember/component';
import Route from '@ember/routing/route';
import EmberObject from '@ember/object';

export default function setupHooks(queryManager, context) {
  if (context instanceof Component) {
    installHook(queryManager, context, 'willDestroyElement');
  } else if (context instanceof Route) {
    installHook(queryManager, context, 'beforeModel');
    installHook(queryManager, context, 'resetController');
    installHook(queryManager, context, 'willDestroy');
  } else if (context instanceof EmberObject) {
    installHook(queryManager, context, 'willDestroy');
  }
}

function installHook(queryManager, context, hookName) {
  let hook = hooks[hookName].bind(queryManager);
  let old = context[hookName];

  context[hookName] = function() {
    if (typeof old === 'function') {
      old.call(this, ...arguments);
    }
    hook.call(queryManager, ...arguments);
  };
}

const hooks = {
  willDestroyElement() {
    this.unsubscribeAll(false);
  },

  beforeModel() {
    this.markSubscriptionsStale();
  },

  resetController(_, isExiting) {
    this.unsubscribeAll(!isExiting);
  },

  willDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll(false);
    }
  },
};
