'use strict';

class Asset {

  constructor(id, title, description, createdAt, createdBy, tags, rating, thumbnail, extension, size, binary) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.createdAt = createdAt;
    this.createdBy = createdBy;
    this.tags = tags;
    this.rating = rating;
    this.thumbnail = thumbnail;
    this.extension = extension;
    this.size = size;
    this.binary = binary;
  }

}

class AudioRecord extends Asset {

  constructor(id, title, description, createdAt, createdBy, tags, rating, thumbnail, extension, size, binary) {
    super(id, title, description, createdAt, createdBy, tags, rating, thumbnail, extension, size, binary);
    this.type = 'AUDIO_RECORD';
  }

}

class Movie extends Asset {

  constructor(id, title, description, createdAt, createdBy, tags, rating, thumbnail, extension, size, binary) {
    super(id, title, description, createdAt, createdBy, tags, rating, thumbnail, extension, size, binary);
    this.type = 'MOVIE';
  }

}

class Book extends Asset {

  constructor(id, title, description, createdAt, createdBy, tags, rating, thumbnail, extension, size, binary) {
    super(id, title, description, createdAt, createdBy, tags, rating, thumbnail, extension, size, binary);
    this.type = 'BOOK';
  }

}

class UserCriteria {

  constructor(query, perPage = 10, page = 1, sortBy) {
    this.query = query;
    this.perPage = perPage;
    this.page = page;
    this.sortBy = {...sortBy}
  }
}

const DATA_TYPES = {
  USER: 'USER',
  ASSET: 'ASSET'
};

class UserRepository {

  constructor() {
    this.db = new PouchDB('users');
  }

  async add(user) {
    const response = await this.db.post({
      name: user.name,
      email: user.email,
      password: btoa(user.password),
      createdAt: dateFns.format(new Date(), 'DD-MM-YYYY HH:MM:SSS'),
      type: DATA_TYPES.USER
    });
    console.log(response);
  }

  async getOne(id) {
    const response = await this.db.get(id);

    return response;
  }

  update(user) {}

  remove(user) {}

  getAll(criteria) {
    return this.db.allDocs({include_docs: true});
  }
}

const userRepository =  new UserRepository();

class UserService {

  constructor(userRepository) {
    this.userRepository = userRepository;
    this.saveUser = this.saveUser.bind(this);
    this.populate = this.populate.bind(this);
  }


  async saveUser(e) {
    e.preventDefault();
    const name = document.querySelector('.user-form input[name=name]').value;
    const email = document.querySelector('.user-form input[name=email]').value;
    const password = document.querySelector('.user-form input[name=password]').value;
    const passwordConfirmation = document.querySelector('.user-form input[name=passwordConfirmation]').value;

    if (password !== passwordConfirmation) {
      console.error('password mismatched!');
      return;
    }

    await this.userRepository.add({name, email, password});
  }

  async populate() {
    const tableBody = document.querySelector('.table-body');
    let users = await this.userRepository.getAll();
    console.log(users);
    users.rows
      .map(createUserRow)
      .forEach(userRow => {
        tableBody.appendChild(userRow);
      })
  }

  readCurrentUser() {
    let user = localStorage.getItem('user');
    if (user) return JSON.parse(user);

    return null;
  }

  async readOne(id) {
    const user = await this.userRepository.getOne(id);
    console.log(user);
  }

}

const userService = new UserService(userRepository);

const userSubmit = document.querySelector('.user-form input[type=submit]');

if (userSubmit) {
  userSubmit.onclick = userService.saveUser;
}

function createUserRow({id:userId, doc:user}) {
  const tr = document.createElement('tr');
  const id = document.createElement('td');
  const name = document.createElement('td');
  const email = document.createElement('td');
  const createdAt = document.createElement('td');

  id.innerText = userId;
  name.innerText = user.name;
  email.innerText = user.email;
  createdAt.innerText = user.createdAt;

  tr.appendChild(id);
  tr.appendChild(name);
  tr.appendChild(email);
  tr.appendChild(createdAt);

  return tr;
}

