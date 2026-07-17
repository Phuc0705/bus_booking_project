import cron from "node-cron";
import { db } from "./db.js";
import { createBookingRepository } from "./bookingRepository.js";
import { tripGateway } from "./circuitBreakers.js";

const bookingRepository = createBookingRepository(db);

export function startCronJobs() {
  // Chạy mỗi phút
  cron.schedule("* * * * *", async () => {
    try {
      console.log("[Cron] Checking for expired bookings...");
      const expiredBookings = await bookingRepository.getExpiredPendingBookings(15); // 15 phút
      
      for (const booking of expiredBookings) {
        console.log(`[Cron] Expiring booking ${booking.id}`);
        // 1. Release seats
        const fullBooking = await bookingRepository.getBooking(booking.id);
        if (fullBooking && fullBooking.tickets.length > 0) {
          try {
            await tripGateway.releaseSeats({ 
              trip_id: booking.trip_id, 
              seat_ids: fullBooking.tickets.map(t => t.seat_number) 
            });
          } catch (err) {
            console.error(`[Cron] Error releasing seats for booking ${booking.id}:`, err.message);
          }
        }
        
        // 2. Cập nhật trạng thái
        await bookingRepository.markBookingExpired(booking.id);
      }
    } catch (error) {
      console.error("[Cron] Error processing expired bookings:", error);
    }
  });
  console.log("Cron jobs started.");
}
