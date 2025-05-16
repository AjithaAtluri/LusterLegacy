import React from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ManageInspiration() {
  return (
    <AdminLayout title="Inspiration Gallery Management">
      <div className="space-y-6">
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Inspiration Gallery Management</h2>
          <p className="text-muted-foreground">
            This page allows you to manage inspiration gallery images that appear throughout the site.
          </p>
        </div>
        
        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The inspiration gallery management interface is being implemented. Check back soon!</p>
            <p className="mt-4">This page will allow you to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Add new inspiration images</li>
              <li>Edit image details like title, description, and category</li>
              <li>Delete unwanted inspiration images</li>
              <li>Organize images by category</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}