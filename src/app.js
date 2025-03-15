'use strict'

const {env} = require('node:process')
const express = require('express')
const app = express()
const port = 8080
const morgan = require('morgan')
const fs = require('fs').promises
const path = require('path')

const repositoryPath = env.JSAU_REPOSITORY_FILE_PATH

if (!repositoryPath) {
    console.error("La variable d'environnement JSAU_REPOSITORY_FILE_PATH n'est pas définie !")
}

const htmlPath = path.join(repositoryPath, 'html')
const jsonPath = path.join(repositoryPath, 'json')
const favoritesFile = path.join(jsonPath, 'favorites.json')

app.use(morgan('dev'))
app.use(express.json())

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    next()
})

app.get('/', (req, res) => {
    res.send('Welcome to jsau-apiserver-1.0.0')
})

// async-callback
app.use('/info', (req, res) => {
    const handleInfo = (callback) => {
        const appInfo = 'jsau-apiserver-1.0.0\n'
        callback(null, appInfo)
    }

    handleInfo((err, data) => {
        if (err) {
            res.sendStatus(500)
        } else {
            res.send(data)
        }
    })
})

// async-promise-then
app.get('/search', (req, res) => {
    const searchText = req.query.text

    if (!searchText) {
        return res.sendStatus(400)
    } else {
        const filepath = path.join(htmlPath, '/', searchText + '.html')

        fs.access(filepath)
            .then(() => {
                return res.sendFile(filepath)
            })
            .catch((err) => {
                if (err.code === 'ENOENT') {
                    res.sendStatus(404)
                } else {
                    res.sendStatus(500)
                }
            })
    }
})

function downloadFile(res, filepath, filename) {
    return new Promise((resolve, reject) => {
        res.download(filepath, filename, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve(`Le fichier ${filename} a bien été téléchargé.`)

            }
        })
    })
}

// async-promise-async-await
app.get('/documents', async(req, res) => {
    try {
        const files = await fs.readdir(htmlPath)
        return res.json({availableDocuments: files})
    } catch (err) {
        return res.sendStatus(500)
    }
})

// async-promise-async-await
app.get('/documents/:file', async(req, res) => {
    try {
        const fileName = req.params.file

        const filepath = path.join(htmlPath, fileName)
        await fs.access(filepath)
        await downloadFile(res, filepath, fileName)
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.sendStatus(404)
        } else {
            return res.sendStatus(500)
        }
    }
})

app.get('/favorites', async(req, res) => {
    try {
    // Lire le fichier favorites.json
        let favorites = []
        try {
            const data = await fs.readFile(favoritesFile, 'utf8')
            favorites = JSON.parse(data) // Parse les données JSON
        } catch (err) {
            if (err.code === 'ENOENT') {
                // Si le fichier n'existe pas, renvoyer un tableau vide
                favorites = []
            } else {
                throw err // Autres erreurs
            }
        }

        res.json(favorites) // Renvoyer les favoris au frontend
    } catch (error) {
        console.error('Erreur lors de la récupération des favoris :', error)
        res.sendStatus(500) // Erreur interne
    }
})

// async-promise-async-await
app.post('/favorites', async(req, res) => {
    const {username, filename} = req.body

    // Validation de l'entrée
    if (!filename || !username) {
        return res.sendStatus(400)
    }

    const htmlFilePath = path.join(htmlPath, filename)

    try {
        await fs.access(htmlFilePath)
        await fs.mkdir(jsonPath, {recursive: true})

        let favorites = []
        try {
            const data = await fs.readFile(favoritesFile, 'utf8')
            favorites = JSON.parse(data)
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err
            }
        }

        const exists = favorites.find(
            (fav) => fav.username === username && fav.filename === filename)

        if (!exists) {

            const newFavorite = {
                id : favorites.length + 1,
                username,
                filename,
            }

            favorites.push(newFavorite)
            await fs.writeFile(favoritesFile, JSON.stringify(favorites, null, 2), 'utf8')
            return res.status(201).send('Le fichier a été ajouté.\n')

        } else {
            return res.status(200).send('Le fichier est déjà dans les favoris.\n')
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.sendStatus(404)
        } else {
            return res.sendStatus(500)
        }
    }
})

// async-promise-async-await
app.delete('/favorites/:id', async(req, res) => {
    const id = parseInt(req.params.id, 10)
    try {
        const data = await fs.readFile(favoritesFile, 'utf-8')
        const favorites = JSON.parse(data)

        const favoriteIndex = favorites.findIndex(fav => fav.id === id)
        if (favoriteIndex !== -1) {
            favorites.splice(favoriteIndex, 1)
            await fs.writeFile(favoritesFile, JSON.stringify(favorites, null, 2), 'utf-8')
            return res.status(200).send(`The File with ID ${id} has been removed from favorites.\n`)
        } else {
            return res.sendStatus(404)
        }
    } catch (error) {
        return res.sendStatus(500)
    }
})

const server = app.listen(port, () => {
    console.log(`This apiserver is listening on port ${port}`)
})

module.exports = {app, server}

