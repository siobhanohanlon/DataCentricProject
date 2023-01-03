const express = require('express')
const app = express()
const port = 3000 //Localhost:*port* to view
const mongoose = require("mongoose");

var ejs = require('ejs');
var bodyParser = require('body-parser')
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }))

//Import Databases
var mySqlDAO = require(__dirname + '/mySql_DAO');
var mongoDBDAO = require(__dirname + '/mongoDB_DAO');

//Home Page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/home.html')
})

//--------------------------------------------------------------------------------------------------------------------------------

//Employee Page
app.get('/employees', (req, res) => {
    mySqlDAO.getEmployees()
        .then((list) => {
            res.render('employees', { employeeData: list })
        })
        .catch((error) => {
            if (error.errorno == 1146) {
                res.send("Table Error!!: " + error.sqlMessage)
            }
            else (
                res.send("Error!!: " + error)
            )
        })
})

//Find Employee to update by :eid
app.get('/employees/edit/:eid', (req, res) => {
    mySqlDAO.updateEmp(req.params.eid)
        .then((listNew) => {
            res.render('editEmpSQL', { updateEmp: listNew, errors: undefined })
        })
        .catch((error) => {
            if (error.errorno == 1146) {
                res.send("Table Error!!: " + error.sqlMessage)
            }
            else (
                res.send("Error!!: " + error)
            )
        })
})

//Updates Database with Edited Employee
app.post('/employees/edit/:eid', (req, res) => {
    mySqlDAO.updateEmpData(req.body.eid, req.body.ename, req.body.role, req.body.salary)
        .then((list) => {
            res.redirect("/employees")
        })
        .catch((error) => {
            console.log(error)
        })
})

//--------------------------------------------------------------------------------------------------------------------------------

//Departments Page
app.get('/departments', (req, res) => {
    mySqlDAO.getEmpDept()
        .then((list) => {
            res.render('departments', { depList: list })
        })
        .catch((error) => {
            res.send(error)
        })
})

//Delete Department
app.get('/department/delete/:did', (req, res) => {
    mySqlDAO.deleteDept(req.params.did)
        .then((list) => {
            //Checks if Id rows are affected and if Dept has been deleted from SQL
            if (list.affectedRows == 0) {
                res.send("<h1> Department: " + req.params.did + " Can not be Deleted!, for an unknown reason</h1>" + "<a href='/'>Home</a>")
            } else {
                res.send("<h1> Department: " + req.params.did + " Deleted.</h1>" + "<a href='/'>Home</a>")
            }
        })
        .catch((error) => {
            if (error.code == "ER_ROW_IS_REFERENCED_2") {
                res.send("<h2>Department: " + req.params.did + " Can not be Deleted!, as it has an employee.</h2>" + "<a href='/'>Home</a>")
            }
        })
})

//--------------------------------------------------------------------------------------------------------------------------------

//Employees MongoDB Page
app.get('/employeesMongoDB', (req, res) => {
    mongoDBDAO.getMongoDBEmp()
    .then((list) => {
        res.render('empMongoDB', { mongoDBList: list })
    })
    .catch(() => {
        res.send('error')
    })
})

//Add Employee to MongoDB
app.get('/employeesMongoDB/add', (req, res) => {
    res.render("addEmpMongoDB")
})

//Updates Collection after user is finished
app.post('/employeesMongoDB/add', (req, res) => {
    //Checks if employee exists in Mongo Database
    mySqlDAO.checkEmployeeID(req.body._id).then((result) => {
        if (result[0] != null) {
            //Adds employee to mongoDB
            mongoDBDAO.addEmployees(req.body._id, req.body.phone, req.body.email)
            .then((d) => {
                res.redirect("/employeesMongoDB")
            })
            .catch((error) => {
                if (error.message.includes("11000")) {
                    res.send("<h1>_ID: " + req.body._id + " already exists</h1>" + "<a href='/'>Home</a>")
                } else {
                    res.send(error.message)
                }
            })
        }else{
            res.send("<h1>Employee: " + req.body._id + " isn't in mySQL Database</h1>" + "<a href='/'>Home</a>")
        }
    })
    .catch((error) => {
        console.log(error)
    })
})

//--------------------------------------------------------------------------------------------------------------------------------

//Port listening on
app.listen(port, () => {
    console.log("Listening on port: " + port)
})