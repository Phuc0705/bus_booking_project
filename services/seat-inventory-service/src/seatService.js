import { redisClient } from "./redis.js";

const HOLD_TTL_SECONDS = 900; // 15 phút

export function createSeatService() {
  return {
    async holdSeats({ trip_id, seat_ids, user_id }) {
      if (!trip_id || !seat_ids || seat_ids.length === 0) {
        throw { code: "INVALID_ARGUMENT", message: "trip_id and seat_ids are required" };
      }

      const sessionId = user_id || `guest_${Date.now()}`;
      const heldSeats = [];
      const failedSeats = [];

      for (const seatId of seat_ids) {
        const redisKey = `hold:${trip_id}:${seatId}`;
        
        // Cố gắng SET key với TTL 300 giây, chỉ thành công nếu key chưa tồn tại (NX)
        const result = await redisClient.set(redisKey, sessionId, {
          EX: HOLD_TTL_SECONDS,
          NX: true 
        });

        if (result === "OK") {
          heldSeats.push(seatId);
        } else {
          failedSeats.push(seatId);
        }
      }

      // Nếu có bất kỳ ghế nào thất bại (đã bị người khác giữ), phải rollback (xóa) các ghế vừa giữ thành công
      if (failedSeats.length > 0) {
        if (heldSeats.length > 0) {
          const keysToDelete = heldSeats.map(seatId => `hold:${trip_id}:${seatId}`);
          await redisClient.del(keysToDelete);
        }
        throw { 
          code: "ALREADY_EXISTS", 
          message: `Ghế ${failedSeats.join(", ")} đã bị người khác đặt hoặc đang giữ.` 
        };
      }

      return {
        success: true,
        message: "Giữ ghế thành công trong 5 phút"
      };
    },

    async getSeatMap({ trip_id, total_seats }) {
      // 1. Generate dynamic layout based on total_seats (fallback to 34 if not provided)
      const seatCount = total_seats > 0 ? total_seats : 34;
      const allSeats = Array.from({ length: seatCount }, (_, i) => {
        const num = i + 1;
        const seat_number = `A${num.toString().padStart(2, '0')}`;
        return {
          id: seat_number,
          seat_number: seat_number,
          status: "AVAILABLE" // Default
        };
      });

      // 2. Fetch HELD and LOCKED seats from Redis
      const [heldKeys, lockedKeys] = await Promise.all([
        redisClient.keys(`hold:${trip_id}:*`),
        redisClient.keys(`lock:${trip_id}:*`)
      ]);
      
      const heldSeatIds = heldKeys.map(key => key.split(":")[2]);
      const lockedSeatIds = lockedKeys.map(key => key.split(":")[2]);

      // 3. Overlay status
      return allSeats.map(seat => {
        if (lockedSeatIds.includes(seat.id)) {
          return { ...seat, status: "LOCKED" };
        }
        if (heldSeatIds.includes(seat.id)) {
          return { ...seat, status: "HELD" };
        }
        return seat;
      });
    },

    async lockSeats({ trip_id, seat_ids }) {
      if (!trip_id || !seat_ids || seat_ids.length === 0) {
        throw { code: "INVALID_ARGUMENT", message: "trip_id and seat_ids are required" };
      }

      for (const seatId of seat_ids) {
        const redisKey = `lock:${trip_id}:${seatId}`;
        // No expiry for locked seats
        await redisClient.set(redisKey, "ADMIN_LOCKED");
      }

      return {
        success: true,
        message: "Khóa ghế thành công"
      };
    },

    async confirmSeats({ trip_id, seat_ids }) {
      if (!trip_id || !seat_ids || seat_ids.length === 0) {
        throw { code: "INVALID_ARGUMENT", message: "trip_id and seat_ids are required" };
      }

      // Kiểm tra an toàn: Đảm bảo không ghế nào đã bị người khác khóa/mua trước đó
      const lockKeys = seat_ids.map(seatId => `lock:${trip_id}:${seatId}`);
      if (lockKeys.length > 0) {
        const existingLocks = await redisClient.mGet(lockKeys);
        if (existingLocks.some(lock => lock !== null)) {
          throw { code: "ALREADY_EXISTS", message: "Ghế đã bị người khác mua trước, vui lòng chọn ghế khác." };
        }
      }

      // Khi thanh toán xong, ghế trở thành trạng thái BOOKED vĩnh viễn
      for (const seatId of seat_ids) {
        const lockKey = `lock:${trip_id}:${seatId}`;
        const holdKey = `hold:${trip_id}:${seatId}`;
        
        // Remove from hold if it was held
        await redisClient.del(holdKey);
        
        // Set lock key to signify it is BOOKED
        await redisClient.set(lockKey, "USER_BOOKED");
      }

      return {
        success: true,
        message: "Xác nhận đặt ghế thành công"
      };
    },

    async releaseSeats({ trip_id, seat_ids }) {
      if (!trip_id || !seat_ids || seat_ids.length === 0) {
        throw { code: "INVALID_ARGUMENT", message: "trip_id and seat_ids are required" };
      }

      for (const seatId of seat_ids) {
        const lockKey = `lock:${trip_id}:${seatId}`;
        const holdKey = `hold:${trip_id}:${seatId}`;
        
        // Xóa cả hai
        await redisClient.del(lockKey);
        await redisClient.del(holdKey);
      }

      return {
        success: true,
        message: "Giải phóng ghế thành công"
      };
    }
  };
}