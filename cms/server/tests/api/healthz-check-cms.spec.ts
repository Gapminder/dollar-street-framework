import 'mocha';
import * as request from 'supertest';
import * as chai from 'chai';

const expect = chai.expect;

// TODO: Remove skip after adding URL from config
describe('GET /healthz', () => {
  it('responds with Instance of CMS is alive', (done) => {
    request('http://localhost:8080') // TODO: remove hardcode URL
      .get('/healthz')
      .expect((response) => {
        // tslint:disable-next-line:no-unused-expression
        expect(response.body.success).true;
        expect(response.body.message).to.equal('Instance of CMS is alive');
        expect(response.statusCode).to.equal(200);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        done();
      });
  });
});
