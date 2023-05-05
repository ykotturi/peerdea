/*
const assert = require('assert');
const Group = require('../src/group');
const Concept = require('../src/concept');
var fs = require('fs');
const path = require("path");

describe('Concept test', () => {

	var group = new Group({
				name: 'secret'
			});
	var concept;
	var wrongConcept;


	describe('Testing concepts', () => {
		it('Creates a concept', (done) => {
			concept = new Concept({
				group_id: group._id,
				name: 'secret',
				media: [],
				description: 'test',
			});
			var temp = {};
			temp.data = fs.readFileSync(path.join(__dirname, 'noimage.png'));
    		temp.contentType = 'image/png';
    		concept.media.push(temp);
			assert(concept != null);
			concept.save()
				.then(() => {
					assert(!concept.isNew);
					done();
				});
		});

		it('Removes a concept', (done) => {
			concept.remove()
				.then(() => Concept.findOne({_id: concept._id}))
				.then((res) => {
					if (res === null) {done();}
					else {throw new Error('Should remove concept');}
				})
		});

		it('Does not save a concept with the incorrect fields', (done) => {
			wrongConcept = new Concept({
				test: 'test'
			});

			wrongConcept.validate(err => {
				if (err) {
					return done();
				}
				else {
					throw new Error('Should generate error!');
				}
			});
		});

		it('Does not save a concept with missing fields', (done) => {
			wrongConcept = new Concept({
				name: 'secret'
			});

			wrongConcept.validate(err => {
				if (err) {
					return done();
				}
				else {
					throw new Error('Should generate error!');
				}
			});
		});
	});
});
*/
