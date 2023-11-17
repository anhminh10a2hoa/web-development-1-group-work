const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { handleRequest } = require("../../routes");
const mongoose = require('mongoose');
const usersUrl = "/api/users";
const productsUrl = "/api/products";
const ordersUrl = "/api/orders";
const contentType = "application/json";
chai.use(chaiHttp);

const User = require("../../models/user");
const Product = require("../../models/product");
const Order = require("../../models/order");

// helper function for authorization headers
const encodeCredentials = (username, password) =>
  Buffer.from(`${username}:${password}`, "utf-8").toString("base64");

// helper function for creating randomized test data
const generateRandomString = (len = 9) => {
  let str = "";

  do {
    str += Math.random().toString(36).substr(2, 9).trim();
  } while (str.length < len);

  return str.substr(0, len);
};

// Get products (create copies for test isolation)
const products = require("../../setup/products.json").map((product) => ({
  ...product,
}));

// Get users (create copies for test isolation)
const users = require("../../setup/users.json").map((user) => ({ ...user }));

const adminUser = { ...users.find((u) => u.role === "admin") };
const customerUser = { ...users.find((u) => u.role === "customer") };

const adminCredentials = encodeCredentials(adminUser.email, adminUser.password);
const customerCredentials = encodeCredentials(
  customerUser.email,
  customerUser.password,
);
const dbConfig = {
  host: 'localhost',
  port: 27017,
  db: 'Test_WebShopDb'
};


describe("Routes", () => {
  describe("handleRequest()", () => {
    describe("Viewing all users: GET /api/users", () => {
      it("should respond Basic Auth Challenge if Authorization header is missing");
      it('should respond "403 Forbidden" if customer credentials are received');
    })
    describe("Viewing a single user: GET /api/users/{id}", () => {
      it("should respond status code 404 when user does not exist");
    });
    /**
     *  Products endpoints
     */
    describe("Updating products: PUT /api/products/{id}", () => {
      it("update of product properties");
    });

    describe("Deleting products: DELETE /api/products/{id}", () => {
      it("should return the user when remove user");
    });

    describe("Create a new product: POST /api/products", () => {
      it('should respond "201 Created" when creating product successfully');
    });

    /**
     *  Orders endpoints
     */

    describe("Viewing all orders: GET /api/orders", () => {
      it("should respond JSON when admin credentials are received");

      it("should respond JSON when customer credentials are received");
    });

    describe("Viewing a single order: GET /api/orders/{id}", () => {
      it("should respond status code 404 when order exists but the owner is not the current customer");
    });

    describe("Create a new order: POST /api/orders", () => {
      it('should respond "403 Forbidden" when admin credentials are received');
    });
  });
});
