/*
The level of abstraction is:
1. user/React code uses graphQL
2. graphQl uses mongoose/express
3. mongoose/express actually interacts with database
*/

//const { ApolloServer, gql } = require('apollo-server');
const graphql = require('graphql');
const Group = require('../src/group');
const Concept = require('../src/concept');
const User = require ('../src/user');
const SentenceStarters = require('../src/sentenceStarters');

const {
    GraphQLObjectType, GraphQLString,
    GraphQLID, GraphQLInt,GraphQLSchema,
    GraphQLList,GraphQLNonNull,
    GraphQLInputObjectType,GraphQLBoolean
} = graphql;

//Schema defines data on the Graph like object types(book type), relation between
//these object types and describes how it can reach into the graph to interact with
//the data to retrieve or mutate the data

const SentenceStartersType = new GraphQLObjectType({
    name: 'SentenceStarters',
    fields: () => ({
        id: {type: GraphQLID},
        sentences: {type: GraphQLList(GraphQLString)}
    })
});

const GroupType = new GraphQLObjectType({
    name: 'Group',
    fields: () => ({
        id: { type: GraphQLID },
        groupOwner: {type: GraphQLString},
        name: {type: GraphQLString},
        password: {type: GraphQLString},
        users: {type: GraphQLList(GraphQLString)},
    })
});

const ImageType = new GraphQLObjectType({
  name: 'Image',
  fields: () => ({
      _id: {type: GraphQLID},
      data: {type: GraphQLList(GraphQLInt)},
      contentType: {type: GraphQLString}
  })
});

const ConceptType = new GraphQLObjectType({
    name: 'Concept',
    fields: () => ({
        id: { type: GraphQLID },
        group_id: { type: GraphQLID },
        name: { type: GraphQLString },
        concept_type: { type: GraphQLString },
        media: { type: GraphQLList(ImageType)},
        description: {type: GraphQLString},
        yes: {type: GraphQLInt},
        yesand: {type: GraphQLList(GraphQLString)},
        timestamp: {type: GraphQLString},
        sentence_starter: {type: GraphQLString},
        poll_options: {type: GraphQLList(GraphQLString)},
        poll_votes: {type: GraphQLList(GraphQLInt)},
        voter_list: {type: GraphQLList(GraphQLString)},
        s3: {type: GraphQLList(GraphQLString)}
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: {type: GraphQLID},
      username: {type: GraphQLString},
      password: {type: GraphQLString},
      hasConsented: {type: GraphQLBoolean},
      condition: {type: GraphQLString},
      groups: {type: GraphQLList(GraphQLString)},
      concepts: {type: GraphQLList(GraphQLString)},
      bio: {type: GraphQLString},
      email: {type: GraphQLString},
      goal: {type: GraphQLList(GraphQLString)},
      goalDates: {type: GraphQLList(GraphQLString)},
      profilePic: {type: GraphQLList(ImageType)},
      pushTokens: {type: GraphQLList(GraphQLString)}
    })
});

/*
need to have a separate input type for mutations below, even if this is
the exact same as the Image type defined above
*/
const ImageTypeInput = new GraphQLInputObjectType({
    name: "ImageInput",
    fields: () => ({
      _id: {type: GraphQLID},
      data: {type: GraphQLList(GraphQLInt)},
      contentType: {type: GraphQLString}
    })
});


//RootQuery describe how users can use the graph and grab data.
//E.g Root query to get all authors, get all books, get a particular
//book or get a particular author.
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        concept: {
            type: new GraphQLList(ConceptType),
            args: {group_id: {type: GraphQLID}},
            resolve(parent, args){
                return Concept.find({group_id: args.group_id});
            }
        },
        conceptByID: {
            type: ConceptType,
            args: { id: {type: GraphQLID}},
            resolve(parent, args){
                return Concept.findById(args.id)
            }
        },
        group: {
            type: GroupType,
            args: { name: {type: GraphQLString}},
            resolve(parent, args){
                //can't use find, have to use findOne
                return Group.findOne({name: args.name});
            }
        },
        groups: {
            type: new GraphQLList(GroupType),
            resolve(parent, args){
                return Group.find({});
            }
        },
        user: {
            type: UserType,
            args: {username: {type: GraphQLString}},
            resolve(parent, args){
                return User.findOne({username: args.username});
            }
        },
        users: {
          type: new GraphQLList(UserType),
          resolve(parent, args){
            return User.find({});
          }
        },
        allSentenceStarters: {
          type: new GraphQLList(SentenceStartersType),
          resolve(parent, args){
            return SentenceStarters.find({});
          }
        },
        sentenceStarterByID: {
          type: SentenceStartersType,
          args: {id: {type: GraphQLID}},
          resolve(parent, args){
            return SentenceStarters.findById(args.id);
          }
        }
    }
});

