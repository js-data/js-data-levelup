describe('DSLevelUpAdapter#updateAll', function () {
  it('should update all items', function () {
    var id;
    return adapter.create(User, { name: 'John' })
      .then(function (user) {
        id = user.id;
        return adapter.findAll(User, {
          name: 'John'
        });
      }).then(function (users) {
        assert.equal(users.length, 1);
        assert.deepEqual(users[0], { id: id, name: 'John' });
        return adapter.updateAll(User, {
          name: 'Johnny'
        }, {
          name: 'John'
        });
      }).then(function (users) {
        assert.equal(users.length, 1);
        assert.deepEqual(users[0], { id: id, name: 'Johnny' });
        return adapter.findAll(User, {
          name: 'John'
        });
      }).then(function (users) {
        assert.equal(users.length, 0);
        return adapter.findAll(User, {
          name: 'Johnny'
        });
      }).then(function (users) {
        assert.equal(users.length, 1);
        assert.deepEqual(users[0], { id: id, name: 'Johnny' });
        return adapter.destroy(User, id);
      }).then(function (destroyedUser) {
        assert.isFalse(!!destroyedUser);
      });
  });
});
