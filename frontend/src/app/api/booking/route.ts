import { NextResponse } from "next/server";
import path from "path";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

const PROTO_PATH = path.resolve(process.cwd(), "../protos/booking.proto");
const BOOKING_SERVICE_ADDR = process.env.BOOKING_SERVICE_ADDR || "127.0.0.1:50053";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const bookingClient = new protoDescriptor.booking.BookingService(
  BOOKING_SERVICE_ADDR,
  grpc.credentials.createInsecure()
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    return new Promise((resolve) => {
      bookingClient.CreateBooking(body, (err: any, response: any) => {
        if (err) {
          resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response));
        }
      });
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
