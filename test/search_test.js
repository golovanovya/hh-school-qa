require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const expect = chai.expect;
const should = chai.should();

const token = process.env.TOKEN;
const baseUrl = 'https://api.hh.ru';

const makeRequest = () => chai.request(baseUrl)
    .get('/vacancies')
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json');

describe('credentials', () => {
    it('token exists', () => {
        should.exist(token, "please add TOKEN to environments");
        expect(token).to.be.a('string');
    });
});

describe(baseUrl, () => {
    describe('/vacancies', () => {
        describe('search field', () => {
            it('wrong request', () => {
                chai.request(baseUrl)
                    .get('/vacanciess')
                    .query({text: 'test'})
                    .end((err, res) => {
                        expect(err).to.be.null;
                        expect(res).to.have.status(404);
                    })
            });
            it('sql injection', () => {
                makeRequest().query({text: "java'--' AND 1=2"})
                    .end((err, res) => {
                        expect(err).to.be.null;
                        res.should.to.have.status(200)
                            .to.be.json;
                        res.body.items.should.be.a('array')
                            .to.have.lengthOf.above(0);
                    });
            });
            const assertions = [
                ['frontend разработчик', [/frontend/gmi, /разраб/gmi]],
                ['"frontend разработчик"', [/frontend.?разработчик/gmi]],
                ['!разработчика', [/разработчика/gmi]],
                ['NAME:(python OR java) and COMPANY_NAME:Headhunter', [/Java developer/gmi]],
            ];
            assertions.forEach(([text, expectation]) => {
                it(text, () => {
                    makeRequest().query({text: text})
                        .end((err, res) => {
                            expect(err).to.be.null;
                            res.should.to.have.status(200)
                                .to.be.json;
                            res.body.items.should.be.a('array')
                                .to.have.lengthOf.above(0);
                            const bodyString = JSON.stringify(res.body.items);
                            expectation.forEach(exp => {
                                expect(bodyString).to.match(exp);
                            })
                        });
                });
            });
        });
    });
});
