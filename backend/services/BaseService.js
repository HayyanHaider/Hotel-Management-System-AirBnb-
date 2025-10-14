class BaseService {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  getDependency(key) {
    return this.dependencies[key];
  }
}

module.exports = BaseService;


