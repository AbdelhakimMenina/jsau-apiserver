'use strict'

const request = require('supertest')
const {app, server} = require('../src/app')

afterAll(() => {
    server.close()
})

describe('API Endpoints', () => {

    it('should return welcome message on GET /', async() => {
        const res = await request(app).get('/')
        expect(res.statusCode).toBe(200)
        expect(res.text).toBe('Welcome to jsau-apiserver-1.0.0')
        expect(res.headers['cache-control']).toBe('no-store')
    })

    it('should return 404 for non-existent file on GET /documents/:file', async() => {
        const res = await request(app).get('/documents/nonexistentfile.html')
        expect(res.statusCode).toBe(404)
        expect(res.headers['cache-control']).toBe('no-store')
    })

    it('should download a file if it exists on GET /documents/:file', async() => {
        const res = await request(app).get('/documents/venezuela.html')
        expect(res.statusCode).toBe(200)
        expect(res.headers['cache-control']).toBe('no-store') // Check Cache-Control
    })

    it('should add a favorite on POST /favorites', async() => {
        const res = await request(app)
            .post('/favorites')
            .send({username: 'abdelhakim', filename: 'venezuela.html'})
            .set('Content-Type', 'application/json')
        expect(res.statusCode).toBe(201)
        expect(res.text).toContain('Le fichier a été ajouté.')
    })

    it('should return 400 for invalid input on POST /favorites', async() => {
        const res = await request(app)
            .post('/favorites')
            .send({username: '', filename: ''})
            .set('Content-Type', 'application/json')
        expect(res.statusCode).toBe(400)
    })

    it('should return 200 if the favorite already exists on POST /favorites', async() => {
        const res = await request(app)
            .post('/favorites')
            .send({username: 'abdelhakim', filename: 'venezuela.html'})
            .set('Content-Type', 'application/json')
        expect(res.statusCode).toBe(200)
        expect(res.text).toContain('Le fichier est déjà dans les favoris.')
    })

    it('should return 404 when trying to delete a non-existent favorite', async() => {
        const res = await request(app).delete('/favorites/999')
        expect(res.statusCode).toBe(404)
    })

    it('should delete an existing favorite on DELETE /favorites/:id', async() => {

        await request(app)
            .post('/favorites')
            .send({username: 'abdelhakim', filename: 'venezuela.html'})
            .set('Content-Type', 'application/json')

        const res = await request(app).delete('/favorites/1')
        expect(res.statusCode).toBe(200)
        expect(res.text).toContain('The File with ID 1 has been removed from favorites.')
    })

    it('should return 400 if no search text is provided on GET /search', async() => {
        const res = await request(app).get('/search')
        expect(res.statusCode).toBe(400)
    })

    it('should return 404 if the searched file does not exist on GET /search', async() => {
        const res = await request(app).get('/search?text=nonexistentfile')
        expect(res.statusCode).toBe(404)
    })

    it('should return the file if it exists on GET /search', async() => {

        const res = await request(app).get('/search?text=venezuela')
        expect(res.statusCode).toBe(200)
    })
})

