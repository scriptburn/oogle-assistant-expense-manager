var MySql = require('sync-mysql')

const functions = require('firebase-functions')

let connection
let mysqlConfig

let appEnv =
  process.env.APP_ENV === 'local'
    ? process.env.APP_ENV
    : functions.config().expense_tracker.app_env

// console.log(appEnv)
if (appEnv === 'local') {
  mysqlConfig = {
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  }
} else {
  mysqlConfig = { socketPath: `/cloudsql/${functions.config().expense_tracker.db_socket}`, user: functions.config().expense_tracker.db_user, password: functions.config().expense_tracker.db_pass, database: functions.config().expense_tracker.db_name }
}
// console.log(mysqlConfig)
// console.log(functions.config())
let mysql = {
  employees: {},
  expenses: [],
  getPool: () => {
    if (!connection) {
      connection = new MySql(mysqlConfig)
    }
    return connection
  },
  getExpenses: (email, id) => {
    let result = []
    // if (!mysql.expenses.length) {
    let employee = mysql.getEmployee(email)
    if (employee) {
      let postfix = []
      // console.log(employee)
      if (employee['role'] !== 'admin') {
        console.log('--' + employee['role'] + '--')
        postfix.push(`b.email = '${email}'`)
      }
      // console.log(id)
      if (id && id.length) {
        postfix.push('a.id in ("' + id.join('","') + '")')
      }

      let sql =
        'select a.* from expenses a inner join employees b on b.id = a.emp_id  ' +
        (postfix.length ? 'where ' + postfix.join(' and ') : '') +
        ' order by a.status,a.id desc'
      // console.log(sql)
      result = mysql.getPool().query(sql)
    }

    // if (result) {
    //  mysql.expenses = result
    // }
    // }

    return result
  },
  getEmployee: email => {
    if (!mysql.employees[email]) {
      let sql = `SELECT * from employees where email='${email}'`
      let result = mysql.getPool().query(sql)
      if (result) {
        mysql.employees[email] = result[0]
      } else {
        mysql.employees[email] = {}
      }
    }
    return mysql.employees[email]
  }
}
exports.mysql = mysql
