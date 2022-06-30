const { response } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid')
const app = express();

app.use(express.json())

const mockedCustomers = [];
const accountResource = '/account'
const statementResource = '/statement'
const depositResource = '/deposit'
const withdrawResource = '/withdraw'


function verifyIfExistsAccountCPF(req, res, next) {
  const { cpf } = req.headers;

  const foundCustomer = mockedCustomers.find(customer => customer.cpf === cpf);
  if(!foundCustomer) return res.status(404).json({
    message: 'Customer not found'
  });

  req.customer = foundCustomer;

  return next();
}

function getBalance(statement) {
  return statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount;
    }
    if(operation.type === 'debit') {
      return acc - operation.amount;
    }
    return acc;
  }, 0)
}

app.post(accountResource, (req, res) => {
  try {
    const { cpf, name } = req.body;

    const customerAlreadyExists = mockedCustomers.some(customer => customer.cpf === cpf)

    if(customerAlreadyExists) throw new Error('Customer already exists');

    const newCustomer = {
      id: uuidv4(),
      cpf,
      name,
      statement: []
    }

    mockedCustomers.push(newCustomer)

    res.status(201).json(newCustomer)
  } catch (error) {
    res.status(409).json({
      message: error.message
    })
  }
})

app.get(statementResource, verifyIfExistsAccountCPF, (req, res) => {
  return res.json(req.customer.statement)
})

app.post(depositResource, verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation)

  return res.status(201).json(customer)
})

app.post(withdrawResource, verifyIfExistsAccountCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if(balance < amount) {
    return res.status(400).json({ message: 'Insufficient funds!'})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  };

  customer.statement.push(statementOperation)

  return res.status(201).json(statementOperation)
})

app.get(`${statementResource}/date`, verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;
  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    statement => 
      statement.created_at.toDateString() === 
      new Date(dateFormat).toDateString())

  return res.json(statement)
})

app.put(accountResource, verifyIfExistsAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return res.status(201).send(customer)
})

app.get(accountResource, verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer);
})

app.delete(accountResource, verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  mockedCustomers.splice(customer, 1)
  return res.status(200).json(mockedCustomers)
})

app.listen(3333, () => console.log('server running...'))