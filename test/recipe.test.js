/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
// import so that we can test API
const request = require('supertest');
// import for passwords
const bcrypt = require('bcrypt');
// import for initializing app
const app = require('../index');
// import the model for users
const User = require('../database/models/users');
// import so that we can connect to the DB
const mongoose = require('../database/dbConection');
// require the user service
const UserService = require('../database/services/users');
// require the recipe service
const RecipeService = require('../database/services/recipes');
// define variables to be assigned a value later
let id;
let token;
// describe method houses all of our tests in a group
describe('test the recipes API', () => {
  // use beforeAll to create a user
  beforeAll(async () => {
    // this encrypts the password 'okay' using bcrypt
    const password = bcrypt.hashSync('okay', 10);
    // the user will be admin and then we also pass in the password we encrypted
    await User.create({
      username: 'admin',
      password,
    });
  });
  afterAll(async () => {
    // clears the user collection
    await User.deleteMany();
    // disconnect from the database
    mongoose.disconnect();
  });

  // group both the positive and negative test in one describe method
  describe('POST/login', () => {
    it('authenticate user and sign him in', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'admin',
        password: 'okay',
      };
      const res = await request(app)
        .post('/login')
        .send(user);
      token = res.body.accessToken;
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          accessToken: res.body.accessToken,
          success: true,
          data: expect.objectContaining({
            id: res.body.data.id,
            username: res.body.data.username,
          }),
        }),
      );
    });

    it('Do not sign him in, password field can not be empty', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'admin',
      };
      const res = await request(app)
        .post('/login')
        .send(user);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'username or password can not be empty',
        }),
      );
    });

    it('Do not sign him in, usernamne field can not be empty', async () => {
      // Data you want to save to DB
      const user = {
        password: 'okay',
      };
      const res = await request(app)
        .post('/login')
        .send(user);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'username or password can not be empty',
        }),
      );
    });

    it('Do not sign him in, username does not exist', async () => {
      const user = {
        username: 'hello',
        password: 'okay',
      };
      const res = await request(app)
        .post('/login')
        .send(user);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Incorrect username or password',
        }),
      );
    });

    it('Do not sign him in, incorrect password', async () => {
      const user = {
        username: 'admin',
        password: 'okay1',
      };
      const res = await request(app)
        .post('/login')
        .send(user);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Incorrect username or password',
        }),
      );
    });

    it('Do not sign him in , internal server error', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const user = {
        username: 'admin',
        password: 'okay',
      };
      jest.spyOn(UserService, 'findByUsername')
        // mock the next call to fail
        .mockRejectedValueOnce(new Error());
      const res = await request(app)
        .post('/login')
        .send(user);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'login failed.',
        }),
      );
    });
  });

  // TEST CREATE RECIPES
  describe('Post/recipes', () => {
    it('it should save new recipe to db', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipes = {
        name: 'Chicken nuggests',
        difficulty: 2,
        vegetarian: true,
      };
      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
      id = res.body.data._id;
    });

    it('it should not save new recipe to db, invalid vegetarian value', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipes = {
        name: 'Chicken nuggests',
        difficulty: 2,
        vegetarian: 'true',
      };
      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'vegetarian field should be boolean',
        }),
      );
    });

    it('it should not save new recipe to db, empty name field', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipes = {
        difficulty: 2,
        vegetarian: true,
      };
      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'name field can not be empty',
        }),
      );
    });

    it('it should not save new recipe to db, invalid difficulty field', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipes = {
        name: 'Chicken nuggets',
        difficulty: '2',
        vegetarian: true,
      };
      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'difficulty field should be a number',
        }),
      );
    });

    it('it should not save new recipe to db, invalid token', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipes = {
        name: 'Chicken nuggets',
        difficulty: 2,
        vegetarian: true,
      };
      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${243123414324}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Unauthorized',
        }),
      );
    });

    it('it should not save new recipe to db, internal server error', async () => {
      // DATA YOU WANT TO SAVE TO DB
      const recipes = {
        name: 'chicken nuggets',
        difficulty: 3,
        vegetarian: true,
      };
      jest.spyOn(RecipeService, 'saveRecipes')
        // mock the next call to fail
        .mockRejectedValueOnce(new Error());
      const res = await request(app)
        .post('/recipes')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Failed to save recipes!',
        }),
      );
    });
  });

  describe('GET/recipes', () => {
    it('it should retrieve all the recipes in db', async () => {
      const res = await request(app)
        .get('/recipes');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });

    it('it should not retrieve any recipe from db, internal server error', async () => {
      jest.spyOn(RecipeService, 'allRecipes')
        // mock the next call to fail
        .mockRejectedValueOnce(new Error());
      const res = await request(app)
        .get('/recipes')
        .send();
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Some error occurred while retrieving recipes.',
        }),
      );
    });
  });

  describe('GET/recipes/:id', () => {
    it('Retrieve specified recipes in db', async () => {
      const res = await request(app)
        .get(`/recipes/${id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });

    it('It should not retrieve specified recipes in db', async () => {
      const res = await request(app)
        .get('/recipes/123faf3qtv34tewegwe');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Recipe with id 123faf3qtv34tewegwe does not exist',
        }),
      );
    });

    it('It should not retrieve any recipes from db, internal server error', async () => {
      jest.spyOn(RecipeService, 'fetchById')
        // mock the next call to fail
        .mockRejectedValueOnce(new Error());
      const res = await request(app)
        .get(`/recipes/${id}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Some error occurred while retrieving recipe details.',
        }),
      );
    });
  });

  describe('PATCH/recipes/:id', () => {
    it('update the recipe record in db', async () => {
      // DATA YOU WANT TO UPDATE THE RECIPE WITH
      const recipes = {
        name: 'Not chicken nuggets',
      };
      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });

    it('it should not update recipe, invalid difficulty value', async () => {
      // DATA YOU WANT TO UPDATE THE RECIPE WITH
      const recipes = {
        difficulty: '100',
      };
      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'difficulty field should be a number',
        }),
      );
    });

    it('it should not update recipe, invalid vegetarian value', async () => {
      // DATA YOU WANT TO UPDATE THE RECIPE WITH
      const recipes = {
        vegetarian: 'true',
      };
      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'vegetarian field should be boolean',
        }),
      );
    });

    it('it should not update recipe, invalid recipe id', async () => {
      // DATA YOU WANT TO UPDATE THE RECIPE WITH
      const recipes = {
        vegetarian: true,
      };
      const res = await request(app)
        .patch('/recipes/2345678hjghjg')
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Recipe with id 2345678hjghjg does not exist',
        }),
      );
    });

    it('it should not update recipe, invalid token', async () => {
      // DATA YOU WANT TO UPDATE THE RECIPE WITH
      const recipes = {
        vegetarian: true,
      };
      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', 'Bearer 1234asdf2q4');
      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Unauthorized',
        }),
      );
    });

    it('it should not update recipe, no update passed', async () => {
      // DATA YOU WANT TO UPDATE THE RECIPE WITH
      const recipes = {
      };
      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'field should not be empty',
        }),
      );
    });

    it('It should not update recipe in db, internal server error', async () => {
      const recipes = {
        name: 'chicken nuiggets',
      };
      jest.spyOn(RecipeService, 'fetchByIdAndUpdate')
        // mock the next call to fail
        .mockRejectedValueOnce(new Error());
      const res = await request(app)
        .patch(`/recipes/${id}`)
        .send(recipes)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'An error occured while updating recipe',
        }),
      );
    });
  });
  // TEST DELETE ENDPOINT
  describe('DELETE/recipes/:id', () => {
    it('Detlete the specified recipe', async () => {
      const res = await request(app)
        .delete(`/recipes/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Recipe successfully deleted',
        }),
      );
    });

    it('Failed to detlete the specified recipe, invalid token', async () => {
      const res = await request(app)
        .delete(`/recipes/${id}`)
        .set('Authorization', 'Bearer 123123213213');
      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Unauthorized',
        }),
      );
    });

    it('Fail to delete recipe, internal server error', async () => {
      jest.spyOn(RecipeService, 'fetchByIdAndDelete')
        // mock the next call to fail
        .mockRejectedValueOnce(new Error());
      const res = await request(app)
        .delete(`/recipes/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'An error occured while deleting recipe',
        }),
      );
    });
  });
});
