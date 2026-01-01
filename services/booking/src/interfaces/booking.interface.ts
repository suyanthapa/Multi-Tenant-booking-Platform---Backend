export interface IBooking {
  id: string;
  userId: string;
  vendorId: string;
  serviceId: string;
  bookingDate: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}
