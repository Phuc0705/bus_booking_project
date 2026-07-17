import { db } from "./db.js";

async function initTables() {
  console.log("Initializing tables...");

  try {
    // Drop old table if exists
    await db.schema.dropTableIfExists("trips");
    await db.schema.dropTableIfExists("buses");
    await db.schema.dropTableIfExists("routes");

    // Create routes
    await db.schema.createTable("routes", (table) => {
      table.uuid("id").primary().defaultTo(db.fn.uuid());
      table.string("origin").notNullable();
      table.string("destination").notNullable();
      table.integer("distance_km").notNullable();
      table.decimal("estimated_hours", 4, 1).notNullable();
      table.timestamp("created_at").defaultTo(db.fn.now());
    });
    console.log("Table 'routes' created.");

    // Create buses
    await db.schema.createTable("buses", (table) => {
      table.uuid("id").primary().defaultTo(db.fn.uuid());
      table.string("license_plate").notNullable().unique();
      table.string("bus_house").notNullable();
      table.string("bus_type").notNullable();
      table.integer("total_seats").notNullable();
      table.timestamp("created_at").defaultTo(db.fn.now());
    });
    console.log("Table 'buses' created.");

    // Create trips
    await db.schema.createTable("trips", (table) => {
      table.uuid("id").primary().defaultTo(db.fn.uuid());
      table.uuid("route_id").references("id").inTable("routes").onDelete("CASCADE");
      table.uuid("bus_id").references("id").inTable("buses").onDelete("CASCADE");
      table.timestamp("departure_time").notNullable();
      table.timestamp("arrival_time").notNullable();
      table.integer("price").notNullable();
      table.jsonb("pickup_points");
      table.jsonb("dropoff_points");
      table.string("status").defaultTo("ACTIVE"); // ACTIVE, LOCKED, DEPARTED, COMPLETED
      table.timestamp("created_at").defaultTo(db.fn.now());
    });
    console.log("Table 'trips' created.");

    // Seed Data
    console.log("Seeding data...");
    const [route1] = await db("routes").insert({
      origin: "Hà Nội", destination: "Sapa", distance_km: 300, estimated_hours: 6.0
    }).returning("id");
    const [route2] = await db("routes").insert({
      origin: "TP.HCM", destination: "Đà Lạt", distance_km: 300, estimated_hours: 8.0
    }).returning("id");
    const [route3] = await db("routes").insert({
      origin: "Đà Nẵng", destination: "Huế", distance_km: 100, estimated_hours: 3.0
    }).returning("id");

    const [bus1] = await db("buses").insert({
      license_plate: "29B-12345", bus_house: "Sao Việt", bus_type: "Giường nằm 40 chỗ", total_seats: 40
    }).returning("id");
    const [bus2] = await db("buses").insert({
      license_plate: "51B-54321", bus_house: "Phương Trang", bus_type: "Giường nằm 34 chỗ", total_seats: 34
    }).returning("id");
    const [bus3] = await db("buses").insert({
      license_plate: "43B-98765", bus_house: "Hoàng Long", bus_type: "Ghế ngồi 20 chỗ", total_seats: 20
    }).returning("id");

    const t1 = new Date(); t1.setDate(t1.getDate() + 1); t1.setHours(22, 0, 0, 0);
    const t2 = new Date(t1); t2.setHours(t2.getHours() + 6);
    
    const t3 = new Date(); t3.setDate(t3.getDate() + 2); t3.setHours(23, 30, 0, 0);
    const t4 = new Date(t3); t4.setHours(t4.getHours() + 8);
    
    const t5 = new Date(); t5.setDate(t5.getDate() + 3); t5.setHours(8, 0, 0, 0);
    const t6 = new Date(t5); t6.setHours(t6.getHours() + 3);

    await db("trips").insert([
      {
        route_id: route1.id, bus_id: bus1.id, departure_time: t1, arrival_time: t2, price: 350000,
        pickup_points: JSON.stringify(["Bến xe Mỹ Đình", "Bến xe Nước Ngầm", "Sân bay Nội Bài"]),
        dropoff_points: JSON.stringify(["Bến xe Sapa", "Thị trấn Sapa"])
      },
      {
        route_id: route2.id, bus_id: bus2.id, departure_time: t3, arrival_time: t4, price: 300000,
        pickup_points: JSON.stringify(["Bến xe Miền Đông", "Ngã tư Hàng Xanh", "Suối Tiên"]),
        dropoff_points: JSON.stringify(["Bến xe Liên tỉnh Đà Lạt", "Chợ Đà Lạt"])
      },
      {
        route_id: route3.id, bus_id: bus3.id, departure_time: t5, arrival_time: t6, price: 150000,
        pickup_points: JSON.stringify(["Bến xe trung tâm Đà Nẵng", "Ngã ba Huế"]),
        dropoff_points: JSON.stringify(["Bến xe phía Nam Huế", "Trung tâm Huế"])
      }
    ]);
    console.log("Seeding complete!");

    console.log("Initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing tables:", error);
    process.exit(1);
  }
}

initTables();
