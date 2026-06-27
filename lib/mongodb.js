import { MongoClient } from 'mongodb'

let _clientPromise

export default function getClientPromise() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not defined')

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect()
    }
    return global._mongoClientPromise
  }

  if (!_clientPromise) {
    _clientPromise = new MongoClient(uri).connect()
  }
  return _clientPromise
}
