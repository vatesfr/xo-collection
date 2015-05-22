import bind from 'lodash.bind'
import forEach from 'lodash.foreach'

import Collection from './collection'

// ===================================================================

export default class Aggregate extends Collection {
  constructor (collections = []) {
    super()

    this._collections = new Set()
    forEach(collections, this.attachCollection, this)

    // Bound versions of listeners.
    this._onAdd = bind(this._onAdd, this)
    this._onUpdate = bind(this._onUpdate, this)
    this._onRemove = bind(this._onRemove, this)
  }

  attachCollection (collection) {
    const {_collections: collections} = this

    if (collections.has(collection)) {
      throw new Error('collection is already attached')
    }

    collections.add(collection)

    // Add existing entries.
    //
    // FIXME: I think there may be a race condition if the `add` event
    // has not been emitted yet.
    this._onAdd(collection.all)

    collection.on('add', this._onAdd)
    collection.on('update', this._onUpdate)
    collection.on('remove', this._onRemove)
  }

  _detachCollection (collection) {
    collection.removeListener('add', this._onAdd)
    collection.removeListener('update', this._onUpdate)
    collection.removeListener('remove', this._onRemove)

    this._onRemove(collection.all)
  }

  detachAllCollections () {
    const {_collections: collections} = this

    for (let collection of collections) {
      this._detachCollection(collection)
    }

    collections.clear()
  }

  detachCollection (collection) {
    const {_collections: collections} = this

    if (!collections.has(collections)) {
      throw new Error('collection is not attached')
    }

    this._detachCollection(collection)
  }

  // -----------------------------------------------------------------

  add () {
    throw new Error('a view is read only')
  }

  clear () {
    throw new Error('a view is read only')
  }

  set () {
    throw new Error('a view is read only')
  }

  update () {
    throw new Error('a view is read only')
  }

  _onAdd (items) {
    forEach(items, (value, key) => {
      // super.add() cannot be used because the item may already be
      // in the view if it was already present at the creation of
      // the view and its event not already emitted.
      super.set(key, value)
    })
  }

  _onUpdate (items) {
    forEach(items, (value, key) => {
      super.set(key, value)
    })
  }

  _onRemove (items) {
    forEach(items, (value, key) => {
      if (super.has(key)) {
        super.remove(key)
      }
    })
  }
}
