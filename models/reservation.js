/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  set notes(val) {
    this._notes = val || "";
  }

  get notes() {
    return this._notes;
  }

  get numGuests() {
    return this._numGuests;
  }

  // prevents entry of invalid str even if notes set in constructor. 
  set numGuests(num) {
    if (num < 1) throw new Error('Must have at least 1 guest!');
    this._numGuests = num;
  }

  set startAt(val) {
    if (val instanceof Date && !isNaN(val)) this._startAt = val;
    else throw new Error("Not a valid startAt.");
  }

  get startAt() {
    return this._startAt;
  }

  set customerId(val) {
    if (this._customerId && this._customerId !== val)
      throw new Error("Cannot change customer ID");
    this._customerId = val;
  }

  get customerId() {
    return this._customerId;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations SET customer_id=$1, num_guests=$2, start_at=$3, notes=$4
             WHERE id=$5`,
        [this.customerId, this.numGuests, this.startAt, this.notes, this.id]
      );
    }
  }

  static async getById(id) {
    const result = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`No such reservation: ${id}`, 404);
    }

    const r = result.rows[0]
    const reservation = new Reservation(r)
    return reservation
  }


  async delete() {
    await db.query(`
    DELETE FROM reservations
    WHERE id=$1`, [this.id])
  }

  async editReservation(numGuests, startAt, notes){
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
    await this.save()
  }
}


module.exports = Reservation;
