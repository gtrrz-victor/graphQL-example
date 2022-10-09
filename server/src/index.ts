import * as admin from 'firebase-admin'
const serviceAccount = require('../service-account.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    //   databaseURL: "https://graphql-server-firebase-default-rtdb.asia-southeast1.firebasedatabase.app"
});

import { ApolloError, gql, ValidationError, ApolloServer } from 'apollo-server'

const typeDefs = gql`
    type Booking {
        id: ID!
        name: String!
        description: String
        tour: Tour!
        tourId: String!
    }

    type Tour {
        id: ID!
        name: String!
        isFree: Boolean!
        bookings: [Booking]!
    }
    type Query {
        tours: [Tour]!
        booking(id: String!):Booking
    }
`

const resolvers = {
    Booking: {
        async tour(booking) {
            try {
                const tour = await admin
                    .firestore()
                    .doc(`tours/${booking.tourId}`)
                    .get()
                return tour.data()
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    },
    Tour: {
        async bookings(tour) {
            try {
                const bookings = await admin
                    .firestore()
                    .collection('bookings')
                    .where('tourId', '==', tour.id)
                    .get()
                return bookings.docs.map(booking => booking.data())
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    },
    Query: {
        async tours() {
            const tours = await admin.firestore().collection('tours').get()
            return tours.docs.map(tour => tour.data())
        },
        async booking(_, args) {
            try {
                const bookingDoc = await admin.firestore().doc(`bookings/${args.id}`).get()
                const booking = bookingDoc.data()
                return booking || new ValidationError('Booking ID not found')
            } catch (error) {
                throw new ApolloError(error)
            }
        }
    }
}


const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({url})=>{
    console.log(`Server ready at: ${url}`)
})