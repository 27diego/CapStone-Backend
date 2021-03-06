const mongoUsers = require("../models/mongoUsers");
const mongoLogin = require("../models/mongoLogin");

const fs = require("fs");

const handleGetUsers = async (req, res) => {
  mongoUsers
    .find()
    .sort({ lname: 1 })
    .then(users => res.json(users));
};

const handleGetUser = async (req, res) => {
  const { id } = req.params;
  let user;
  try {
    user = await mongoUsers.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({ message: "user does not exist" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  res.send(user);
};

//change to add new data
const newUser = async (req, res, bcrypt) => {
  const {
    fName,
    lName,
    email,
    password,
    status,
    isAdmin,
    department
  } = req.body;

  const newUser = new mongoUsers({
    fName,
    lName,
    email,
    status,
    isAdmin,
    department
  });

  const hashPass = bcrypt.hashSync(password);

  const newLogin = new mongoLogin({
    email,
    password: hashPass
  });

  const emailName = email;

  const existingUser = await mongoUsers.findOne({ email: emailName });
  const existingLogin = await mongoLogin.findOne({ email: emailName });
  if (existingUser) {
    return res.status(404).json({ message: "user already exists" });
  } else {
    newUser
      .save()
      .then(user => {
        fs.mkdirSync(`./uploads/${user._id}`, { recursive: true });
        res.json(user);
      })
      .catch(err => console.log(err));
    newLogin.save().then(log => {});
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  const dir = `./uploads/${id}`;
  let user;
  try {
    user = await mongoUsers.findById(id);
    if (user == null) {
      return res.status(404).json({ message: "user does not exist" });
    } else {
      user.remove();
      res.json({ message: `deleted user with id ${id}` });

      deleteLogin(email);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteLogin = async email => {
  const login = await mongoLogin.findOne({ email });
  const id = login._id;
  let user;
  try {
    user = await mongoLogin.findById(id);
    if (user == null) {
      return res.status(404).json({ message: "login for user does not exist" });
    } else {
      user.remove();
    }
  } catch (err) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const updateObj = req.body;

  //ObjectId is undefined
  const ObjectId = require("mongodb").ObjectID;

  const update = await mongoUsers.updateMany(
    { _id: ObjectId(id) },
    { $set: updateObj }
  );

  if (update.ok) {
    const user = await mongoUsers.findById(id);
    return res.status(200).json(user);
  } else {
    return res.status(404).json("failed update");
  }
};

const getLogs = (req, res) => {
  mongoLogin.find().then(users => res.json(users));
};

const postFile = (req, res) => {};

module.exports = {
  handleGetUser: handleGetUser,
  handleGetUsers,
  newUser,
  deleteUser,
  updateUser,
  postFile,
  getLogs
};
