const express = require('express');
const { v4: uuidv4 } = require('uuid')
const app = express();

app.use(express.json())

const mockedCustomers = [];
const accountResource = '/account'

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement - []
 */
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

app.listen(3333, () => console.log('server running...'))