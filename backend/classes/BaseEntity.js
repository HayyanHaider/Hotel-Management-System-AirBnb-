class BaseEntity {
  constructor(entityData = {}) {
    this.id = entityData.id || entityData._id || null;
    this.createdAt = entityData.createdAt || new Date();
    this.updatedAt = entityData.updatedAt || new Date();
  }

  touch() {
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  clone(overrides = {}) {
    return new this.constructor({
      ...this.toJSON(),
      ...overrides
    });
  }
}

module.exports = BaseEntity;

