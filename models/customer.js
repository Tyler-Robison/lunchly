/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  get notes() {
    if (this._notes.length < 10) console.log('short notes')
    return this._notes;
  }

  // prevents entry of invalid str even if notes set in constructor. 
  set notes(str) {
    if (!str) str = ''
    this._notes = str
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async getCustomer(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  // Why wouldn't we have id?????
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  fullName() {
    const fullName = `${this.firstName} ${this.lastName}`
    return fullName
  }

  static async getIdByName(custName) {
    const nameArr = custName.split(' ');
    const firstName = nameArr[0];
    const lastName = nameArr[1];
    const result = await db.query(`
    SELECT id FROM customers
    WHERE first_name = $1 AND last_name=$2`, [firstName, lastName])
    
    if (result.rows.length === 0) {
      const err = new Error(`Please enter valid first/last name.`);
      err.status = 404;
      throw err;
    }

    return result.rows[0].id
  }

  static async getBestCustomers() {
    const result = await db.query(`SELECT customers.id, first_name, last_name, Count(*) AS num_reservations 
    FROM reservations
    JOIN customers ON customers.id = reservations.customer_id
    GROUP BY customer_id, first_name, last_name, customers.id
    ORDER BY num_reservations desc 
    LIMIT 10`)
    return result.rows
  }

}

module.exports = Customer;