//Very similar to RootQuery helps user to add/update to the database.
const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addConcept: {
            type: ConceptType,
            args: {
              group_id: { type: GraphQLID },
              name: { type: GraphQLString },
              concept_type: { type: GraphQLString },
              poll_options: { type: GraphQLList(GraphQLString)},
              poll_votes: {type: GraphQLList(GraphQLInt)},
              voter_list: { type: GraphQLList(GraphQLString)},
              s3: { type: GraphQLList(GraphQLString)},
              description: {type: GraphQLString},
              timestamp: {type: GraphQLString},
              sentence_starter: {type: GraphQLID}
            },
            resolve(parent, args){
              let concept = new Concept({
                group_id: args.group_id,
                name: args.name,
                concept_type: args.concept_type,
                poll_options: args.poll_options,
                poll_votes: args.poll_votes,
                voter_list: args.voter_list,
                s3: args.s3,
                description: args.description,
                timestamp: args.timestamp,
                sentence_starter: args.sentence_starter
              });
              return concept.save();
            }
        },

        addGroup: {
            type: GroupType,
            args: {
                name: { type: new GraphQLNonNull(GraphQLString)},
                groupOwner: { type: GraphQLString}
            },
            resolve(parent, args) {
              let group = new Group({
                  name: args.name,
                  groupOwner: args.groupOwner,
              });
              return group.save();
            }
        },

        addUser: {
          type: UserType,
          args: {
              username: {type: GraphQLString},
              password: {type: GraphQLString},
              hasConsented:  {type: GraphQLBoolean},
              condition: {type: GraphQLString},
              bio: {type: GraphQLString},
              email: {type: GraphQLString},
              goal: {type: GraphQLList(GraphQLString)},
              goalDates: {type: GraphQLList(GraphQLString)},
              profilePic: { type: GraphQLList(ImageTypeInput)}
            },
            resolve(parent, args){
              let user = new User({
                username: args.username,
                password: args.password,
                hasConsented: args.hasConsented,
                condition: args.condition,
                bio: args.bio,
                email: args.email,
                goal: args.goal,
                goalDates: new Date(),
                profilePic: args.profilePic
              });
              return user.save();
          }
        },

        addTokenToUser: {
            type: UserType,
            args: {
              username: {type: GraphQLString},
              token: {type: GraphQLString}
            },
            resolve(parent, args){
              var updated = User.findOneAndUpdate({"username": args.username}, { $addToSet: { "pushTokens": args.token } }, err => {
                if (err) return res.json({ success: false, error: err });
                return updated;
              });
            }
        },

        addGroupToUser: {
            type: UserType,
            args: {
              username: {type: GraphQLString},
              groupName: {type: GraphQLString}
            },
            resolve(parent, args){
              var updated = User.findOneAndUpdate({"username": args.username}, { $push: { "groups": args.groupName } }, err => {
                if (err) return res.json({ success: false, error: err });
                return updated;
              });
            }
        },

        addUserToGroup: {
          type: GroupType,
          args: {
            username: {type: GraphQLString},
            groupName: {type: GraphQLString}
          },
          resolve(parent, args){
            var updated = Group.findOneAndUpdate({"name": args.groupName}, { $push: { "users": args.username } }, err => {
              if (err) return res.json({ success: false, error: err });
              return updated;
            });
          }
        },

        addConceptToUser: {
          type: UserType,
          args: {
            username: {type: GraphQLString},
            conceptID: {type: GraphQLString}
          },
          resolve(parent, args){
            var updated = User.findOneAndUpdate({"username": args.username}, { $push: { "concepts": args.conceptID } }, err => {
              if (err) return res.json({ success: false, error: err });
              return updated;
            });
          }
        },

        newSentenceStarter: {
          type: SentenceStartersType,
          resolve(parent, args){
            let SS = new SentenceStarters({sentences: []});
            return SS.save();
          }
        },

        addSentenceStarter: {
          type: SentenceStartersType,
          args: {
            id: {type: GraphQLID},
            sentence: {type: GraphQLString}
          },
          resolve(parent, args) {
            var updated = SentenceStarters.findByIdAndUpdate(args.id, { $push: { "sentences": args.sentence } }, err => {
              if (err) return res.json({ success: false, error: err });
              return updated;
            });
          }
        },

        editBio: {
          type: UserType,
          args: {
            username: {type: GraphQLString},
            bio: {type: GraphQLString}
          },
          resolve(parent, args){
            var updated = User.findOneAndUpdate({username: args.username}, {bio: args.bio}, {new: true});
            return updated;
          }
        },

        editGoal: {
          type: UserType,
          args: {
            username: {type: GraphQLString},
            goal: {type: GraphQLString},
            goalDates: {type: GraphQLString}
          },
          resolve(parent, args){
            var updated = User.findOneAndUpdate({username: args.username}, {$push: { "goal": args.goal }}, {new: true});
            updated = updated.findOneAndUpdate({username: args.username}, {$push: { "goalDates": new Date() }}, {new: true});
            return updated;
          }
        },

        removeConcept: {
          type: ConceptType,
          args: {
            id: {type: GraphQLID}
          },
          resolve(parent, args){
            var deleted = Concept.findByIdAndDelete(args.id);
            return deleted;
          }
        },

        newUserConcepts: {
          type: UserType,
          args: {
            username: {type: GraphQLString},
            concepts: {type: GraphQLList(GraphQLString)}
          },
          resolve(parent, args){
            var updated = User.findOneAndUpdate({username: args.username}, {concepts: args.concepts}, {new: true});
            return updated;
          }
        },

        removeUserFromGroup: {
          type: GroupType,
          args: {
            group_name: {type:GraphQLString},
            user: {type: GraphQLString}
          },
          async resolve(parent, args) {
            var group = await Group.findOne({name: args.group_name});
            var users = group.users;
            var newUsers = [];
            for (var i=0; i < users.length; i++){
              if (users[i] != args.user){
                newUsers.push(users[i]);
              }
            }
            group.users = newUsers;
            group.save();
            return group;
          }
        },

        deleteUserById: {
          type: UserType,
          args: {
            id: {type: GraphQLString}
          },
          resolve(parent, args) {
            var deleted = User.findByIdAndDelete(args.id);
            return deleted;
          }
        },

        removeGroupFromUser: {
          type: UserType,
          args: {
            user: {type: GraphQLString},
            group_name: {type:GraphQLString}
          },
          async resolve(parent, args) {
            var user = await User.findOne({username: args.user});
            var groups = user.groups;
            var newGroups = [];
            for (var i=0; i < groups.length; i++){
              if (groups[i] != args.group_name){
                newGroups.push(groups[i]);
              }
            }
            user.groups = newGroups;
            user.save();
            return user;
          }
        },

        removeTokenFromUser: {
          type: UserType,
          args: {
            user: {type: GraphQLString},
            pushToken: {type:GraphQLString}
          },
          async resolve(parent, args) {
            var user = await User.findOne({username: args.user});
            var pushTokens = user.pushTokens;
            var newPushTokens = [];
            for (var i=0; i < pushTokens.length; i++){
              if (pushTokens[i] != args.pushToken){
                newPushTokens.push(pushTokens[i]);
              }
            }
            user.pushTokens = newPushTokens;
            user.save();
            return user;
          }
        },

        addS3ToConcept: {
          type: ConceptType,
          args: {
            concept_id: {type: GraphQLString},
            s3: {type: GraphQLList(GraphQLString)}
          },
          async resolve(parent, args) {
            var concept = await Concept.findById(args.concept_id);
            concept.s3 = args.s3;
            concept.save();
            return concept;
          }
        }
    }
});

//Creating a new GraphQL Schema, with options query which defines query
//we will allow users to use when they are making request.
module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});
