import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const openingHoursSchema = z.object({
  monday: z
    .object({
      open: z.string().regex(timeRegex),
      close: z.string().regex(timeRegex),
    })
    .nullable(),
  tuesday: z
    .object({
      open: z.string().regex(timeRegex),
      close: z.string().regex(timeRegex),
    })
    .nullable(),
  wednesday: z
    .object({
      open: z.string().regex(timeRegex),
      close: z.string().regex(timeRegex),
    })
    .nullable(),
  thursday: z
    .object({
      open: z.string().regex(timeRegex),
      close: z.string().regex(timeRegex),
    })
    .nullable(),
  friday: z
    .object({
      open: z.string().regex(timeRegex),
      close: z.string().regex(timeRegex),
    })
    .nullable(),
  saturday: z
    .object({
      open: z.string().regex(timeRegex),
      close: z.string().regex(timeRegex),
    })
    .nullable(),
  sunday: z
    .object({
      open: z.string().regex(timeRegex),
      close: z.string().regex(timeRegex),
    })
    .nullable(),
});

// step1- Update profile schema for different business types (hotel, salon, clinic)
export const setupBasicsSchema = z.object({
  body: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("HOTEL"),
      description: z.string().min(10).max(500),
      checkInTime: z.string().regex(timeRegex, "Invalid time, use HH:mm"),
      checkOutTime: z.string().regex(timeRegex, "Invalid time, use HH:mm"),
    }),
    z.object({
      type: z.literal("SALON"),
      description: z.string().min(10).max(500),
      openingHours: openingHoursSchema,
    }),
    z.object({
      type: z.literal("CLINIC"),
      description: z.string().min(10).max(500),
      openingHours: openingHoursSchema,
    }),
  ]),
});
