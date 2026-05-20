window.SKY = window.SKY || {};

window.SKY.EnemyFactory = (() => {
  const registry = new Map();

  function register(type, ctor) {
    if (!type || typeof ctor !== 'function') {
      throw new Error('EnemyFactory.register requires a type and constructor.');
    }
    registry.set(type, ctor);
  }

  function create(type, x, y, options = {}) {
    const Ctor = registry.get(type);
    if (!Ctor) {
      throw new Error(`Enemy type not registered: ${type}`);
    }
    return new Ctor(x, y, options);
  }

  function listTypes() {
    return Array.from(registry.keys());
  }

  return {
    register,
    create,
    listTypes,
  };
})();