if (document.querySelector('.users-table')) {
  userService.populate();
}

async function createIndex() {
  const db = new PouchDB('library');
  await db.createIndex({
    index: {
      fields: ['type']
    }
  })
}

async function seedUsers() {
  try {
  let db = new PouchDB('users');
  await db.destroy();
  db = new PouchDB('users');
  await db.bulkDocs([
    {name: 'ave', email: 'ave@mail.corp', password: btoa('password'), createdAt: dateFns.format(new Date(), 'DD-MM-YYYY HH:MM:SSS'), type: DATA_TYPES.USER},
    {name: 'ing', email: 'ing@mail.corp', password: btoa('password'), createdAt: dateFns.format(new Date(), 'DD-MM-YYYY HH:MM:SSS'), type: DATA_TYPES.USER},
    {name: 'alex', email: 'alex@mail.corp', password: btoa('password'), createdAt: dateFns.format(new Date(), 'DD-MM-YYYY HH:MM:SSS'), type: DATA_TYPES.USER},
    {name: 'sam', email: 'sam@mail.corp', password: btoa('password'), createdAt: dateFns.format(new Date(), 'DD-MM-YYYY HH:MM:SSS'), type: DATA_TYPES.USER},
    {name: 'john', email: 'john@mail.corp', password: btoa('password'), createdAt: dateFns.format(new Date(), 'DD-MM-YYYY HH:MM:SSS'), type: DATA_TYPES.USER},
    {name: 'doe', email: 'doe@mail.corp', password: btoa('password'), createdAt: dateFns.format(new Date(), 'DD-MM-YYYY HH:MM:SSS'), type: DATA_TYPES.USER}
  ]);
  } catch (e) {
    console.error('Unable to seed users', e);
  }
}

class AssetRepository {

  constructor() {
    this.db = new PouchDB('assets');
  }

  async add(asset) {
    const thumbnailURL = await readThumbnail(asset.thumbnail);
    const response = await this.db.post({
      title: asset.title,
      description: asset.description,
      createdAt: dateFns.format(new Date(), 'DD-MM-YYYY HH:MM:SSS'),
      type: DATA_TYPES.ASSET,
      createdBy: asset.user,
      tags: asset.tags,
      rating: asset.rating || [],
      _attachments: {
        [asset.file.name]: {
          content_type: asset.file.type,
          data: asset.file
        },
        thumbnail: {
          content_type: asset.thumbnail.type,
          data: thumbnailURL
        }
      }
    });
    console.log(response);
  }

}

const assetRepository = new AssetRepository();

class AssetService {

  constructor(assetRepository, userService) {
    this.assetRepository = assetRepository;
    this.userService = userService;
    this.saveAsset = this.saveAsset.bind(this);
  }

  async saveAsset(e) {
    e.preventDefault();
    const title = document.querySelector('.asset-form input[name=title]').value;
    const description = document.querySelector('.asset-form input[name=description]').value;
    const tags = document.querySelector('.asset-form input[name=tags]').value;
    const asset = document.querySelector('.asset-form input[name=asset]').files[0];
    const thumbnail = document.querySelector('.asset-form input[name=thumbnail]').files[0];
    const user = this.userService.readCurrentUser();

    this.assetRepository.add({title, description, tags, file: asset, user, rating: [], thumbnail});
  }

}

function readThumbnail(file) {
  return new Promise((ok, fail) => {
    const reader = new FileReader();
    reader.onloadend = function() {
      ok(reader.result);
    };
    reader.onerror = fail;
    reader.readAsDataURL(file);
  });
}

const assetService = new AssetService(assetRepository, userService);

const file = document.querySelector('.asset-form input[type=file]');

if (file) {
  file.onchange = fileChange;
}

function fileChange({target: {files}}) {
  console.log(files[0])
}

const assetSubmit = document.querySelector('.asset-form input[type=submit]');

if (assetSubmit) {
  assetSubmit.onclick = assetService.saveAsset;
}