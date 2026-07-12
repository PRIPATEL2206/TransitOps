"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateDriver, useUpdateDriver } from "@/hooks/use-drivers";
import { useToast } from "@/hooks/use-toast";
import { LICENSE_TYPES } from "@/lib/constants";
import { Driver } from "@/types";

const driverSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(7, "Phone number is too short")
    .regex(/^[+\d\s()-]{7,20}$/, "Invalid phone number"),
  license_number: z
    .string()
    .min(4, "License number is required")
    .regex(/^[A-Z0-9-]{4,20}$/i, "Invalid license number format"),
  license_type: z.string().min(1, "License type is required"),
  license_expiry: z.string().min(1, "License expiry is required"),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type DriverFormData = z.infer<typeof driverSchema>;

interface DriverFormProps {
  driver?: Driver;
}

export function DriverForm({ driver }: DriverFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();

  const isEditing = !!driver;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: driver
      ? {
          first_name: driver.first_name,
          last_name: driver.last_name,
          email: driver.email,
          phone: driver.phone,
          license_number: driver.license_number,
          license_type: driver.license_type,
          license_expiry: driver.license_expiry,
          date_of_birth: driver.date_of_birth,
          address: driver.address,
          emergency_contact_name: driver.emergency_contact_name,
          emergency_contact_phone: driver.emergency_contact_phone,
          notes: driver.notes,
        }
      : {},
  });

  const watchedLicenseType = watch("license_type");

  async function onSubmit(data: DriverFormData) {
    try {
      if (isEditing && driver) {
        await updateDriver.mutateAsync({ id: driver.id, ...data });
        toast({ title: "Driver updated successfully" });
        router.push(`/drivers/${driver.id}`);
      } else {
        const created = await createDriver.mutateAsync(data);
        toast({ title: "Driver created successfully" });
        router.push(`/drivers/${created.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  const isPending = isSubmitting || createDriver.isPending || updateDriver.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input id="first_name" placeholder="John" {...register("first_name")} />
            {errors.first_name && (
              <p className="text-xs text-red-500">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="last_name">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input id="last_name" placeholder="Doe" {...register("last_name")} />
            {errors.last_name && (
              <p className="text-xs text-red-500">{errors.last_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input id="phone" placeholder="+254 700 000 000" {...register("phone")} />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Physical address" {...register("address")} />
          </div>
        </CardContent>
      </Card>

      {/* License Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">License Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="license_number">
              License Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="license_number"
              placeholder="e.g. DL-123456"
              {...register("license_number")}
            />
            {errors.license_number && (
              <p className="text-xs text-red-500">{errors.license_number.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="license_type">
              License Class <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedLicenseType}
              onValueChange={(v) => setValue("license_type", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_TYPES.map((lt) => (
                  <SelectItem key={lt.value} value={lt.value}>
                    {lt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.license_type && (
              <p className="text-xs text-red-500">{errors.license_type.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="license_expiry">
              License Expiry <span className="text-red-500">*</span>
            </Label>
            <Input
              id="license_expiry"
              type="date"
              {...register("license_expiry")}
            />
            {errors.license_expiry && (
              <p className="text-xs text-red-500">{errors.license_expiry.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="emergency_contact_name">Contact Name</Label>
            <Input id="emergency_contact_name" {...register("emergency_contact_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
            <Input id="emergency_contact_phone" {...register("emergency_contact_phone")} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Additional notes..." {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Driver" : "Create Driver"}
        </Button>
      </div>
    </form>
  );
}
