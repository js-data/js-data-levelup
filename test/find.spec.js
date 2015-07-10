describe('DSLevelUpAdapter#find', function () {
  it('should find a user in levelDB', function () {
    var id;
    return adapter.create(User, {name: 'John'})
      .then(function (user) {
        id = user.id;
        assert.equal(user.name, 'John');
        assert.isString(user.id);
        return adapter.find(User, user.id);
      })
      .then(function (user) {
        assert.equal(user.name, 'John');
        assert.isString(user.id);
        assert.deepEqual(user, {id: id, name: 'John'});
        return adapter.destroy(User, id);
      })
      .then(function (user) {
        assert.isFalse(!!user);
        return adapter.find(User, id);
      })
      .then(function () {
        throw new Error('Should not have reached here!');
      })
      .catch(function (err) {
        assert.equal(err.message, 'Not Found!');
      });
  });
  it('should find a user with relations', function () {
    var id, id2, _user, _post, _comments;
    return adapter.create(User, {name: 'John'})
      .then(function (user) {
        _user = user;
        id = user.id;
        assert.equal(user.name, 'John');
        assert.isDefined(user.id);
        return adapter.find(User, user.id);
      })
      .then(function (user) {
        assert.equal(user.name, 'John');
        assert.isDefined(user.id);
        assert.equalObjects(user, {id: id, name: 'John'});
        return adapter.create(Post, {
          content: 'test',
          userId: user.id
        });
      })
      .then(function (post) {
        _post = post;
        id2 = post.id;
        assert.equal(post.content, 'test');
        assert.isDefined(post.id);
        assert.isDefined(post.userId);
        return Promise.all([
          adapter.create(Comment, {
            content: 'test2',
            postId: post.id,
            userId: _user.id
          }),
          adapter.create(Comment, {
            content: 'test3',
            postId: post.id,
            userId: _user.id
          })
        ]);
      })
      .then(function (comments) {
        _comments = comments;
        _comments.sort(function (a, b) {
          return a.content > b.content;
        });
        return adapter.find(Post, _post.id, {with: ['user', 'comment']});
      })
      .then(function (post) {
        post.comments.sort(function (a, b) {
          return a.content > b.content;
        });
        assert.equalObjects(post.user, _user);
        assert.equalObjects(post.comments, _comments);
        return adapter.destroyAll(Comment);
      })
      .then(function () {
        return adapter.destroy(Post, id2);
      })
      .then(function () {
        return adapter.destroy(User, id);
      })
      .then(function (user) {
        assert.isFalse(!!user);
        return adapter.find(User, id);
      })
      .then(function () {
        throw new Error('Should not have reached here!');
      })
      .catch(function (err) {
        console.log(err.stack);
        assert.equal(err.message, 'Not Found!');
      });
  });
});
