/** Routes for Lunchly */

const express = require("express");

const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  try {
    const customers = await Customer.all();
    return res.render("customer_list.html", { customers });
  } catch (err) {
    return next(err);
  }
});

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  try {
    return res.render("customer_new_form.html");
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  try {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const phone = req.body.phone;
    const notes = req.body.notes;

    const customer = new Customer({ firstName, lastName, phone, notes});
    // customer.notes = notes
    await customer.save();

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  try {
    const customer = await Customer.getCustomer(req.params.id);
    const reservations = await customer.getReservations();

    return res.render("customer_detail.html", { customer, reservations });
  } catch (err) {
    return next(err);
  }
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  try {
    const customer = await Customer.getCustomer(req.params.id);

    res.render("customer_edit_form.html", { customer });
  } catch (err) {
    return next(err);
  }
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  try {
    const customer = await Customer.getCustomer(req.params.id);
    customer.firstName = req.body.firstName;
    customer.lastName = req.body.lastName;
    customer.phone = req.body.phone;
    customer.notes = req.body.notes;
    await customer.save();

    return res.redirect(`/${customer.id}/`);
  } catch (err) {
    return next(err);
  }
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  try {
    const customerId = req.params.id;
    const startAt = (req.body.startAt === '' ? new Date() : req.body.startAt)
    const numGuests = req.body.numGuests;
    const notes = req.body.notes;

    const reservation = new Reservation({
      customerId,
      startAt,
      numGuests,
      notes
    });
    await reservation.save();

    return res.redirect(`/${customerId}/`);
  } catch (err) {
    return next(err);
  }
});

// Handle deleting a reservation
// has to be post b/c forms can't send DELETE
router.post('/:resId/:custId/delete-reservation/', async (req, res, next) => {
  try {
    const { custId, resId } = req.params
    const reservation = await Reservation.getById(resId)
    await reservation.delete()
    return res.redirect(`/${custId}/`);
  } catch (err) {
    return next(err)
  }
})

// display form for editing reservation
router.get('/:resId/:custId/edit-reservation/', async (req, res, next) => {
  try {
    const { resId, custId } = req.params;
    const reservation = await Reservation.getById(resId);
    const customer = await Customer.getCustomer(custId);

    res.render("reservation_edit_form.html", { reservation, customer });
  } catch (err) {
    return next(err)
  }
})

router.post('/:resId/:custId/edit-reservation/', async (req, res, next) => {
  try {
    const { custId, resId } = req.params
    const reservation = await Reservation.getById(resId)

    const { numGuests, startAt, notes } = req.body;
    await reservation.editReservation(numGuests, startAt, notes)
    return res.redirect(`/${custId}/`);
  } catch (err) {
    return next(err)
  }
})

// route for processing first/last entered into search bar.
router.post('/customer-search', async (req, res, next) => {
  try {
    const { custName } = req.body
    const custId = await Customer.getIdByName(custName)
    
    return res.redirect(`/${custId}/`);
  } catch (err) {
    return next(err)
  }
})

// not working b/c thinks best-customers is an id
// one above works b/c post so doesn't conflict with /:id
// gets list of 10 customers with most reservations
router.get('/customers/best-customers', async (req, res, next) => {
  try {
    const bestCustomers = await Customer.getBestCustomers()
    
    res.render("best_customers.html", { bestCustomers });
  } catch(err){
    return next(err)
  }
})




module.exports = router;
