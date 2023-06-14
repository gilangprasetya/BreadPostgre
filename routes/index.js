var express = require('express');
var router = express.Router();
var moment = require('moment')

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
module.exports = function (db) {

  router.get('/', (req, res) => {
    const url = req.url == '/' ? '/?page=1' : req.url
    const page = req.query.page || 1
    const limit = 3
    const offset = (page - 1) * limit

    let sqlcount = `SELECT COUNT(*) FROM data`
    const params = []
    const sqlsearch = []

    if (req.query.id && req.query.checkboxID) {
      params.push(req.query.id)
      sqlsearch.push(`id = $${params.length}`)
    }

    if (req.query.string && req.query.checkboxString) {
      params.push(`%${req.query.string}%`)
      sqlsearch.push(`string ILIKE $${params.length}`)
    }

    if (req.query.integer && req.query.checkboxInteger) {
      params.push(req.query.integer)
      sqlsearch.push(`integer = $${params.length}`)
    }

    if (req.query.float && req.query.checkboxFloat) {
      params.push(req.query.float)
      sqlsearch.push(`float = $${params.length}`)
    }

    if (req.query.startDate && req.query.endDate && req.query.checkboxDate) {
      params.push(req.query.startDate)
      params.push(req.query.endDate)
      sqlsearch.push(`tanggal BETWEEN $${params.length - 1} AND $${params.length}`)
    }

    if (req.query.boolean && req.query.checkboxBoolean) {
      params.push(req.query.boolean)
      sqlsearch.push(`boolean = $${params.length}`)
    }

    if (params.length > 0) {
      sqlcount += ` WHERE ${sqlsearch.join(' AND ')}`
    }

    db.query(sqlcount, params, (err, data) => {
      const pages = Math.ceil(data.rows[0].count / limit)
      sql = `SELECT * FROM data`
      if (params.length > 0) {
        sql += ` WHERE ${sqlsearch.join(' AND ')}`
      }
      let sortOrder = req.query.sortOrder || 'asc';
      let sortBy = req.query.sortBy || 'id';
      if(sortOrder == 'asc'){
        sortOrder = 'asc'
      }else{
        sortOrder = 'desc'
      }
      sql+= ` ORDER BY ${sortBy} ${sortOrder}`
      params.push(limit, offset)
      sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`

      db.query(sql, params, (err, data) => {
        res.render('index', { data: data.rows, pages, page, offset, query: req.query, url, moment, sortBy: sortBy, sortOrder: sortOrder })
      })
    })
  })


  router.get('/add', (req, res) => {
    res.render('add')
  })

  router.post('/add', (req, res) => {
    const sqltambah = `INSERT INTO data (string, integer, float, tanggal, boolean) VALUES ($1,$2,$3,$4,$5)`;
    const params = [req.body.string, req.body.integer, req.body.float, req.body.date, req.body.boolean];

    db.query(sqltambah, params, (err) => {
      if (err) {
        console.error(err.message);
      } else {
        res.redirect('/');
      }
    });
  });


  router.get('/delete/:id', (req, res) => {
    const sqlhapus = `DELETE FROM data WHERE id = $1`
    const id = req.params.id
    db.query(sqlhapus, [id], err => {
      if (err) {
        console.error(err.message)
      } else {
        res.redirect('/')
      }
    })
  })

  router.get('/edit/:id', (req, res) => {
    const sqledit = `SELECT * FROM data WHERE id = $1`
    const id = req.params.id
    db.query(sqledit, [id], (err, data) => {
      if (err) {
        console.error(err.message)
      } else {
        res.render('edit', { data: data.rows[0], moment })
        console.log(data.rows[0])
      }
    })
  })

  router.post('/edit/:id', (req, res) => {
    const sqlupdate = `UPDATE data SET string = $1, integer = $2, float = $3, tanggal = $4, boolean = $5 WHERE id = $6`
    const id = req.params.id
    db.query(sqlupdate, [req.body.string, req.body.integer, req.body.float, req.body.date ? req.body.date : "kosong", req.body.boolean, id], (err, data) => {
      if (err) {
        console.error(err.message)
      } else {
        res.redirect('/')
      }
    })
  })

  return router;
}