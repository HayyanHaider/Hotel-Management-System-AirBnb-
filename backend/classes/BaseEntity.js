class BaseEntity {
  constructor(entityData = {}) {
    // Store the raw MongoDB _id without converting to string
    // The conversion to string should only happen when generating tokens or sending to frontend
    const rawId = entityData._id || entityData.id;
    this._id = rawId;
    this.id = rawId;
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
