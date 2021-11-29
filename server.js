/** Start server for Lunchly. */

const app = require("./app");

app.listen(3000, function() {
  console.log("listening on 3000");
});


// return new Reservation(r.id, r.customer_id, r.num_guests, r.starts_at, r.notes)
