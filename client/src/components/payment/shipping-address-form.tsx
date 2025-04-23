import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ShippingAddressFormProps {
  currency: 'USD' | 'INR';
  onSubmit: (data: ShippingAddressFormValues) => void;
  initialValues?: Partial<ShippingAddressFormValues>;
  submitButtonText?: string;
}

// Base schema for all shipping addresses
const baseAddressSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(10, { message: 'Valid phone number is required' }),
  street: z.string().min(5, { message: 'Street address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
});

// US-specific schema
const usAddressSchema = baseAddressSchema.extend({
  state: z.string().min(2, { message: 'State is required' }),
  zipCode: z.string().min(5, { message: 'Valid ZIP code is required' }),
  country: z.literal('US'),
});

// India-specific schema
const indiaAddressSchema = baseAddressSchema.extend({
  state: z.string().min(2, { message: 'State is required' }),
  pinCode: z.string().min(6, { message: 'Valid PIN code is required' }),
  country: z.literal('IN'),
});

// Union of both schemas
export const shippingAddressSchema = z.discriminatedUnion('country', [
  usAddressSchema,
  indiaAddressSchema
]);

export type ShippingAddressFormValues = z.infer<typeof shippingAddressSchema>;

export function ShippingAddressForm({
  currency,
  onSubmit,
  initialValues,
  submitButtonText = 'Save Address'
}: ShippingAddressFormProps) {
  const defaultValues: Partial<ShippingAddressFormValues> = {
    country: currency === 'USD' ? 'US' : 'IN',
    ...initialValues
  };

  const form = useForm<ShippingAddressFormValues>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues,
  });

  // Update country field when currency changes
  React.useEffect(() => {
    form.setValue('country', currency === 'USD' ? 'US' : 'IN');
  }, [currency, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Street address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State/Province</FormLabel>
                <FormControl>
                  <Input placeholder="State/Province" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {currency === 'USD' && (
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="ZIP Code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {currency === 'INR' && (
          <FormField
            control={form.control}
            name="pinCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIN Code</FormLabel>
                <FormControl>
                  <Input placeholder="PIN Code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full mt-6">
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}