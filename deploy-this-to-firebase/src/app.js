const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const { mysql } = require('./sql')
const dateFormat = require('dateformat')

const app = express()
const {

  Table,
  SimpleResponse,
  Suggestions,
  Permission
} = require('actions-on-google')

app.get('/', (req, res) => res.send('online'))
app.post('/dialogflow', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })
  let capabilities = {}
  function addResponse (response) {
    let conv = agent.conv()
    agent.add(conv.ask.apply(conv, arguments))
  }
  function hasCapability (capability) {
    let surface = agent.originalRequest.payload.surface
    if (!capabilities.length) {
      for (let i = 0; i < surface.capabilities.length; i++) {
        capabilities[surface.capabilities[i].name] = surface.capabilities[i]
      }
    }

    return capabilities[capability] || false
  }
  function getContextByName (name) {
    for (let i = 0; i < agent.contexts.length; i++) {
      if (agent.contexts[i].name === name) {
        return agent.contexts[i]
      }
    }
    return {}
  }

  function askForPermission () {
    addResponse(
      new Permission({
        context: 'To greet you personally',
        permissions: ['NAME', 'EMAIL']
      })
    )
  }

  function getUserInfo (category, index) {
    let userInfo = false
    // console.log(agent.conv().user.storage)
    let info = agent.conv().user.storage.userInfo
    if (info && info.profile && info.profile.email) {
      userInfo = index
        ? info[category] ? info[category][index] : false
        : info[category]
    }
    return userInfo
  }

  function askExpenseOptions () {
    addResponse(
      new SimpleResponse(
        `So what do you want to do ${getUserInfo('profile', 'givenName')} ?`
      ),
      new Suggestions('Show all expenses?', 'Search for an expense?')
    )
  }

  function intentWelcome () {
    let givenName = getUserInfo('profile', 'givenName')
    if (givenName) {
      askExpenseOptions()
    } else {
      askForPermission()
    }
  }

  function intentShowAllExpenses () {
    displayExpenses()
  }

  function intentSearchInExpenses () {
    let expenseId = agent.parameters.expense_id
      ? Number(agent.parameters.expense_id)
      : 0
    if (expenseId) {
      displayExpenses(expenseId)
      // addResponse(
      //  'You want to check status of Expense id: ' + expenseId + '?'
      // )
    } else {
      addResponse(
        "<speak>Please enter Expense <say-as interpret-as='characters'>id</say-as> </speak>"
      )
    }
  }

  function intentNoInput () {
    let conv = agent.conv()
    const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'))
    if (repromptCount === 0) {
      conv.ask(`What was that?`)
    } else if (repromptCount === 1) {
      conv.ask(`Sorry I didn't catch that. Could you repeat yourself?`)
    } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
      conv.close(`Okay let's try this again later.`)
    }
  }

  function noExpensesYet () {
    addResponse('You did not submit any expenses yet')
  }
  function speakDate (date) {
    return `<say-as interpret-as='date' format='yyyymmdd' detail='1'>${date}</say-as>`
  }

  function prepareExpenses (expenseIds) {
    let preparedExpenses = []
    expenseIds =
      expenseIds instanceof Array ? expenseIds : expenseIds ? [expenseIds] : []

    let employee = getUserInfo('profile', 'email')
    if (!employee) {
      return preparedExpenses
    } else {
      let expenses = mysql.getExpenses(
        employee,
        expenseIds && expenseIds.length ? expenseIds : []
      )
      if (!expenses || !expenses.length) {
        return preparedExpenses
      } else {
        for (let i = 0; i < expenses.length; i++) {
          preparedExpenses.push({
            id: '' + expenses[i].id + '',
            amount: '' + expenses[i].amount + '',
            submittedOn: dateFormat(expenses[i].submited_on, 'yyyy-m-d'),
            approvedOn: dateFormat(
              expenses[i].approved_on || expenses[i].submited_on,
              'yyyy-m-d'
            ),
            status: expenses[i].status,
            statusText:
              expenses[i].status === 'approved'
                ? `has been approved`
                : `is still pending`
          })
        }
        return preparedExpenses
      }
    }
  }

  function displayExpenses (expenseIds) {
    let expensesData = prepareExpenses(expenseIds)
    if (!expensesData.length) {
      noExpensesYet()
    } else {
      let capability = hasCapability('actions.capability.SCREEN_OUTPUT')
      console.log(capability)
      if (capability) {
        // renderExpensesForScreen(expensesData);
        renderExpensesForScreenClients(expensesData)
      } else {
        renderExpensesForNonScreenClients(expensesData)
      }
    }
  }
  function renderExpensesForScreenClients (expensesData) {
    let tableData = { title: `Found ${expensesData.length} items`,
      dividers: true,
      columns: ['Id', 'Amount', 'Submited On', 'Status'],
      rows: [] }

    for (let i = 0; i < expensesData.length; i++) {
      tableData.rows.push({
        cells: [
          expensesData[i].id + ' ',
          expensesData[i].amount,
          expensesData[i].submittedOn,
          expensesData[i].status === 'approved'
            ? `approved on ` + expensesData[i].approvedOn
            : 'pending'
        ],
        dividerAfter: true
      })
    }
    //  console.log(tableData)
    addResponse(
      new SimpleResponse(`Here are your results`),
      new Table(tableData)
    )
  }
  function renderExpensesForNonScreenClients (expensesData) {
    let message = []
    for (let i = 0; i < expensesData.length; i++) {
      message.push(
        `Expense <say-as interpret-as='characters'>id</say-as>${expensesData[i]
          .id}`
      )
      message.push(
        `for amount <say-as interpret-as='cardinal'>${expensesData[i]
          .amount}</say-as>`
      )
      message.push('submited on ' + speakDate(expensesData[i].submittedOn))
      message.push(expensesData[i].statusText)

      if (expensesData[i].status === 'approved') {
        let approvalDate =
          expensesData[i].approvedOn || expensesData[i].submittedOn
        if (approvalDate) {
          message.push(`on ` + speakDate(expensesData[i].approvedOn))
        }
      }
      message.push(`<break time='1' />`)
    }
    addResponse(
      '<speak>' + message.join(' ') + '  </speak>',
      new Suggestions('Show all expenses?', 'Search for an expense?')
    )
  }

  function parseExpenseIds () {
    let context = getContextByName('search_in_expenses-followup')
    // console.log(context)
    let expenseIds = []
    if (context && context.parameters) {
      expenseIds = context.parameters
    } else {
      expenseIds = agent.parameters
    }
    expenseIds =
      expenseIds.expense_id && expenseIds.expense_id.length
        ? expenseIds.expense_id
        : expenseIds['number-integer']

    expenseIds =
      expenseIds instanceof Array ? expenseIds : expenseIds ? [expenseIds] : []

    return expenseIds.filter(n => Number(n))
  }
  function intentDoSearchInExpenses () {
    let expenseIds = parseExpenseIds(parseExpenseIds)
    // console.log('intentDoSearchInExpenses')

    console.log(expenseIds)
    if (!expenseIds || !expenseIds.length) {
      addResponse(
        "<speak>Please enter Expense <say-as interpret-as='characters'>id</say-as> </speak>"
      )
    } else {
      displayExpenses(expenseIds)
    }
    // expenseId
  }

  function intentGetPermission () {
    let conv = agent.conv()
    // console.log(conv.user.raw.profile)
    if (conv.user.raw.profile && conv.user.raw.profile.email) {
      conv.user.storage.userInfo = {
        profile: conv.user.raw.profile
      }
      conv.ask(
        new SimpleResponse(
          `So what do you want to do ${conv.user.raw.profile.givenName} ?`
        ),
        new Suggestions('Show all expenses?', 'Search for an expense?')
      )
      agent.add(conv)
    } else {
      // console.log('there')
      askForPermission()
    }
  }

  function intentNoDoSearchInExpenses () {
    askExpenseOptions()
  }
  /*
  function permission () {
    agent.add(`Hi `)
  }
*/
  function intentFallBack () {
    addResponse(
      new SimpleResponse('Sorry I did not get that '),
      new Suggestions('Show all expenses?', 'Search for an expense?')
    )
  }

  function intentImplicit () {


    intentDoSearchInExpenses()
  }
  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', intentWelcome)
  intentMap.set('show_all_expenses', intentShowAllExpenses)
  intentMap.set('search_in_expenses', intentSearchInExpenses)
  intentMap.set('do_search_in_expenses', intentDoSearchInExpenses)
  intentMap.set('search_in_expenses - yes', intentDoSearchInExpenses)
  intentMap.set('search_in_expenses - no', intentNoDoSearchInExpenses)
  intentMap.set('no_input', intentNoInput)
  intentMap.set('Default Fallback Intent', intentFallBack)
  intentMap.set('implicit', intentImplicit)

  intentMap.set('get_permission', intentGetPermission)

  agent.handleRequest(intentMap)
})

module.exports = app
