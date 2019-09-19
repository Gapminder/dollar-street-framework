import 'mocha';
import * as request from 'supertest';
import * as chai from 'chai';
import { credentialsService } from '../../../common/credential.service';

const nconf = credentialsService.loadCredentials('../');
const API_URL = nconf.get('API_URL');
const expect = chai.expect;

describe('GET /healthz', function() {
  it('responds with Instance of pages is alive', function(done) {
    request(API_URL)
      .get('/healthz')
      .expect((response) => {
        expect(response.body.success).true;
        expect(response.body.message).to.equal('Instance of pages is alive');
        expect(response.statusCode).to.equal(200);
      })
      .end(function(err) {
        if (err) return done(err);
        done();
      });
  });
});
